import { redirect } from "next/navigation";

// Raiz redireciona para o dashboard (o middleware cuida de mandar ao login se preciso).
export default function Home() {
  redirect("/dashboard");
}
