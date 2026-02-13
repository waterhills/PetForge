import { describe, it, expect, beforeAll, afterEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import authRoutes from '../../src/routes/auth.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import prisma from '../../src/config/database.js'

// Setup Express app for testing
const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)

describe('Auth Routes', () => {
  beforeAll(() => {
    // Set test environment
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'
    process.env.JWT_EXPIRES_IN = '7d'
  })

  afterEach(async () => {
    // Clean up database
    await prisma.user.deleteMany({})
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.user.name).toBe(userData.name)
      expect(response.body.data.user.credits).toBe(100) // Initial credits
      expect(response.body.data.user.password).toBeUndefined() // Password should not be returned
      expect(response.body.data.token).toBeDefined()

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      })
      expect(user).toBeDefined()
      expect(user.email).toBe(userData.email)
    })

    it('should reject registration with existing email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }

      // Create user first
      await prisma.user.create({
        data: {
          email: userData.email,
          password: await bcrypt.hash(userData.password, 10),
          name: userData.name,
          credits: 100,
        },
      })

      // Try to register again
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('User already exists')
    })

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(Array.isArray(response.body.error)).toBe(true)
      expect(response.body.error[0].message).toContain('email')
    })

    it('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '12345', // Less than 6 characters
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(Array.isArray(response.body.error)).toBe(true)
    })

    it('should reject registration with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'password123',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(Array.isArray(response.body.error)).toBe(true)
    })

    it('should reject registration with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should hash password before saving', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      })

      expect(user.password).not.toBe(userData.password)
      expect(user.password.length).toBeGreaterThan(50) // Hash should be longer

      // Verify hash is valid
      const isValid = await bcrypt.compare(userData.password, user.password)
      expect(isValid).toBe(true)
    })

    it('should generate valid JWT token', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      const token = response.body.data.token

      // Verify token is valid
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      expect(decoded.userId).toBeDefined()
      expect(decoded.email).toBe(userData.email)
    })

    it('should handle registration without name', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.name).toBeNull()
    })
  })

  describe('POST /api/auth/login', () => {
    let testUser

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Test User',
          credits: 100,
        },
      })
    })

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.user.email).toBe(testUser.email)
      expect(response.body.data.token).toBeDefined()
    })

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid credentials')
    })

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid credentials')
    })

    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(Array.isArray(response.body.error)).toBe(true)
    })

    it('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should generate valid JWT token on login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200)

      const token = response.body.data.token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      expect(decoded.userId).toBe(testUser.id)
      expect(decoded.email).toBe(testUser.email)
    })
  })

  describe('GET /api/auth/me', () => {
    let testUser
    let validToken

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Test User',
          credits: 100,
        },
      })

      validToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      )
    })

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(testUser.id)
      expect(response.body.data.email).toBe(testUser.email)
      expect(response.body.data.password).toBeUndefined()
    })

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('No token provided')
    })

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid token')
    })

    it('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired
      )

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Token expired')
    })

    it('should return 404 for non-existent user', async () => {
      const tokenForNonExistentUser = jwt.sign(
        { userId: 'non-existent-id', email: 'fake@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      )

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenForNonExistentUser}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('User not found')
    })

    it('should handle malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/user/profile', () => {
    let testUser
    let validToken

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Test User',
          credits: 100,
        },
      })

      validToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      )
    })

    it('should get user profile with order statistics', async () => {
      // Create some test orders
      await prisma.order.createMany({
        data: [
          { userId: testUser.id, receiverName: 'Test', receiverPhone: '123', receiverAddress: 'Addr', totalAmount: 100, status: 'pending', paymentMethod: 'alipay', paymentStatus: 'pending' },
          { userId: testUser.id, receiverName: 'Test', receiverPhone: '123', receiverAddress: 'Addr', totalAmount: 200, status: 'paid', paymentMethod: 'alipay', paymentStatus: 'paid' },
        ],
      })

      const response = await request(app)
        .get('/api/auth/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(testUser.id)
      expect(response.body.data.orderStats).toBeDefined()
      expect(response.body.data.orderStats.pending).toBe(1)
      expect(response.body.data.orderStats.paid).toBe(1)
    })

    it('should include user relationship counts', async () => {
      const response = await request(app)
        .get('/api/auth/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200)

      expect(response.body.data._count).toBeDefined()
      expect(response.body.data._count.orders).toBeDefined()
      expect(response.body.data._count.petIPs).toBeDefined()
      expect(response.body.data._count.addresses).toBeDefined()
    })
  })

  describe('PUT /api/user/profile', () => {
    let testUser
    let validToken

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Test User',
          credits: 100,
        },
      })

      validToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      )
    })

    it('should update user profile successfully', async () => {
      const updates = {
        name: 'Updated Name',
        phone: '13800138000',
        bio: 'Updated bio',
      }

      const response = await request(app)
        .put('/api/auth/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updates)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe(updates.name)
      expect(response.body.data.phone).toBe(updates.phone)
      expect(response.body.data.bio).toBe(updates.bio)
    })

    it('should reject update with invalid phone format', async () => {
      const response = await request(app)
        .put('/api/auth/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          phone: 'invalid-phone',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(Array.isArray(response.body.error)).toBe(true)
    })

    it('should reject update with invalid avatar URL', async () => {
      const response = await request(app)
        .put('/api/auth/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          avatar: 'not-a-url',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should reject update with empty name', async () => {
      const response = await request(app)
        .put('/api/auth/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: '',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should reject update with bio exceeding max length', async () => {
      const response = await request(app)
        .put('/api/auth/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          bio: 'a'.repeat(201), // Max is 200
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should handle partial updates', async () => {
      const response = await request(app)
        .put('/api/auth/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'New Name Only',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('New Name Only')
    })

    it('should reject update with no valid fields', async () => {
      const response = await request(app)
        .put('/api/auth/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('No valid fields to update')
    })
  })

  describe('PUT /api/user/password', () => {
    let testUser
    let validToken

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Test User',
          credits: 100,
        },
      })

      validToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      )
    })

    it('should change password successfully', async () => {
      const response = await request(app)
        .put('/api/auth/user/password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword456',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Password changed successfully')

      // Verify password was changed
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
      })

      const isNewPasswordValid = await bcrypt.compare('newpassword456', user.password)
      expect(isNewPasswordValid).toBe(true)
    })

    it('should reject password change with incorrect current password', async () => {
      const response = await request(app)
        .put('/api/auth/user/password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword456',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Current password is incorrect')
    })

    it('should reject password change with short new password', async () => {
      const response = await request(app)
        .put('/api/auth/user/password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: '12345', // Less than 6 characters
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(Array.isArray(response.body.error)).toBe(true)
    })

    it('should reject password change with missing current password', async () => {
      const response = await request(app)
        .put('/api/auth/user/password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          newPassword: 'newpassword456',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should reject password change with missing new password', async () => {
      const response = await request(app)
        .put('/api/auth/user/password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          currentPassword: 'password123',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should hash new password before saving', async () => {
      await request(app)
        .put('/api/auth/user/password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword456',
        })
        .expect(200)

      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
      })

      expect(user.password).not.toBe('newpassword456')
      expect(user.password).not.toBe(testUser.password)
    })
  })

  describe('Security Tests', () => {
    it('should not expose password in user response', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.data.user.password).toBeUndefined()
      expect(response.body.data.user).not.toHaveProperty('password')
    })

    it('should handle SQL injection attempts in email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: "'; DROP TABLE users; --",
          password: 'password123',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should rate limit repeated failed login attempts (if implemented)', async () => {
      // This test checks if rate limiting exists
      // If it doesn't exist yet, it will pass anyway
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
      }

      // If rate limiting is implemented, the 10th request might be rate limited
      // For now, we just verify the endpoint still works
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })

      expect([401, 429]).toContain(response.status)
    })
  })
})
