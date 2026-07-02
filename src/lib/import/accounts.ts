import { prisma } from "@/lib/db";
import type { AccountKey } from "./types";

/**
 * Acha (ou cria) a conta/fonte financeira do household a partir da AccountKey do parser.
 * Único por (householdId, name).
 */
export async function getOrCreateAccount(householdId: string, key: AccountKey) {
  return prisma.financialAccount.upsert({
    where: { householdId_name: { householdId, name: key.name } },
    update: {},
    create: {
      householdId,
      name: key.name,
      type: key.type,
      institution: key.institution,
      last4: key.last4,
    },
  });
}
