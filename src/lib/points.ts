// Sugestões e cores dos programas de pontos. Sem import do prisma: este módulo
// é usado tanto no servidor quanto no formulário ("use client").

/** Programas oferecidos no dropdown. O usuário pode digitar qualquer outro. */
export const POINTS_SUGGESTIONS = [
  "Smiles",
  "Livelo",
  "TudoAzul",
  "LATAM Pass",
  "C6 Átomos",
] as const;

/** Valor do <select> que abre o campo de texto livre. */
export const POINTS_OTHER = "__outro__";

export const POINTS_NAME_MAX = 40;

const KNOWN_COLOR: Record<string, string> = {
  Smiles: "warning",
  Livelo: "points",
  TudoAzul: "investment",
  "LATAM Pass": "accent",
  "C6 Átomos": "primary",
};

// Tokens do tema (ver TOKEN_BG em components/category-badge).
const PALETTE = ["primary", "accent", "investment", "points", "warning"];

/** Token de cor do programa: fixo para os conhecidos, estável para os demais. */
export function pointsColor(name: string): string {
  const known = KNOWN_COLOR[name];
  if (known) return known;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return PALETTE[hash % PALETTE.length];
}
