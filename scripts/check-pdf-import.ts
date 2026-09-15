/**
 * Confere o parse de PDFs do C6 (spec 001) SEM tocar no banco.
 *   npx tsx scripts/check-pdf-import.ts <arquivo.pdf> [mesmo-período.csv]
 * - fatura: soma dos lançamentos de cada cartão × "Subtotal deste cartão" impresso;
 * - extrato: entradas/saídas de cada mês × cabeçalho "Entradas: R$ … • Saídas: R$ …";
 * - com CSV: compara as chaves de dedup (data|descrição normalizada|valor) dentro do período do CSV.
 * Sai com código 1 se alguma conferência falhar.
 */
import { readFileSync } from "fs";
import { basename } from "path";
import { parseFile } from "../src/lib/import/parse";
import { extractPdfText } from "../src/lib/import/pdf-text";
import { normalizeDescription } from "../src/lib/import/util";
import { parseToCents } from "../src/lib/money";
import type { ParsedTransaction } from "../src/lib/import/types";

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const chave = (t: ParsedTransaction) =>
  `${t.date.toISOString().slice(0, 10)}|${normalizeDescription(t.description)}|${t.amountCents}`;

async function main() {
  const [pdfPath, csvPath] = process.argv.slice(2);
  if (!pdfPath) throw new Error("uso: check-pdf-import.ts <arquivo.pdf> [csv]");
  const buf = readFileSync(pdfPath);
  const r = await parseFile(buf, basename(pdfPath));
  let falhas = 0;
  console.log(`\n# ${basename(pdfPath)} → ${r.source} · ${r.transactions.length} lançamentos · erros ${r.errorRows}`);
  if (r.errorRows) falhas++;
  if (r.balance) console.log(`  saldo: ${brl(r.balance.cents)} em ${r.balance.date.toISOString().slice(0, 10)}`);

  const cartoes = (r as { cartoes?: { final: string; titular: string; subtotalCents: number; somaCents: number }[] }).cartoes;
  for (const c of cartoes ?? []) {
    const ok = c.subtotalCents === c.somaCents;
    if (!ok) falhas++;
    console.log(`  ${ok ? "✅" : "❌"} cartão ${c.final} (${c.titular}): lido ${brl(c.somaCents)} × impresso ${brl(c.subtotalCents)}`);
  }

  if (r.source === "c6_extrato") {
    const texto = await extractPdfText(buf, { columns: true });
    const cab = [...texto.matchAll(/\(\s*\d{2}\/(\d{2})\/(\d{4})[^)]*\)\s*Entradas:\s*R\$\s*([\d.,]+)\s*•\s*Sa[íi]das:\s*R\$\s*([\d.,]+)/g)];
    for (const [, mm, aaaa, ent, sai] of cab) {
      const doMes = r.transactions.filter((t) => t.date.toISOString().slice(0, 7) === `${aaaa}-${mm}`);
      const e = doMes.filter((t) => t.amountCents > 0).reduce((s, t) => s + t.amountCents, 0);
      const s = -doMes.filter((t) => t.amountCents < 0).reduce((acc, t) => acc + t.amountCents, 0);
      const ok = e === parseToCents(ent) && s === parseToCents(sai);
      if (!ok) falhas++;
      console.log(`  ${ok ? "✅" : "❌"} ${mm}/${aaaa}: entradas ${brl(e)} (impresso ${ent}) · saídas ${brl(s)} (impresso ${sai})`);
    }
  }

  if (csvPath) {
    const c = await parseFile(readFileSync(csvPath), basename(csvPath));
    const ini = c.transactions.reduce((m, t) => (t.date < m ? t.date : m), c.transactions[0].date);
    const fim = c.transactions.reduce((m, t) => (t.date > m ? t.date : m), c.transactions[0].date);
    const noPeriodo = r.transactions.filter((t) => t.date >= ini && t.date <= fim);
    const conta = (ts: ParsedTransaction[]) => ts.reduce((m, t) => m.set(chave(t), (m.get(chave(t)) ?? 0) + 1), new Map<string, number>());
    const a = conta(noPeriodo);
    const b = conta(c.transactions);
    const soPdf = [...a].filter(([k, n]) => n > (b.get(k) ?? 0)).map(([k]) => k);
    const soCsv = [...b].filter(([k, n]) => n > (a.get(k) ?? 0)).map(([k]) => k);
    const ok = !soPdf.length && !soCsv.length;
    if (!ok) falhas++;
    console.log(`  ${ok ? "✅" : "❌"} × ${basename(csvPath)}: ${noPeriodo.length} no PDF / ${c.transactions.length} no CSV (período do CSV)`);
    soPdf.slice(0, 8).forEach((k) => console.log(`     só no PDF: ${k}`));
    soCsv.slice(0, 8).forEach((k) => console.log(`     só no CSV: ${k}`));
  }
  process.exitCode = falhas ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
