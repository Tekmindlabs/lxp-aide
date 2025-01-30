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
      try {
      const userId = token.id || user?.id;
      
      console.log('JWT Callback Start:', {
        userId,
        trigger,
        hasExistingToken: !!token.id,
        timestamp: new Date().toISOString()
      });

      if (!userId) {
        console.warn('No userId in token or user object');
        return token;
      }

      // If we have user data from sign in, use that
      if (user) {
        return {
        ...token,
        id: user.id,
        roles: user.roles,
        permissions: user.permissions,
        email: user.email,
        name: user.name
        };
      }

      // Otherwise fetch fresh user data
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

      if (!userWithPermissions) {
        console.error('User not found:', { userId });
        return token;
      }

      const typedUser = userWithPermissions as UserWithPermissions;
      const roles = typedUser.userRoles.map(ur => ur.role.name);
      const permissions = typedUser.userRoles.flatMap(ur =>
        ur.role.permissions.map(rp => rp.permission.name)
      );

      console.log('JWT Token Updated:', {
        userId,
        roles,
        permissionCount: permissions.length,
        timestamp: new Date().toISOString()
      });

      return {
        ...token,
        id: userId,
        roles,
        permissions,
        email: userWithPermissions.email,
        name: userWithPermissions.name
      };
      } catch (error) {
      console.error('JWT Callback Error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: token.id,
        timestamp: new Date().toISOString()
      });
      return token;
      }
    },

    session: async ({ session, token }) => {
      if (token) {
      session.user = {
        ...session.user,
        id: token.id as string,
        roles: Array.isArray(token.roles) ? token.roles : [],
        permissions: Array.isArray(token.permissions) ? token.permissions : []
      };

      console.log('Session Updated:', {
        userId: session.user.id,
        roles: session.user.roles,
        permissions: session.user.permissions,
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
          
          const typedUser = user as UserWithPermissions;
          const roles = typedUser.userRoles.map(ur => ur.role.name);
          const permissions = typedUser.userRoles.flatMap(ur => 
          ur.role.permissions.map(rp => rp.permission.name)
          );

          console.log('User Authentication Details:', {
          userId: user.id,
          email: user.email,
          roles,
          permissions,
          timestamp: new Date().toISOString()
          });

          return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles,
          permissions
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
      async createUser(user) {
      try {
        // Get the default student role
        const studentRole = await prisma.role.findFirst({
        where: { name: 'student' }
        });

        if (!studentRole) {
        throw new Error('Default student role not found');
        }

        // Create user with default role
        const newUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.name || user.email?.split('@')[0],
          userRoles: {
          create: [{
            role: { connect: { id: studentRole.id } }
          }]
          }
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

        console.log('Created new user with default role:', {
        userId: newUser.id,
        email: newUser.email,
        roleCount: newUser.userRoles.length,
        timestamp: new Date().toISOString()
        });

        return newUser;
      } catch (error) {
        console.error('User creation error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: user.email,
        timestamp: new Date().toISOString()
        });
        throw error;
      }
      }
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