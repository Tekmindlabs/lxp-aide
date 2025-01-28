import { PrismaClient, UserType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DefaultRoles, Permissions, RolePermissions, Permission } from '../src/utils/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');

  // Create all permissions first
  console.log('Creating permissions...');
  const permissionPromises = Object.values(Permissions).map(permissionName =>
    prisma.permission.upsert({
      where: { name: permissionName },
      update: {},
      create: {
        name: permissionName,
        description: `Permission to ${permissionName.replace(':', ' ')}`
      }
    })
  );

  const createdPermissions = await Promise.all(permissionPromises);
  console.log(`Created ${createdPermissions.length} permissions`);

  // Create roles and assign permissions
  console.log('Creating roles and assigning permissions...');
  const roles = await Promise.all(
    Object.entries(DefaultRoles).map(async ([_, roleName]) => {
        const role = await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: {
          name: roleName,
          description: `${roleName.replace('_', ' ')} role`,
        }
        });

        // Get permissions for this role
        const rolePermissions = RolePermissions[roleName];
        const permissionRecords = createdPermissions.filter(p => 
        rolePermissions.includes(p.name as Permission)
        );

        console.log(`Role ${roleName} permissions:`, permissionRecords.map(p => p.name));

        // Create role-permission associations
        await Promise.all(
        permissionRecords.map(permission =>
          prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id
          }
          })
        )
        );

      console.log(`Assigned ${permissionRecords.length} permissions to ${roleName}`);
      return role;
    })
  );

  // Create demo users
  console.log('Creating demo users...');

  const demoUsers = [
    {
      email: 'superadmin@example.com',
      password: 'superadmin123',
      name: 'Super Admin',
      role: DefaultRoles.SUPER_ADMIN,
      userType: UserType.ADMIN,
      status: 'ACTIVE',
    },
    {
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin',
      role: DefaultRoles.ADMIN,
      userType: UserType.ADMIN,
      status: 'ACTIVE',
    },
    {
      email: 'coordinator@example.com',
      password: 'coordinator123',
      name: 'Program Coordinator',
      role: DefaultRoles.PROGRAM_COORDINATOR,
      userType: UserType.COORDINATOR,
      status: 'ACTIVE',
    },
    {
      email: 'teacher@example.com',
      password: 'teacher123',
      name: 'Teacher',
      role: DefaultRoles.TEACHER,
      userType: UserType.TEACHER,
      status: 'ACTIVE',
    },
    {
      email: 'student@example.com',
      password: 'student123',
      name: 'Student',
      role: DefaultRoles.STUDENT,
      userType: UserType.STUDENT,
      status: 'ACTIVE',
    },
    {
      email: 'parent@example.com',
      password: 'parent123',
      name: 'Parent',
      role: DefaultRoles.PARENT,
      userType: UserType.PARENT,
      status: 'ACTIVE',
    },
  ] as const;

  for (const demoUser of demoUsers) {
    const hashedPassword = await bcrypt.hash(demoUser.password, 12);
    const role = roles.find((r) => r.name === demoUser.role);

    if (!role) {
      console.log(`Role not found for user: ${demoUser.email}`);
      continue;
    }

    // Updated user creation to include userType
    const user = await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {},
      create: {
        email: demoUser.email,
        name: demoUser.name,
        password: hashedPassword,
        status: demoUser.status,
        userType: demoUser.userType,
        userRoles: {
          create: {
            roleId: role.id,
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Create or update corresponding profile based on role
    switch (demoUser.role) {
      case DefaultRoles.TEACHER:
      await prisma.teacherProfile.upsert({
        where: { userId: user.id },
        update: { specialization: 'General' },
        create: {
        userId: user.id,
        specialization: 'General',
        },
      });
      break;
      case DefaultRoles.STUDENT:
      await prisma.studentProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
        userId: user.id,
        },
      });
      break;
      case DefaultRoles.PARENT:
      await prisma.parentProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
        userId: user.id,
        },
      });
      break;
      case DefaultRoles.PROGRAM_COORDINATOR:
      await prisma.coordinatorProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
        userId: user.id,
        },
      });
      break;
    }
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Error while seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
