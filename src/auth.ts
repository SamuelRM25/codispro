import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { db } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        code: { label: "Código de acceso", type: "text" },
      },
      authorize: async (credentials) => {
        if (!credentials?.code) {
          return null
        }

        const user = await db.user.findUnique({
          where: { code: credentials.code as string },
        })

        if (!user) {
          return null
        }

        if (!user.isActive) {
          throw new Error("Usuario desactivado")
        }

        return {
          id: user.id,
          code: user.code,
          name: user.name,
          role: user.role,
          email: null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.code = user.code
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.code = token.code as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  trustHost: true,
})