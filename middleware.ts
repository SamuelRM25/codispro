import { auth } from "@/auth"
import { NextResponse } from "next/server"

const PUBLIC_ROUTES = ["/", "/api/auth", "/login"]
const ROLE_DASHBOARDS: Record<string, string> = {
  BODEGA: "/dashboard/bodega",
  VEHICULO: "/dashboard/vehiculo",
  RECEPTOR: "/dashboard/receptor",
}

export default auth(async function middleware(req) {
  const { nextUrl } = req
  const session = await auth()

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    nextUrl.pathname === route || nextUrl.pathname.startsWith("/api/auth")
  )

  if (isPublicRoute) {
    if (session && nextUrl.pathname === "/") {
      const role = session.user?.role
      if (role && ROLE_DASHBOARDS[role]) {
        return NextResponse.redirect(new URL(ROLE_DASHBOARDS[role], req.url))
      }
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  if (nextUrl.pathname.startsWith("/dashboard")) {
    const role = session.user?.role as string

    const restrictedDashboards = ["/bodega", "/vehiculo", "/receptor"]
    const isRestrictedDashboard = restrictedDashboards.some((path) =>
      nextUrl.pathname.startsWith(`/dashboard${path}`)
    )

    if (isRestrictedDashboard && !ROLE_DASHBOARDS[role]) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    if (role === "BODEGA" && !nextUrl.pathname.startsWith("/dashboard/bodega")) {
      return NextResponse.redirect(new URL("/dashboard/bodega", req.url))
    }
    if (role === "VEHICULO" && !nextUrl.pathname.startsWith("/dashboard/vehiculo")) {
      return NextResponse.redirect(new URL("/dashboard/vehiculo", req.url))
    }
    if (role === "RECEPTOR" && !nextUrl.pathname.startsWith("/dashboard/receptor")) {
      return NextResponse.redirect(new URL("/dashboard/receptor", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}