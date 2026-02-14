const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Make Prisma available globally for tests
global.prisma = prisma;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Test database setup
beforeAll(async () => {
  // Ensure we're using test database
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/petforge_test';
  await prisma.$connect();
});

afterEach(async () => {
  // Clean up database after each test
  await prisma.cartItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.petIP.deleteMany({});
  await prisma.user.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Helper function to create a test user
global.createTestUser = async (overrides = {}) => {
  const defaultUser = {
    email: 'test@example.com',
    password: await bcrypt.hash('password123', 10),
    name: 'Test User',
    credits: 100,
    ...overrides,
  };

  return prisma.user.create({
    data: defaultUser,
  });
};

// Helper function to generate a valid JWT token
global.generateTestToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, email: 'test@example.com' },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
};
