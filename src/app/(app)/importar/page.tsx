import { ImportForm } from "./import-form";

export default function ImportarPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">Importar</h1>
        <p className="text-sm text-muted-foreground">
          Envie um extrato/fatura da C6, o extrato do Nubank ou o extrato da Alelo. Linhas repetidas
          não são importadas de novo.
        </p>
      </div>
      <ImportForm />
    </div>
  );
}
