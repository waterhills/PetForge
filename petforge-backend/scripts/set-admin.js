import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setAdminUser() {
  const userEmail = '947441390@qq.com';

  try {
    // Get admin role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' },
    });

    if (!adminRole) {
      console.error('Admin role not found!');
      process.exit(1);
    }

    // Update user to admin role
    const user = await prisma.user.update({
      where: { email: userEmail },
      data: { roleId: adminRole.id },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        role: {
          select: {
            name: true,
            description: true,
          },
        },
      },
    });

    console.log(`✅ Successfully updated user to admin role:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Role: ${user.role.name}`);
    console.log(`\n⚠️  IMPORTANT: Please LOG OUT and LOG IN again to get a new JWT token with admin privileges!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P2025') {
      console.error(`   User not found: ${userEmail}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

setAdminUser();
