-- CreateRole
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

PRIMARY KEY ("id")
);

-- CreateIndex: Role name
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- Create Permission
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

PRIMARY KEY ("id")
);

-- CreateIndex: Permission name
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex: Permission code
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- Create RolePermission
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

PRIMARY KEY ("id")
);

-- CreateIndex: RolePermission roleId and permissionId unique
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex: RolePermission roleId
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex: RolePermission permissionId
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- Add roleId to User table
ALTER TABLE "User" ADD COLUMN "roleId" TEXT;

-- Create foreign key relationship
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create foreign key for RolePermission
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
