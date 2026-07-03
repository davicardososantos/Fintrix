import type { CategoryRule } from "@prisma/client";
import { normalizeDescription } from "@/lib/import/util";

/**
 * Avalia as regras (por prioridade asc) contra uma descrição já normalizada (MAIÚSCULAS).
 * Retorna o categoryId da primeira regra que casar, ou null.
 */
export function matchRule(description: string, rules: CategoryRule[]): string | null {
  const desc = normalizeDescription(description);
  const ordered = [...rules].sort((a, b) => a.priority - b.priority);

  for (const rule of ordered) {
    const pattern = normalizeDescription(rule.pattern);
    let hit = false;
    if (rule.matchType === "contains") hit = desc.includes(pattern);
    else if (rule.matchType === "equals") hit = desc === pattern;
    else if (rule.matchType === "regex") {
      try {
        hit = new RegExp(rule.pattern, "i").test(description);
      } catch {
        hit = false;
      }
    }
    if (hit) return rule.categoryId;
  }
  return null;
}
