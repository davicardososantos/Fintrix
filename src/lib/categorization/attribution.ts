import { normalizeDescription } from "@/lib/import/util";

type SimpleUser = { id: string; name: string };

/**
 * Auto-atribuição por pista do arquivo (spec 003). Casa o `ownerHint` (ex.: "DAVI CARDOSO" do
 * Nome no Cartão) com um usuário do household pelo primeiro nome. Retorna o userId ou null (casal).
 */
export function matchOwner(ownerHint: string | null | undefined, users: SimpleUser[]): string | null {
  if (!ownerHint) return null;
  const hint = normalizeDescription(ownerHint);

  for (const u of users) {
    const first = normalizeDescription(u.name).split(" ")[0];
    if (first && first.length >= 3 && hint.includes(first)) return u.id;
  }
  return null;
}
