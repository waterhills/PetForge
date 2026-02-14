import express from 'express';
import prisma from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const createRoleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  permissionIds: z.array(z.string()).optional(),
});

const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  permissionIds: z.array(z.string()).optional(),
});

const createPermissionSchema = z.object({
  name: z.string().min(1).max(50),
  code: z.string().min(1).max(100),
  resource: z.string().min(1).max(50),
  action: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
});

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================
// ROLE MANAGEMENT
// ============================================================

/**
 * GET /api/admin/roles
 * Get all roles with their permissions
 */
router.get('/roles', requirePermission('admin.manage-roles'), async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions.map(rp => rp.permission),
        userCount: role._count.users,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get roles',
    });
  }
});

/**
 * GET /api/admin/roles/:id
 * Get specific role with permissions
 */
router.get('/roles/:id', requirePermission('admin.manage-roles'), async (req, res) => {
  try {
    const role = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions.map(rp => rp.permission),
        userCount: role._count.users,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get role',
    });
  }
});

/**
 * POST /api/admin/roles
 * Create a new role
 */
router.post('/roles', requirePermission('admin.manage-roles'), async (req, res) => {
  try {
    const { name, description, permissionIds } = createRoleSchema.parse(req.body);

    // Check if role name already exists
    const existing = await prisma.role.findUnique({
      where: { name },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Role with this name already exists',
      });
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name,
        description,
        ...(permissionIds && {
          permissions: {
            create: permissionIds.map(permissionId => ({
              permissionId,
            })),
          },
        }),
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions.map(rp => rp.permission),
        createdAt: role.createdAt,
      },
      message: 'Role created successfully',
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create role',
    });
  }
});

/**
 * PUT /api/admin/roles/:id
 * Update a role
 */
router.put('/roles/:id', requirePermission('admin.manage-roles'), async (req, res) => {
  try {
    const { name, description, permissionIds } = updateRoleSchema.parse(req.body);

    // Check if role exists
    const existing = await prisma.role.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    // Check if new name conflicts with another role
    if (name && name !== existing.name) {
      const nameConflict = await prisma.role.findUnique({
        where: { name },
      });

      if (nameConflict) {
        return res.status(400).json({
          success: false,
          error: 'Role with this name already exists',
        });
      }
    }

    // Update role
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const role = await prisma.role.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Update permissions if provided
    if (permissionIds !== undefined) {
      // Delete existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: req.params.id },
      });

      // Add new permissions
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({
            roleId: req.params.id,
            permissionId,
          })),
        });
      }
    }

    // Fetch updated role with permissions
    const updatedRole = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
        permissions: updatedRole.permissions.map(rp => rp.permission),
        updatedAt: updatedRole.updatedAt,
      },
      message: 'Role updated successfully',
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update role',
    });
  }
});

/**
 * DELETE /api/admin/roles/:id
 * Delete a role
 */
router.delete('/roles/:id', requirePermission('admin.manage-roles'), async (req, res) => {
  try {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    // Prevent deleting roles that have users
    if (role._count.users > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete role that is assigned to users',
      });
    }

    // Delete role
    await prisma.role.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete role',
    });
  }
});

// ============================================================
// PERMISSION MANAGEMENT
// ============================================================

/**
 * GET /api/admin/permissions
 * Get all permissions
 */
router.get('/permissions', requirePermission('admin.manage-permissions'), async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get permissions',
    });
  }
});

/**
 * GET /api/admin/permissions/grouped
 * Get permissions grouped by resource
 */
router.get('/permissions/grouped', requirePermission('admin.manage-permissions'), async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });

    // Group by resource
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {});

    res.json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    console.error('Get grouped permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get permissions',
    });
  }
});

/**
 * POST /api/admin/permissions
 * Create a new permission
 */
router.post('/permissions', requirePermission('admin.manage-permissions'), async (req, res) => {
  try {
    const data = createPermissionSchema.parse(req.body);

    // Check if permission code already exists
    const existing = await prisma.permission.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Permission with this code already exists',
      });
    }

    const permission = await prisma.permission.create({
      data,
    });

    res.status(201).json({
      success: true,
      data: permission,
      message: 'Permission created successfully',
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }
    console.error('Create permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create permission',
    });
  }
});

// ============================================================
// USER ROLE ASSIGNMENT
// ============================================================

/**
 * PATCH /api/admin/users/:id/role
 * Update user's role
 */
router.patch('/users/:id/role', requirePermission('users.manage-roles'), async (req, res) => {
  try {
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({
        success: false,
        error: 'roleId is required',
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role not found',
      });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { roleId },
      select: {
        id: true,
        email: true,
        name: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: `User role updated to ${role.name}`,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role',
    });
  }
});

export default router;
