/**
 * Simple token counter utility
 * Uses rough estimation: 1 token ≈ 4 characters
 * For more accurate counting, can integrate tiktoken library later
 */

export function countTokens(text: string): number {
  if (!text) return 0;

  // Rough estimation: 1 token ≈ 4 characters
  // This is a simplification but works well enough for MVP
  return Math.ceil(text.length / 4);
}

export function formatTokenCount(count: number): string {
  if (count < 1000) {
    return `${count} tokens`;
  }
  return `${(count / 1000).toFixed(1)}k tokens`;
}
