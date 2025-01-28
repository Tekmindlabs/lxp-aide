import { authOptions } from "@/server/auth"
import NextAuth from "next-auth"

const handler = NextAuth(authOptions)

// Export handler functions for App Router
export async function GET(request: Request) {
	return handler(request)
}

export async function POST(request: Request) {
	return handler(request)
}
