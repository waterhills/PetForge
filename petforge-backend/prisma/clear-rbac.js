import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearRBAC() {
  console.log('🗑️ 清理现有 RBAC 数据...\n');

  try {
    // Delete in correct order due to foreign keys
    const rolePermCount = await prisma.rolePermission.count();
    const permCount = await prisma.permission.count();
    const roleCount = await prisma.role.count();

    console.log(`现有数据:`);
    console.log(`  - 角色权限: ${rolePermCount}`);
    console.log(`  - 权限: ${permCount}`);
    console.log(`  - 角色: ${roleCount}`);

    await prisma.rolePermission.deleteMany({});
    console.log(`\n✅ 已删除 ${rolePermCount} 个角色权限关系`);

    await prisma.permission.deleteMany({});
    console.log(`✅ 已删除 ${permCount} 个权限`);

    await prisma.role.deleteMany({});
    console.log(`✅ 已删除 ${roleCount} 个角色`);

    console.log('\n🎉 清理完成！\n');
  } catch (error) {
    console.error('❌ 清理失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearRBAC();
