import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type UserRole, type Role, type RolePermission, type Permission } from "@prisma/client";
import {

  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { prisma } from "@/server/db";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import bcrypt from "bcryptjs";
import { env } from "@/env.mjs";

// Type for user with permissions
type UserWithPermissions = {
  userRoles: (UserRole & {
    role: Role & {
      permissions: (RolePermission & {
        permission: Permission
      })[]
    }
  })[]
} & {
  id: string;
  email: string | null;
  name: string | null;
  password: string | null;
};

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      roles: string[];
      permissions: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    roles: string[];
    permissions: string[];
  }

  interface JWT {
    id: string;
    roles: string[];
    permissions: string[];
  }
}

export const authOptions: NextAuthOptions = {
  debug: true,
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata);
    },
    warn(code) {
      console.warn('NextAuth Warning:', code);
    },
  },
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
    // Always fetch fresh user data with permissions, not just on initial login
    const userId = token.id || user?.id;
    if (!userId) {
      return token;
    }
    const userWithPermissions = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (userWithPermissions) {
      const typedUser = userWithPermissions as UserWithPermissions;
      const roles = typedUser.userRoles.map(ur => ur.role.name);
      const permissions = typedUser.userRoles.flatMap(ur =>
        ur.role.permissions.map(rp => rp.permission.name)
      );

      // Always update token with fresh permissions
      token.id = token.id || user?.id;
      token.roles = roles;
      token.permissions = permissions;

      console.log('User Permissions Refreshed:', {
        userId: token.id,
        roles: roles.length,
        permissions: permissions.length,
        timestamp: new Date().toISOString()
      });
    }

    return token;
  },
    session: async ({ session, token }) => {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          roles: (token.roles as string[]) || [],
          permissions: (token.permissions as string[]) || []
        };

        console.log('Session Updated:', {
          userId: session.user.id,
          roles: session.user.roles.length,
          permissions: session.user.permissions.length,
          timestamp: new Date().toISOString()
        });
      }
      return session;
    },
  },

  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
        async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
              include: {
              userRoles: {
                include: {
                role: {
                  include: {
                  permissions: {
                    include: {
                    permission: true
                    }
                  }
                  }
                }
                }
              }
              }
        });
        
        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }
        
        const isValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!isValid) {
          throw new Error("Invalid credentials");
        }
        
        // Extract roles and permissions with proper type annotations
        const typedUser = user as UserWithPermissions;
        const roles = typedUser.userRoles.map(ur => ur.role.name);
        const permissions = typedUser.userRoles.flatMap(ur => 
          ur.role.permissions.map(rp => rp.permission.name)
        );


        
        console.log('User Authentication Successful:', {
          userId: user.id,
          roles: roles.length,
          permissions: permissions.length,
          timestamp: new Date().toISOString()
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: roles,
          permissions: permissions
        };
      },
    }),
    EmailProvider({
      server: {
        host: env.EMAIL_SERVER_HOST,
        port: env.EMAIL_SERVER_PORT,
        auth: {
          user: env.EMAIL_SERVER_USER,
          pass: env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export const getServerAuthSession = async () => {
  try {
    console.log('Attempting to retrieve server session with detailed logging');
    const session = await getServerSession(authOptions);
    
    console.log('Server Session Retrieved:', {
      sessionExists: !!session,
      userId: session?.user?.id,
      roles: session?.user?.roles?.length,
      permissions: session?.user?.permissions?.length
    });

    return session;
  } catch (error) {
    console.error('Comprehensive Session Retrieval Error:', {
      errorName: error instanceof Error ? error.name : 'Unknown Error',
      errorMessage: error instanceof Error ? error.message : 'No error details',
      errorStack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return null;
  }
};