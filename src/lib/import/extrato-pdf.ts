import { parseToCents } from "@/lib/money";
import { C6_CONTA } from "./extrato";
import type { ParseResult, ParsedTransaction } from "./types";

const MESES: Record<string, number> = {
  janeiro: 1, fevereiro: 2, marco: 3, março: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

const utcNoon = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 12));

/** "15 de setembro de 2026" → Date (meio-dia UTC). */
function parseDataExtenso(dia: string, mes: string, ano: string): Date | undefined {
  const m = MESES[mes.toLowerCase()];
  return m ? utcNoon(Number(ano), m, Number(dia)) : undefined;
}

// Seção de mês: "Outubro 2025⇥( 01/10/2025 - 31/10/2025 )⇥Entradas: R$ …⇥•⇥Saídas: R$ …"
// — dá o ano das linhas "DD/MM" que vêm depois.
const SECAO = /\(\s*(\d{2})\/(\d{2})\/(\d{4})\s*-\s*\d{2}\/\d{2}\/\d{4}\s*\)/;
// Lançamento (texto extraído com colunas): "16/09⇥16/09⇥Saída PIX⇥Pix enviado para X⇥-R$ 218,01"
const LINHA = /^(\d{2})\/(\d{2})\t\d{2}\/\d{2}\t([^\t]+)\t(.+)\t(-?)\s*R\$\s*([\d.]+,\d{2})$/;
// Descrição longa quebra em várias linhas: "12/06⇥12/06⇥Saída PIX" / "Pix enviado para …" / "… MINAS" / "-R$ 20,00".
const INICIO_QUEBRADO = /^(\d{2})\/(\d{2})\t\d{2}\/\d{2}\t([^\t]+)$/;
const FIM_QUEBRADO = /^(?:(.+)\t)?(-?)\s*R\$\s*([\d.]+,\d{2})$/;
// No CSV, compra no débito tem Título "DEBITO DE CARTAO" e o estabelecimento na Descrição; o PDF
// mostra o estabelecimento na coluna Descrição. Para o dedup casar, seguimos o CSV.
const DEBITO_CARTAO = /^D[ée]bito de Cart[ãa]o$/i;
const PERIODO = /Per[íi]odo\s*•\s*(\d{1,2}) de (\S+) de (\d{4}) at[ée] (\d{1,2}) de (\S+) de (\d{4})/i;
const SALDO = /Saldo do dia\s*•\s*(\d{1,2}) de (\S+) de (\d{4})\s*•\s*(-?)\s*R\$\s*([\d.]+,\d{2})/i;

/**
 * Parser do extrato de conta C6 em PDF ("Extrato exportado no dia…"), a partir do texto extraído
 * com colunas (pdf-text.ts). Mesmo mapeamento do CSV (extrato.ts), para o dedup casar os dois
 * formatos: `description` = coluna Descrição do PDF, que é o "Título" do CSV, e o "Tipo" (Saída PIX,
 * Pagamento…) vai para `rawDescription` — exceto "Débito de Cartão", em que o CSV tem Título
 * "DEBITO DE CARTAO" e o estabelecimento no detalhe. Também lê o "Saldo do dia".
 */
export function parseExtratoPdf(text: string): ParseResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const transactions: ParsedTransaction[] = [];
  let errorRows = 0;
  let secao: { ano: number; mes: number } | null = null;
  let quebrado: { dd: string; mm: string; tipo: string; partes: string[] } | null = null;

  const push = (dd: string, mm: string, tipo: string, desc: string, sinal: string, valor: string) => {
    if (!secao) {
      errorRows++;
      return;
    }
    const mes = Number(mm);
    // Virada de ano dentro da seção (improvável, mas barato de tratar).
    const ano = secao.ano + (mes < secao.mes - 6 ? 1 : mes > secao.mes + 6 ? -1 : 0);
    const magnitude = parseToCents(valor);
    const detalhe = desc.replace(/\t/g, " ").replace(/\s+/g, " ").trim();
    const debito = DEBITO_CARTAO.test(tipo.trim());

    transactions.push({
      date: utcNoon(ano, mes, Number(dd)),
      description: debito ? "DEBITO DE CARTAO" : detalhe,
      rawDescription: debito ? detalhe : tipo.trim(),
      amountCents: sinal === "-" ? -magnitude : magnitude,
      currency: "BRL",
    });
  };

  for (const line of lines) {
    if (quebrado) {
      const fim = line.match(FIM_QUEBRADO);
      if (fim) {
        if (fim[1]) quebrado.partes.push(fim[1]);
        push(quebrado.dd, quebrado.mm, quebrado.tipo, quebrado.partes.join(" "), fim[2], fim[3]);
        quebrado = null;
        continue;
      }
      if (quebrado.partes.length < 4 && line && !/^\d{2}\/\d{2}\t/.test(line) && !SECAO.test(line)) {
        quebrado.partes.push(line);
        continue;
      }
      errorRows++; // não achou o valor: descarta e segue lendo normalmente
      quebrado = null;
    }

    const s = line.match(SECAO);
    if (s) {
      secao = { ano: Number(s[3]), mes: Number(s[2]) };
      continue;
    }
    const m = line.match(LINHA);
    if (m) {
      push(m[1], m[2], m[3], m[4], m[5], m[6]);
      continue;
    }
    const q = line.match(INICIO_QUEBRADO);
    if (q) {
      quebrado = { dd: q[1], mm: q[2], tipo: q[3], partes: [] };
      continue;
    }
    // Linha que começa com data mas não fechou o padrão = lançamento que não conseguimos ler.
    if (/^\d{2}\/\d{2}\t\d{2}\/\d{2}\t/.test(line)) errorRows++;
  }
  if (quebrado) errorRows++;

  const p = text.match(PERIODO);
  const saldo = text.match(SALDO);
  const saldoData = saldo ? parseDataExtenso(saldo[1], saldo[2], saldo[3]) : undefined;

  return {
    source: "c6_extrato",
    account: C6_CONTA,
    transactions,
    periodStart: p ? parseDataExtenso(p[1], p[2], p[3]) : undefined,
    periodEnd: p ? parseDataExtenso(p[4], p[5], p[6]) : undefined,
    errorRows,
    balance:
      saldo && saldoData
        ? { cents: (saldo[4] === "-" ? -1 : 1) * parseToCents(saldo[5]), date: saldoData }
        : undefined,
  };
}
