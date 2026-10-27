export function getScoreColor(score: number): string {
  if (score >= 80) {
    return '#10b981'
  }
  if (score >= 60) {
    return '#f59e0b'
  }
  return '#ef4444'
}

export function formatParagraphs(text: string): string {
  if (!text) {
    return text
  }
  if (/\n\s*\n/.test(text)) {
    return text
  }
  if (text.length > 60 && !text.includes('\n')) {
    return text.replace(/([。！？])([^。！？]+[。！？])/g, '$1\n$2')
  }
  return text
}
