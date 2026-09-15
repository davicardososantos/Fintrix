import { parseToCents } from "@/lib/money";
import { C6_CARTAO } from "./fatura";
import type { ParseResult, ParsedTransaction } from "./types";

const MES_ABREV: Record<string, number> = {
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
};

const utcNoon = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 12));

// "Lembrando: nesta fatura serão lançadas apenas transações feitas até 03/08/26." → fechamento.
const FECHAMENTO = /transa[çc][õo]es feitas at[ée] (\d{2})\/(\d{2})\/(\d{2,4})/i;
// "C6 Carbon Virtual Final 7514 - DAVI CARDOSO⇥Subtotal deste cartão R$ 2.813,75"
const CARTAO = /Final (\d{4}) - ([^\t]+?)\s*\t?\s*Subtotal deste cart[ãa]o R\$\s*(-?[\d.]+,\d{2})/i;
// "04 jul⇥HAMBURGUERIA ROBO REST⇥117,87" (+ sufixo opcional "USD 21,97 | Cotação…" ou "IOF…")
const LINHA = /^(\d{2}) ([a-zç]{3})\t(.+)\t(-?[\d.]+,\d{2})(.*)$/i;
// Pagamentos da fatura anterior aparecem como "Inclusao de Pagamento" ou "Pag Fatura Boleto".
const PAGAMENTO = /^(Inclus[ãa]o de Pagamento|Pag(amento)? Fatura)\b/i;

export type CartaoPdf = { final: string; titular: string; subtotalCents: number; somaCents: number };

/**
 * Parser da fatura do cartão C6 em PDF, a partir do texto extraído com colunas (pdf-text.ts).
 * Reproduz as convenções do CSV (fatura.ts) para o dedup casar os dois formatos:
 * - "X - Parcela 3/10" → descrição "X", parcela "3/10"; sem parcela → "Única";
 * - "X - Estorno" → descrição "X", crédito;
 * - pagamento da fatura ("Inclusao de Pagamento", "Pag Fatura Boleto") → crédito, fora do subtotal;
 * - IOF de compra no exterior: linha própria com a descrição do estabelecimento (sem fx);
 * - compra em dólar: valor em R$ + fxAmountCents (US$);
 * - ownerHint = titular do cartão da seção ("DAVI CARDOSO", "AMANDA SALES").
 * A data da compra só traz dia/mês: o ano é o da ocorrência mais recente que não passe do
 * fechamento da fatura ("transações feitas até DD/MM/AA").
 * O PDF não traz a Categoria do C6 — essas compras são categorizadas por regra/IA (spec 002).
 */
export function parseFaturaPdf(text: string): ParseResult & { cartoes: CartaoPdf[] } {
  const fech = text.match(FECHAMENTO);
  const anoFech = fech ? Number(fech[3].length === 2 ? `20${fech[3]}` : fech[3]) : new Date().getUTCFullYear();
  const mesFech = fech ? Number(fech[2]) : new Date().getUTCMonth() + 1;
  const diaFech = fech ? Number(fech[1]) : 31;

  const transactions: ParsedTransaction[] = [];
  const cartoes: CartaoPdf[] = [];
  let atual: CartaoPdf | null = null;
  let errorRows = 0;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const c = line.match(CARTAO);
    if (c) {
      atual = { final: c[1], titular: c[2].trim(), subtotalCents: parseToCents(c[3]), somaCents: 0 };
      cartoes.push(atual);
      continue;
    }
    const m = line.match(LINHA);
    if (!m) continue;
    const mes = MES_ABREV[m[2].toLowerCase()];
    if (!mes || !atual) {
      errorRows++;
      continue;
    }

    let desc = m[3].replace(/\t/g, " ").replace(/\s+/g, " ").trim();
    const resto = m[5] ?? "";
    let installment = "Única";
    // Pagamento da fatura anterior: crédito, mas fora do "Subtotal deste cartão".
    const pagamento = PAGAMENTO.test(desc);
    let credito = pagamento;

    const parcela = desc.match(/^(.*?)\s*-\s*Parcela (\d+\/\d+)$/i);
    if (parcela) {
      desc = parcela[1];
      installment = parcela[2];
    }
    const estorno = desc.match(/^(.*?)\s*-\s*Estorno$/i);
    if (estorno) {
      desc = estorno[1];
      credito = true;
    }

    // Ano: a data mais recente com esse dia/mês que não passe do fechamento. Vale para compra comum,
    // parcela com data da compra original (SHEIN 3/3 de nov na fatura de fev) e parcela com data de
    // lançamento (Anuidade 12/12 de jul na fatura de ago).
    const dia = Number(m[1]);
    const ano = mes > mesFech || (mes === mesFech && dia > diaFech) ? anoFech - 1 : anoFech;

    const magnitude = parseToCents(m[4]);
    const amountCents = credito ? magnitude : -magnitude;
    if (!pagamento) atual.somaCents += credito ? -magnitude : magnitude;

    const usd = resto.match(/USD\s*([\d.]+,\d{2})/i);
    transactions.push({
      date: utcNoon(ano, mes, dia),
      description: desc,
      rawDescription: desc,
      amountCents,
      currency: "BRL",
      ownerHint: atual.titular,
      installment,
      ...(usd ? { fxAmountCents: credito ? parseToCents(usd[1]) : -parseToCents(usd[1]), fxCurrency: "USD" } : {}),
    });
  }

  const datas = transactions.map((t) => t.date).sort((a, b) => a.getTime() - b.getTime());
  return {
    source: "c6_fatura",
    account: C6_CARTAO,
    transactions,
    periodStart: datas[0],
    periodEnd: datas[datas.length - 1],
    errorRows,
    cartoes,
  };
}
