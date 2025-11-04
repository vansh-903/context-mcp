import type { ContextEntry } from '../storage/storage-interface';

export interface SummaryResult {
  content: string;
  originalTokens: number;
  summaryTokens: number;
  compressionRatio: number;
  summarized: boolean;
}

export class Summarizer {
  private readonly TARGET_TOKENS = 2500;
  private readonly CHARS_PER_TOKEN = 4;

  countTokens(text: string): number {
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  shouldSummarize(contexts: ContextEntry[], sourceLLM?: string, targetLLM?: string, maxTokens?: number): boolean {
    const totalTokens = contexts.reduce((sum, ctx) => sum + ctx.token_count, 0);
    const target = maxTokens || this.TARGET_TOKENS;

    if (sourceLLM && targetLLM && sourceLLM !== targetLLM) {
      return true;
    }

    if (totalTokens > 4000) {
      return true;
    }

    return false;
  }

  summarize(contexts: ContextEntry[], targetTokens: number = this.TARGET_TOKENS): SummaryResult {
    const originalContent = this.buildFullContext(contexts);
    const originalTokens = this.countTokens(originalContent);

    if (originalTokens <= targetTokens) {
      return {
        content: originalContent,
        originalTokens,
        summaryTokens: originalTokens,
        compressionRatio: 1.0,
        summarized: false
      };
    }

    const summary = this.extractKeyInformation(contexts, targetTokens);
    const summaryTokens = this.countTokens(summary);

    return {
      content: summary,
      originalTokens,
      summaryTokens,
      compressionRatio: summaryTokens / originalTokens,
      summarized: true
    };
  }

  private buildFullContext(contexts: ContextEntry[]): string {
    const grouped = this.groupByType(contexts);
    let content = '';

    if (grouped.summary.length > 0) {
      content += '# Previous Conversations\n\n';
      grouped.summary.forEach(ctx => {
        const source = ctx.source_llm ? `[${ctx.source_llm}]` : '';
        content += `${source} ${ctx.content}\n\n`;
      });
    }

    if (grouped.decision.length > 0) {
      content += '# Key Decisions\n\n';
      grouped.decision.forEach(ctx => {
        content += `- ${ctx.content}\n`;
      });
      content += '\n';
    }

    if (grouped.code.length > 0) {
      content += '# Code Snippets\n\n';
      grouped.code.forEach(ctx => {
        content += `${ctx.content}\n\n`;
      });
    }

    if (grouped.preference.length > 0) {
      content += '# User Preferences\n\n';
      grouped.preference.forEach(ctx => {
        content += `- ${ctx.content}\n`;
      });
      content += '\n';
    }

    if (grouped.note.length > 0) {
      content += '# Notes\n\n';
      grouped.note.forEach(ctx => {
        content += `- ${ctx.content}\n`;
      });
      content += '\n';
    }

    return content.trim();
  }

  private extractKeyInformation(contexts: ContextEntry[], targetTokens: number): string {
    const sorted = [...contexts].sort((a, b) => b.created_at - a.created_at);
    const grouped = this.groupByType(sorted);

    let summary = '';
    let currentTokens = 0;

    const addSection = (title: string, items: ContextEntry[], formatter: (ctx: ContextEntry) => string) => {
      if (items.length === 0 || currentTokens >= targetTokens) return;

      let section = `# ${title}\n\n`;
      const sectionTokens = this.countTokens(section);

      if (currentTokens + sectionTokens > targetTokens) return;

      summary += section;
      currentTokens += sectionTokens;

      for (const item of items) {
        const line = formatter(item);
        const tokens = this.countTokens(line);

        if (currentTokens + tokens > targetTokens) break;

        summary += line;
        currentTokens += tokens;
      }

      summary += '\n';
    };

    addSection('Key Decisions', grouped.decision, (ctx) =>
      `- ${this.truncate(ctx.content, 200)}\n`
    );

    addSection('User Preferences', grouped.preference, (ctx) =>
      `- ${this.truncate(ctx.content, 150)}\n`
    );

    const recentSummaries = grouped.summary.slice(0, 3);
    addSection('Recent Conversations', recentSummaries, (ctx) => {
      const source = ctx.source_llm ? `[${ctx.source_llm}] ` : '';
      const content = this.extractMainPoints(ctx.content);
      return `${source}${content}\n\n`;
    });

    const recentCode = grouped.code.slice(0, 2);
    addSection('Recent Code', recentCode, (ctx) =>
      `${this.truncate(ctx.content, 300)}\n\n`
    );

    if (grouped.note.length > 0 && currentTokens < targetTokens * 0.9) {
      addSection('Notes & TODOs', grouped.note.slice(0, 5), (ctx) =>
        `- ${this.truncate(ctx.content, 100)}\n`
      );
    }

    if (summary.trim().length === 0) {
      const latest = sorted[0];
      return this.truncate(latest?.content || 'No context available', targetTokens * this.CHARS_PER_TOKEN);
    }

    return summary.trim();
  }

  private groupByType(contexts: ContextEntry[]): Record<string, ContextEntry[]> {
    return {
      summary: contexts.filter(c => c.entry_type === 'summary'),
      decision: contexts.filter(c => c.entry_type === 'decision'),
      code: contexts.filter(c => c.entry_type === 'code'),
      preference: contexts.filter(c => c.entry_type === 'preference'),
      note: contexts.filter(c => c.entry_type === 'note')
    };
  }

  private extractMainPoints(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    const keyPhrases = [
      'decided', 'choose', 'will use', 'implemented', 'created',
      'TODO', 'FIXME', 'important', 'key', 'main', 'problem', 'solution'
    ];

    const important = sentences.filter(s =>
      keyPhrases.some(phrase => s.toLowerCase().includes(phrase))
    );

    if (important.length > 0) {
      return important.slice(0, 3).join('. ') + '.';
    }

    return sentences.slice(0, 2).join('. ') + '.';
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}
