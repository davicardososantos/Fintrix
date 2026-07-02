import type { DefaultSession } from "next-auth";

// Estende a sessão com os campos do Fintrix (household/role).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      householdId: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    householdId?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    householdId?: string;
    role?: string;
  }
}
