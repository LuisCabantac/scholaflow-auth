export const generateClassCode = (): string =>
  Array.from(
    { length: 8 },
    () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
  ).join("");
