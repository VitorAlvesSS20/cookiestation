const bannedWords = [
  "porn",
  "sexo",
  "xxx",
  "nsfw",
  "hentai"
];

export const isContentAllowed = (text: string) => {
  const lower = text.toLowerCase();
  return !bannedWords.some(word => lower.includes(word));
};