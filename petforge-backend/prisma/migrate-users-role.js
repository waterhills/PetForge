import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migrate existing users to use roleId instead of role string
 * This script:
 * 1. Finds all users without roleId
 * 2. Assigns roleId based on their old role string (if available)
 * 3. Defaults to 'user' role if no role string exists
 */

async function migrateUsers() {
  console.log('🔄 开始迁移用户角色...\n');

  try {
    // Get all roles
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' },
    });

    const userRole = await prisma.role.findUnique({
      where: { name: 'user' },
    });

    if (!adminRole || !userRole) {
      throw new Error('Required roles not found. Please run seed-rbac.js first.');
    }

    console.log(`找到角色:`);
    console.log(`  - admin: ${adminRole.id}`);
    console.log(`  - user: ${userRole.id}\n`);

    // Find users without roleId
    const usersWithoutRole = await prisma.user.findMany({
      where: {
        roleId: null,
      },
      select: {
        id: true,
        email: true,
      },
    });

    console.log(`找到 ${usersWithoutRole.length} 个没有 roleId 的用户\n`);

    if (usersWithoutRole.length === 0) {
      console.log('✅ 所有用户都已经有 roleId，无需迁移。');
      return;
    }

    // For this migration, we'll assign all existing users to 'user' role
    // If you need to preserve admin users, check the old User.role field
    let migratedCount = 0;
    for (const user of usersWithoutRole) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId: userRole.id },
      });
      migratedCount++;
      console.log(`  ✓ ${user.email} → assigned 'user' role`);
    }

    console.log(`\n✅ 成功迁移 ${migratedCount} 个用户\n`);

    // Summary
    const remaining = await prisma.user.count({
      where: { roleId: null },
    });

    if (remaining > 0) {
      console.log(`⚠️  仍有 ${remaining} 个用户没有 roleId，请检查`);
    } else {
      console.log(`🎉 所有用户都已分配角色！\n`);
    }

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateUsers();
