import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      code: string
      role: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    code: string
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    code: string
    role: string
  }
}