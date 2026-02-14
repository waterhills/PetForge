import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * RBAC Seed Data
 * Creates default roles and permissions for the PetForge system
 */

// Define all permissions
const permissions = [
  // User management
  { code: 'users.view', name: '查看用户', resource: 'users', action: 'view', description: '查看用户列表和详情' },
  { code: 'users.create', name: '创建用户', resource: 'users', action: 'create', description: '创建新用户' },
  { code: 'users.edit', name: '编辑用户', resource: 'users', action: 'edit', description: '编辑用户信息' },
  { code: 'users.delete', name: '删除用户', resource: 'users', action: 'delete', description: '删除用户' },
  { code: 'users.manage-credits', name: '管理积分', resource: 'users', action: 'manage-credits', description: '管理用户积分' },
  { code: 'users.manage-roles', name: '分配用户角色', resource: 'users', action: 'manage-roles', description: '分配用户角色' },

  // PetIP management
  { code: 'petips.view', name: '查看宠物IP', resource: 'petips', action: 'view', description: '查看宠物IP列表' },
  { code: 'petips.create', name: '创建宠物IP', resource: 'petips', action: 'create', description: '创建宠物IP' },
  { code: 'petips.edit', name: '编辑宠物IP', resource: 'petips', action: 'edit', description: '编辑宠物IP信息' },
  { code: 'petips.delete', name: '删除宠物IP', resource: 'petips', action: 'delete', description: '删除宠物IP' },
  { code: 'petips.moderate', name: '审核宠物IP', resource: 'petips', action: 'moderate', description: '审核宠物IP内容' },

  // Order management
  { code: 'orders.view', name: '查看订单', resource: 'orders', action: 'view', description: '查看订单列表' },
  { code: 'orders.create', name: '创建订单', resource: 'orders', action: 'create', description: '创建订单' },
  { code: 'orders.update-status', name: '更新订单状态', resource: 'orders', action: 'update-status', description: '更新订单状态' },
  { code: 'orders.delete', name: '删除订单', resource: 'orders', action: 'delete', description: '删除订单' },

  // Community management
  { code: 'community.view', name: '查看社区', resource: 'community', action: 'view', description: '查看社区内容' },
  { code: 'community.moderate', name: '审核社区', resource: 'community', action: 'moderate', description: '审核社区帖子' },
  { code: 'community.delete', name: '删除社区内容', resource: 'community', action: 'delete', description: '删除社区内容' },

  // Admin management
  { code: 'admin.view-stats', name: '查看统计', resource: 'admin', action: 'view-stats', description: '查看后台统计数据' },
  { code: 'admin.manage-roles', name: '管理角色', resource: 'admin', action: 'manage-roles', description: '管理角色和权限' },
  { code: 'admin.manage-permissions', name: '管理权限', resource: 'admin', action: 'manage-permissions', description: '管理权限' },
  { code: 'admin.system-settings', name: '系统设置', resource: 'admin', action: 'system-settings', description: '系统配置' },
];

// Define roles with their permissions
const roles = [
  {
    name: 'admin',
    description: '系统管理员 - 拥有所有权限',
    permissions: permissions.map(p => p.code), // All permissions
  },
  {
    name: 'moderator',
    description: '内容审核员 - 可以审核内容和更新订单状态',
    permissions: [
      'users.view',
      'petips.view',
      'petips.moderate',
      'orders.view',
      'orders.update-status',
      'community.view',
      'community.moderate',
      'admin.view-stats',
    ],
  },
  {
    name: 'user',
    description: '普通用户 - 访问自己的资源',
    permissions: [], // Regular users have no admin permissions
  },
  {
    name: 'guest',
    description: '访客 - 只读访问公开内容',
    permissions: [], // Guests have no admin permissions
  },
];

async function main() {
  console.log('🌱 开始播种 RBAC 数据...\n');

  try {
    // Create permissions
    console.log('创建权限...');
    const createdPermissions = [];
    for (const perm of permissions) {
      const permission = await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: perm,
      });
      createdPermissions.push(permission);
      console.log(`  ✓ ${permission.code} - ${permission.name}`);
    }
    console.log(`✅ 已创建 ${createdPermissions.length} 个权限\n`);

    // Create roles and assign permissions
    console.log('创建角色并分配权限...');
    for (const roleDef of roles) {
      const role = await prisma.role.upsert({
        where: { name: roleDef.name },
        update: {},
        create: {
          name: roleDef.name,
          description: roleDef.description,
        },
      });

      // Get permissions to connect
      const permissionsToConnect = createdPermissions.filter(p =>
        roleDef.permissions.includes(p.code)
      );

      // Delete existing role permissions and reconnect
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      // Create new role permissions
      for (const permission of permissionsToConnect) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }

      console.log(`  ✓ ${role.name} - ${role.description} (${permissionsToConnect.length} 权限)`);
    }
    console.log(`✅ 已创建 ${roles.length} 个角色\n`);

    console.log('🎉 RBAC 数据播种完成！\n');

    // Display summary
    const roleCount = await prisma.role.count();
    const permissionCount = await prisma.permission.count();
    console.log(`📊 摘要:`);
    console.log(`   - 角色: ${roleCount}`);
    console.log(`   - 权限: ${permissionCount}\n`);

    // Show role permissions
    console.log('📋 角色权限详情:');
    const allRoles = await prisma.role.findMany({
      include: { permissions: true },
    });

    for (const role of allRoles) {
      console.log(`\n${role.name.toUpperCase()} (${role.description || '无描述'}):`);
      if (role.permissions.length === 0) {
        console.log('  (无特殊权限)');
      } else {
        role.permissions.forEach(p => {
          console.log(`  - ${p.code}: ${p.name}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ 播种失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
