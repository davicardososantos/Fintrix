// Extração de texto de PDF (spec 001). Dois modos:
// - padrão: o texto do pdf-parse como sempre foi (o parser do Alelo depende dele);
// - colunas: itens da mesma linha separados por TAB quando há espaço horizontal entre eles. É o que
//   torna os PDFs do C6 legíveis sem ambiguidade — sem isso "DROGASIL1686" + "19,98" viraria
//   "DROGASIL168619,98" e não daria para saber onde termina a descrição.

type TextItem = { str: string; transform: number[]; width?: number };
type PageData = { getTextContent: (opts: object) => Promise<{ items: TextItem[] }> };

/** Junta itens por linha (mesmo y) e insere TAB quando o próximo item começa longe do anterior. */
function renderWithColumns(pageData: PageData): Promise<string> {
  return pageData
    .getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false })
    .then(({ items }) => {
      let text = "";
      let lastY: number | null = null;
      let lastEnd = 0;
      for (const item of items) {
        const x = item.transform[4];
        const y = item.transform[5];
        if (lastY === null || Math.abs(y - lastY) > 1) {
          text += (lastY === null ? "" : "\n") + item.str;
        } else {
          text += (x - lastEnd > 2 ? "\t" : "") + item.str;
        }
        lastY = y;
        lastEnd = x + (item.width ?? 0);
      }
      return text;
    });
}

export async function extractPdfText(buffer: Buffer, opts: { columns?: boolean } = {}): Promise<string> {
  // @ts-expect-error - subpath sem tipos, mas evita o require de arquivo de teste do index.js
  const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
  const data = await pdfParse(buffer, opts.columns ? { pagerender: renderWithColumns } : undefined);
  return data.text as string;
}
