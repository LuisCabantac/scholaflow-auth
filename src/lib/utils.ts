export function generateClassCode(): string {
  return Array.from(
    { length: 8 },
    () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
  ).join("");
}

export function extractImagePath(url: string): string {
  const match = url.match(/\/([^\/]+)$/);
  return match ? match[1] : "";
}

export function extractCommentFilePath(url: string): string {
  const match = url.match(/\/comments\/(.+)/);
  return match![1];
}

export function extractNoteFilePath(url: string): string {
  const match = url.match(/\/notes\/(.+)/);
  return match![1];
}

export function extractAvatarFilePath(url: string): string {
  const match = url.match(/\/avatars\/(.+)/);
  return match![1];
}

export function extractStreamFilePath(url: string): string {
  const match = url.match(/\/streams\/(.+)/);
  return match![1];
}

export function extractClassworkFilePath(url: string): string {
  const match = url.match(/\/classworks\/(.+)/);
  return match![1];
}

export function extractMessagesFilePath(url: string): string {
  const match = url.match(/\/messages\/(.+)/);
  return match![1];
}
