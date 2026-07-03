import { prisma } from "@/lib/db";
import type { CategorySource } from "@prisma/client";
import { ensureSeedCategories, ensureDefaultRules, C6_CATEGORY_MAP } from "./seed";
import { matchRule } from "./rules";
import { matchOwner } from "./attribution";
import { categorizeWithGemini } from "./gemini";

export type CategorizeResult = {
  processed: number;
  byC6: number;
  byRule: number;
  byAi: number;
  uncategorized: number;
  attributed: number;
  categorizedTotal: number;
  coveragePct: number;
};

/**
 * Pipeline de categorização (spec 002): C6 (rawCategory) → regra → Gemini → fallback.
 * NUNCA rebaixa categoria/atribuição feita à mão (categorySource="manual" / ownerManual=true).
 * Também faz a auto-atribuição por ownerHint (spec 003). Idempotente e tolerante a falha da IA.
 */
export async function categorizeHousehold(householdId: string): Promise<CategorizeResult> {
  const categoryByName = await ensureSeedCategories(householdId);
  await ensureDefaultRules(householdId, categoryByName);

  const [rules, users] = await Promise.all([
    prisma.categoryRule.findMany({ where: { householdId } }),
    prisma.user.findMany({ where: { householdId }, select: { id: true, name: true } }),
    ]);

  // Transações elegíveis: tudo que não foi categorizado à mão.
  const txs = await prisma.transaction.findMany({
    where: { householdId, categorySource: { not: "manual" } },
    select: {
      id: true,
      description: true,
      rawCategory: true,
      ownerId: true,
      ownerHint: true,
      ownerManual: true,
    },
  });

  const updates = new Map<
    string,
    { categoryId?: string | null; categorySource?: CategorySource; ownerId?: string | null }
  >();

  const forAi: { id: string; description: string }[] = [];
  let byC6 = 0;
  let byRule = 0;

  for (const t of txs) {
    // 1) C6 (categoria nativa da fatura)
    const c6Name = t.rawCategory ? C6_CATEGORY_MAP[t.rawCategory] : undefined;
    const c6Id = c6Name ? categoryByName.get(c6Name) : undefined;
    if (c6Id) {
      updates.set(t.id, { categoryId: c6Id, categorySource: "c6" });
      byC6++;
    } else {
      // 2) regra por palavra-chave
      const ruleCat = matchRule(t.description, rules);
      if (ruleCat) {
        updates.set(t.id, { categoryId: ruleCat, categorySource: "rule" });
        byRule++;
      } else {
        forAi.push({ id: t.id, description: t.description });
      }
    }

    // Auto-atribuição (não sobrescreve manual)
    if (!t.ownerManual && !t.ownerId) {
      const ownerId = matchOwner(t.ownerHint, users);
      if (ownerId) {
        const prev = updates.get(t.id) ?? {};
        updates.set(t.id, { ...prev, ownerId });
      }
    }
  }

  // 3) Gemini para o restante (em lote, deduplicando descrições)
  let byAi = 0;
  if (forAi.length > 0) {
    const uniqueDescriptions = [...new Set(forAi.map((f) => f.description))];
    const categoryNames = [...categoryByName.keys()];
    const aiMap = await categorizeWithGemini(uniqueDescriptions, categoryNames);

    for (const f of forAi) {
      const catName = aiMap.get(f.description);
      const catId = catName ? categoryByName.get(catName) : undefined;
      if (catId) {
        const prev = updates.get(f.id) ?? {};
        updates.set(f.id, { ...prev, categoryId: catId, categorySource: "ai" });
        byAi++;
      }
    }
  }

  // Persiste as mudanças
  let attributed = 0;
  await prisma.$transaction(
    [...updates.entries()].map(([id, u]) => {
      if (u.ownerId) attributed++;
      return prisma.transaction.update({ where: { id }, data: u });
    }),
  );

  const categorizedTotal = await prisma.transaction.count({
    where: { householdId, categorySource: { not: "uncategorized" } },
  });
  const total = await prisma.transaction.count({ where: { householdId } });

  return {
    processed: txs.length,
    byC6,
    byRule,
    byAi,
    uncategorized: forAi.length - byAi,
    attributed,
    categorizedTotal,
    coveragePct: total > 0 ? Math.round((categorizedTotal / total) * 100) : 0,
  };
}
