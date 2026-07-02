import type { NextAuthConfig } from "next-auth";

/**
 * Config base do Auth.js — SEM Prisma/bcrypt, para poder ser usada no middleware (Edge runtime).
 * O provider Credentials (que consulta o banco) é adicionado só em auth.ts (runtime Node).
 * Ver docs/architecture.md §4.2 (auth/household).
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    // Propaga householdId/role para o token e a sessão (isolamento por household).
    jwt: ({ token, user }) => {
      if (user) {
        token.householdId = (user as { householdId?: string }).householdId;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.householdId = token.householdId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
