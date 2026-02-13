import prisma from '../src/config/database.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

/**
 * Create a test user with optional overrides
 */
export async function createTestUser(overrides = {}) {
  const defaultUser = {
    email: `test-${Date.now()}@example.com`,
    password: await bcrypt.hash('password123', 10),
    name: 'Test User',
    credits: 100,
    ...overrides,
  }

  return prisma.user.create({
    data: defaultUser,
  })
}

/**
 * Generate a valid JWT token for testing
 */
export function generateTestToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  )
}

/**
 * Create an authenticated request headers object
 */
export function createAuthHeaders(user) {
  const token = generateTestToken(user)
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Create a test PetIP
 */
export async function createTestPetIP(userId, overrides = {}) {
  const defaultPetIP = {
    userId,
    name: 'Test Pet',
    style: 'cartoon',
    originalImage: 'https://example.com/original.jpg',
    generatedImage: 'https://example.com/generated.jpg',
    rarity: 'common',
    likesCount: 0,
    ...overrides,
  }

  return prisma.petIP.create({
    data: defaultPetIP,
  })
}

/**
 * Create a test cart item
 */
export async function createTestCartItem(userId, overrides = {}) {
  const petIP = await createTestPetIP(userId)

  const defaultCartItem = {
    userId,
    petIpId: petIP.id,
    productType: 'tshirt',
    productName: 'Test T-Shirt',
    price: 99.99,
    quantity: 1,
    ...overrides,
  }

  return prisma.cartItem.create({
    data: defaultCartItem,
    include: { petIp: true },
  })
}

/**
 * Create a test address
 */
export async function createTestAddress(userId, overrides = {}) {
  const defaultAddress = {
    userId,
    receiverName: 'Test Receiver',
    receiverPhone: '13800138000',
    province: 'Test Province',
    city: 'Test City',
    district: 'Test District',
    detailAddress: 'Test Street 123',
    isDefault: true,
    ...overrides,
  }

  return prisma.address.create({
    data: defaultAddress,
  })
}

/**
 * Create a test order
 */
export async function createTestOrder(userId, overrides = {}) {
  const address = await createTestAddress(userId)

  const defaultOrder = {
    userId,
    receiverName: address.receiverName,
    receiverPhone: address.receiverPhone,
    receiverAddress: `${address.province} ${address.city} ${address.district} ${address.detailAddress}`,
    totalAmount: 99.99,
    status: 'pending',
    paymentMethod: 'alipay',
    paymentStatus: 'pending',
    items: {
      create: {
        productType: 'tshirt',
        productName: 'Test T-Shirt',
        price: 99.99,
        quantity: 1,
      },
    },
    ...overrides,
  }

  return prisma.order.create({
    data: defaultOrder,
  })
}

/**
 * Clean all test data
 */
export async function cleanupTestData() {
  await prisma.cartItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.address.deleteMany({})
  await prisma.petIP.deleteMany({})
  await prisma.user.deleteMany({})
}

/**
 * Setup test database with sample data
 */
export async function setupTestDatabase() {
  const user = await createTestUser()
  const petIP = await createTestPetIP(user.id)
  const cartItem = await createTestCartItem(user.id)
  const address = await createTestAddress(user.id)

  return { user, petIP, cartItem, address }
}
