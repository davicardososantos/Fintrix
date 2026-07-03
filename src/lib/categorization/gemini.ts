/**
 * Categorização por IA (Google Gemini), server-side. Recebe descrições e a lista de categorias
 * permitidas; devolve um mapa descrição → categoria. Em QUALQUER erro (sem chave, timeout, HTTP,
 * JSON inválido) retorna vazio — o pipeline então cai no fallback por regra/"uncategorized".
 * Privacidade: envia só a descrição e a lista de categorias, nada de nomes/contas.
 */
export async function categorizeWithGemini(
  descriptions: string[],
  categories: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const key = process.env.GEMINI_API_KEY;
  if (!key || descriptions.length === 0) return result;

  const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const list = descriptions.map((d, i) => `${i}: ${d}`).join("\n");
  const prompt = `Você categoriza transações financeiras de um app de finanças pessoais (pt-BR).
Categorias permitidas (use EXATAMENTE uma destas, ou "Outros" se nenhuma servir):
${categories.join(", ")}

Para cada transação abaixo (formato "índice: descrição"), escolha a melhor categoria.
Responda SOMENTE um JSON no formato: {"results":[{"i":0,"category":"Transporte"}, ...]}

Transações:
${list}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0, responseMimeType: "application/json" },
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.error("[gemini] HTTP", res.status, await res.text().catch(() => ""));
      return result;
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return result;

    const parsed = JSON.parse(text) as { results?: { i: number; category: string }[] };
    const allowed = new Set(categories);
    for (const item of parsed.results ?? []) {
      const desc = descriptions[item.i];
      if (desc && allowed.has(item.category)) result.set(desc, item.category);
    }
  } catch (e) {
    console.error("[gemini] fallback:", (e as Error).message);
  }

  return result;
}
