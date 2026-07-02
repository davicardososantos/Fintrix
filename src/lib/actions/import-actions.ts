"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { importBuffer, ImportError, type ImportSummary } from "@/lib/import/import-service";

export type ImportState = {
  ok?: boolean;
  error?: string;
  summary?: ImportSummary;
};

/** Server Action da tela /importar: recebe o arquivo e retorna o resumo da importação. */
export async function importFileAction(
  _prev: ImportState | undefined,
  formData: FormData,
): Promise<ImportState> {
  const session = await auth();
  if (!session?.user?.householdId) {
    return { ok: false, error: "Sessão inválida. Faça login novamente." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione um arquivo para importar." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const summary = await importBuffer(
      session.user.householdId,
      session.user.id,
      file.name,
      buffer,
    );
    revalidatePath("/dashboard");
    revalidatePath("/transacoes");
    return { ok: true, summary };
  } catch (e) {
    if (e instanceof ImportError) return { ok: false, error: e.message };
    console.error("[import] erro inesperado:", e);
    return { ok: false, error: "Não foi possível importar o arquivo. Verifique o formato e tente novamente." };
  }
}
