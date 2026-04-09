export function normalizeEol(s: string): string {
  return s.replace(/\r\n/g, '\n');
}