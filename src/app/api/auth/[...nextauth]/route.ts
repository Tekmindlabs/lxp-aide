import { authOptions } from "@/server/auth"
import NextAuth from "next-auth/next"

// Create handler with auth options
const handler = NextAuth(authOptions)

// Export handler functions for App Router
export const GET = handler
export const POST = handler

