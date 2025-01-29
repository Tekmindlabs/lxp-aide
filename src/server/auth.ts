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
  isSuperAdmin?: boolean;
};

// Define a more explicit User type that matches NextAuth expectations
type CustomUser = {
  id: string;
  email: string | null;
  name: string | null;
  image?: string | null;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
};

// Update type declarations
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: CustomUser & DefaultSession["user"];
  }

  interface User extends CustomUser {}
  interface JWT extends CustomUser {}
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
    jwt: async ({ token, user, trigger: _trigger, session: _session }) => {
      const userId = token.id || user?.id;
      if (!userId) {
      console.error('JWT Callback: No userId found in token or user');
      return token;
      }

      try {
      // First check if user exists without status check
      const userExists = await prisma.user.findUnique({
        where: { 
        id: userId as string
        },
        select: { id: true, status: true, deleted: true }
      });

      console.log('User Existence Check:', {
        userId,
        exists: !!userExists,
        status: userExists?.status,
        deleted: userExists?.deleted,
        timestamp: new Date().toISOString()
      });

      if (!userExists) {
        console.error('JWT Callback: User not found:', userId);
        return token;
      }

      // Then get full user data with permissions
      const userWithPermissions = await prisma.user.findFirst({
        where: { 
        id: userId as string,
        deleted: null
        },
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

      if (!userWithPermissions) {
        console.error('JWT Callback: User not found with permissions:', userId);
        return token;
      }

      const typedUser = userWithPermissions as UserWithPermissions;
      const roles = typedUser.userRoles.map(ur => ur.role.name);
      const permissions = typedUser.userRoles.flatMap(ur =>
        ur.role.permissions.map(rp => rp.permission.name)
      );

      const isSuperAdmin = roles.includes('super_admin');

      console.log('User Permissions Found:', {
        userId,
        roles,
        isSuperAdmin,
        status: userWithPermissions.status,
        timestamp: new Date().toISOString()
      });

      const customUserToken: CustomUser = {
        id: userId as string,
        email: userWithPermissions.email,
        name: userWithPermissions.name,
        image: userWithPermissions.image || undefined,
        roles,
        permissions,
        isSuperAdmin
      };

      return {
        ...token,
        ...customUserToken,
        updated: new Date().toISOString()
      };

      } catch (error) {
      console.error('JWT Callback Error:', error);
      return token;
      }
    },
    session: async ({ session, token }) => {
      try {
      if (!token) {
        console.error('Session Callback: No token available');
        return session;
      }

      // Explicitly type and set isSuperAdmin
      const isSuperAdmin = token.isSuperAdmin === true;

      session.user = {
        ...session.user,
        id: token.id as string,
        roles: (token.roles as string[]) || [],
        permissions: (token.permissions as string[]) || [],
        isSuperAdmin,
        updated: token.updated as string
      } as CustomUser;

      return session;
      } catch (error) {
      console.error('Session Callback Error:', error);
      return session;
      }
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

          const user = await prisma.user.findFirst({
          where: { 
            email: credentials.email,
            deleted: null,
            status: 'ACTIVE'
          },
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

          // Debug log for user check
          console.log('User Authentication Check:', {
          userId: user.id,
          status: user.status,
          deleted: user.deleted,
          timestamp: new Date().toISOString()
          });
          
          const typedUser = user as UserWithPermissions;
          const roles = typedUser.userRoles.map(ur => ur.role.name);
          const permissions = typedUser.userRoles.flatMap(ur => 
          ur.role.permissions.map(rp => rp.permission.name)
          );

          const isSuperAdmin = roles.includes('super_admin');

          // Debug log for role check
          console.log('Role Check:', {
          roles,
          isSuperAdmin,
          timestamp: new Date().toISOString()
          });

          return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          roles,
          permissions,
          isSuperAdmin
          } as CustomUser;
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