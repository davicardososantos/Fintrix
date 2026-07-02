// Tipos compartilhados da importação (spec 001).

export type ImportSource = "c6_extrato" | "c6_fatura" | "alelo";

/** Chave estável da conta/fonte, derivada do parse (usada no dedup e para achar/criar a conta). */
export type AccountKey = {
  key: string; // ex.: "c6_conta", "c6_cartao_4125", "alelo"
  name: string; // nome amigável exibido
  type: "checking" | "credit_card" | "meal_voucher" | "cash" | "other";
  institution?: string;
  last4?: string;
};

/** Transação normalizada, ainda sem persistência. */
export type ParsedTransaction = {
  date: Date;
  description: string;
  rawDescription?: string;
  amountCents: number; // + entrada / - saída
  currency: string; // "BRL"
  fxAmountCents?: number;
  fxCurrency?: string;
  rawCategory?: string; // Categoria original (fatura C6)
  ownerHint?: string; // Nome no Cartão (fatura)
  installment?: string;
};

/** Resultado de um parser: transações + a conta + período + linhas com erro. */
export type ParseResult = {
  source: ImportSource;
  account: AccountKey;
  transactions: ParsedTransaction[];
  periodStart?: Date;
  periodEnd?: Date;
  errorRows: number; // linhas inválidas puladas
};
