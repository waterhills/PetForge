import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';

const prisma = new PrismaClient();
const sqlite = new Database('./prisma/dev.db');

async function migrateUsers() {
  console.log('[INFO] Migrating Users...');
  const users = sqlite.prepare('SELECT * FROM User').all();
  console.log(`[INFO] Found ${users.length} users`);
  let migrated = 0;
  for (const user of users) {
    try {
      await prisma.user.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          email: user.email,
          password: user.password,
          name: user.name,
          avatar: user.avatar,
          phone: user.phone,
          bio: user.bio,
          credits: user.credits || 100,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
        update: {},
      });
      migrated++;
    } catch (error) {
      console.log(`[WARN] User ${user.email}: ${error.message}`);
    }
  }
  console.log(`[SUCCESS] Users: ${migrated}/${users.length} migrated`);
}

async function migratePetIPs() {
  console.log('[INFO] Migrating PetIPs...');
  const petIPs = sqlite.prepare('SELECT * FROM PetIP').all();
  console.log(`[INFO] Found ${petIPs.length} PetIPs`);
  let migrated = 0;
  for (const petIP of petIPs) {
    try {
      await prisma.petIP.upsert({
        where: { id: petIP.id },
        create: {
          id: petIP.id,
          name: petIP.name,
          description: petIP.description,
          imageUrl: petIP.imageUrl,
          style: petIP.style,
          rarity: petIP.rarity,
          type: petIP.type,
          userId: petIP.userId,
          price: petIP.price,
          isForSale: Boolean(petIP.isForSale),
          createdAt: new Date(petIP.createdAt),
          updatedAt: new Date(petIP.updatedAt),
        },
        update: {},
      });
      migrated++;
    } catch (error) {
      console.log(`[WARN] PetIP ${petIP.id}: ${error.message}`);
    }
  }
  console.log(`[SUCCESS] PetIPs: ${migrated}/${petIPs.length} migrated`);
}

async function migrateOrders() {
  console.log('[INFO] Migrating Orders...');
  const orders = sqlite.prepare('SELECT * FROM "Order"').all();
  console.log(`[INFO] Found ${orders.length} orders`);
  let migrated = 0;
  for (const order of orders) {
    try {
      await prisma.order.upsert({
        where: { id: order.id },
        create: {
          id: order.id,
          userId: order.userId,
          totalAmount: order.totalAmount,
          status: order.status,
          shippingAddress: order.shippingAddress,
          paymentMethod: order.paymentMethod,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        },
        update: {},
      });
      migrated++;
    } catch (error) {
      console.log(`[WARN] Order ${order.id}: ${error.message}`);
    }
  }
  console.log(`[SUCCESS] Orders: ${migrated}/${orders.length} migrated`);
}

async function migrateGenerations() {
  console.log('[INFO] Migrating Generations...');
  const generations = sqlite.prepare('SELECT * FROM Generation').all();
  console.log(`[INFO] Found ${generations.length} generations`);
  let migrated = 0;
  for (const gen of generations) {
    try {
      await prisma.generation.upsert({
        where: { id: gen.id },
        create: {
          id: gen.id,
          userId: gen.userId,
          type: gen.type,
          prompt: gen.prompt,
          style: gen.style,
          inputImage: gen.inputImage,
          resultUrl: gen.resultUrl,
          status: gen.status,
          errorMessage: gen.errorMessage,
          taskId: gen.taskId,
          progress: gen.progress,
          createdAt: new Date(gen.createdAt),
          updatedAt: new Date(gen.updatedAt),
          completedAt: gen.completedAt ? new Date(gen.completedAt) : null,
        },
        update: {},
      });
      migrated++;
    } catch (error) {
      console.log(`[WARN] Generation ${gen.id}: ${error.message}`);
    }
  }
  console.log(`[SUCCESS] Generations: ${migrated}/${generations.length} migrated`);
}

async function verifyMigration() {
  console.log('\n=== Verification ===');
  const sqliteUsers = sqlite.prepare('SELECT COUNT(*) as count FROM User').get();
  const pgUsers = await prisma.user.count();
  console.log(`Users: SQLite=${sqliteUsers.count}, PostgreSQL=${pgUsers}`);
  const sqlitePetIPs = sqlite.prepare('SELECT COUNT(*) as count FROM PetIP').get();
  const pgPetIPs = await prisma.petIP.count();
  console.log(`PetIPs: SQLite=${sqlitePetIPs.count}, PostgreSQL=${pgPetIPs}`);
  const sqliteOrders = sqlite.prepare('SELECT COUNT(*) as count FROM "Order"').get();
  const pgOrders = await prisma.order.count();
  console.log(`Orders: SQLite=${sqliteOrders.count}, PostgreSQL=${pgOrders}`);
  const sqliteGens = sqlite.prepare('SELECT COUNT(*) as count FROM Generation').get();
  const pgGens = await prisma.generation.count();
  console.log(`Generations: SQLite=${sqliteGens.count}, PostgreSQL=${pgGens}`);
}

async function main() {
  try {
    console.log('=== SQLite to PostgreSQL Migration ===\n');
    await migrateUsers();
    await migratePetIPs();
    await migrateOrders();
    await migrateGenerations();
    await verifyMigration();
    console.log('\n[SUCCESS] Migration completed!');
  } catch (error) {
    console.error('[ERROR] Migration failed:', error);
    process.exit(1);
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }
}

main();
