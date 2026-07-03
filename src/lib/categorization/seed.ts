import { prisma } from "@/lib/db";
import type { CategoryKind } from "@prisma/client";

/**
 * Categorias-semente do household (spec 002). `color` guarda um TOKEN do tema (não hex),
 * conforme a constituição. Tokens usados em categoria: primary/accent/investment/points/warning/muted.
 */
export const DEFAULT_CATEGORIES: {
  name: string;
  kind: CategoryKind;
  color: string;
}[] = [
  { name: "Transporte", kind: "expense", color: "investment" },
  { name: "Supermercado", kind: "expense", color: "primary" },
  { name: "Restaurante", kind: "expense", color: "warning" },
  { name: "Saúde", kind: "expense", color: "points" },
  { name: "Moradia & Contas", kind: "expense", color: "accent" },
  { name: "Lazer", kind: "expense", color: "points" },
  { name: "Serviços", kind: "expense", color: "investment" },
  { name: "Vestuário", kind: "expense", color: "accent" },
  { name: "Compras", kind: "expense", color: "primary" },
  { name: "Taxas & Tarifas", kind: "expense", color: "warning" },
  { name: "Renda", kind: "income", color: "primary" },
  { name: "Transferências", kind: "transfer", color: "muted" },
  { name: "Investimento", kind: "investment", color: "investment" },
  { name: "Outros", kind: "expense", color: "muted" },
];

/** Mapa das categorias nativas da fatura C6 → categorias canônicas do Fintrix. */
export const C6_CATEGORY_MAP: Record<string, string> = {
  Transporte: "Transporte",
  "Supermercados / Mercearia / Padarias / Lojas de Conveniência": "Supermercado",
  "Restaurante / Lanchonete / Bar": "Restaurante",
  "Serviços Profissionais": "Serviços",
  "Assistência médica e odontológica": "Saúde",
  "Vestuário / Roupas": "Vestuário",
  Elétrico: "Compras",
  Associação: "Serviços",
  "Relacionados a Automotivo": "Transporte",
  "Especialidade varejo": "Compras",
};

/** Regras padrão por palavra-chave (para extrato/Alelo). pattern é comparado em MAIÚSCULAS. */
export const DEFAULT_RULES: { pattern: string; category: string; priority: number }[] = [
  { pattern: "METRO", category: "Transporte", priority: 10 },
  { pattern: "PEDAGIO", category: "Transporte", priority: 10 },
  { pattern: "C6TAG", category: "Transporte", priority: 10 },
  { pattern: "POSTO", category: "Transporte", priority: 20 },
  { pattern: "MOBILITE", category: "Transporte", priority: 20 },
  { pattern: "IOF", category: "Taxas & Tarifas", priority: 10 },
  { pattern: "ANUIDADE", category: "Taxas & Tarifas", priority: 10 },
  { pattern: "TARIFA", category: "Taxas & Tarifas", priority: 10 },
  { pattern: "SEGURO", category: "Taxas & Tarifas", priority: 20 },
  { pattern: "PORTOSEG", category: "Taxas & Tarifas", priority: 20 },
  { pattern: "ENEL", category: "Moradia & Contas", priority: 10 },
  { pattern: "TELEFONICA", category: "Moradia & Contas", priority: 10 },
  { pattern: "VIVO", category: "Moradia & Contas", priority: 20 },
  { pattern: "RECARGA CELULAR", category: "Moradia & Contas", priority: 10 },
  { pattern: "PANIFICADORA", category: "Supermercado", priority: 20 },
  { pattern: "SUPERMERCAD", category: "Supermercado", priority: 10 },
  { pattern: "ATACAD", category: "Supermercado", priority: 20 },
  { pattern: "ASSAI", category: "Supermercado", priority: 20 },
  { pattern: "SENDAS", category: "Supermercado", priority: 20 },
  { pattern: "SWIFT", category: "Supermercado", priority: 20 },
  { pattern: "HIP BERGAMINI", category: "Supermercado", priority: 20 },
  { pattern: "PGTO FAT CARTAO", category: "Transferências", priority: 10 },
  { pattern: "INCLUSAO DE PAGAMENTO", category: "Transferências", priority: 10 },
  { pattern: "PIX ENVIADO", category: "Transferências", priority: 30 },
  { pattern: "TRANSF ENVIADA", category: "Transferências", priority: 30 },
  { pattern: "TRANSFERENCIA ENVIADA", category: "Transferências", priority: 30 },
  { pattern: "PIX RECEBIDO", category: "Renda", priority: 30 },
  { pattern: "TRANSFERENCIA RECEBIDA", category: "Renda", priority: 30 },
  { pattern: "BENEFICIO", category: "Renda", priority: 10 },
  { pattern: "REMUNERACAO", category: "Renda", priority: 20 },
  { pattern: "RENDIMENTO", category: "Renda", priority: 20 },
];

/** Cria (se não existirem) as categorias-semente e retorna um mapa nome → id. */
export async function ensureSeedCategories(householdId: string): Promise<Map<string, string>> {
  const existing = await prisma.category.findMany({ where: { householdId } });
  const byName = new Map(existing.map((c) => [c.name, c.id]));

  const missing = DEFAULT_CATEGORIES.filter((c) => !byName.has(c.name));
  if (missing.length > 0) {
    await prisma.category.createMany({
      data: missing.map((c) => ({ householdId, name: c.name, kind: c.kind, color: c.color })),
      skipDuplicates: true,
    });
    const refreshed = await prisma.category.findMany({ where: { householdId } });
    return new Map(refreshed.map((c) => [c.name, c.id]));
  }
  return byName;
}

/** Cria as regras padrão para o household, se ainda não houver regra alguma. */
export async function ensureDefaultRules(
  householdId: string,
  categoryByName: Map<string, string>,
): Promise<void> {
  const count = await prisma.categoryRule.count({ where: { householdId } });
  if (count > 0) return;

  const data = DEFAULT_RULES.map((r) => {
    const categoryId = categoryByName.get(r.category);
    return categoryId
      ? { householdId, matchType: "contains" as const, pattern: r.pattern, categoryId, priority: r.priority }
      : null;
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  if (data.length > 0) await prisma.categoryRule.createMany({ data });
}
