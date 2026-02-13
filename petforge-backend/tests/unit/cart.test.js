import { describe, it, expect, beforeAll, afterEach, beforeEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import cartRoutes from '../../src/routes/cart.js'
import { authenticateToken } from '../../src/middleware/auth.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import prisma from '../../src/config/database.js'

// Setup Express app for testing
const app = express()
app.use(express.json())

// Mock authentication middleware for testing
app.use((req, res, next) => {
  const authHeader = req.headers['authorization']
  if (authHeader) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key')
      req.user = decoded
    } catch (error) {
      // Continue anyway, we'll handle auth in routes
    }
  }
  next()
})

app.use('/api/cart', cartRoutes)

describe('Cart Routes', () => {
  let testUser
  let authHeader
  let testPetIP
  let testAddress

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'
  })

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: await bcrypt.hash('password123', 10),
        name: 'Test User',
        credits: 100,
      },
    })

    // Create test PetIP
    testPetIP = await prisma.petIP.create({
      data: {
        userId: testUser.id,
        name: 'Test Pet',
        style: 'cartoon',
        originalImage: 'http://example.com/original.jpg',
        generatedImage: 'http://example.com/generated.jpg',
        rarity: 'common',
      },
    })

    // Create test address
    testAddress = await prisma.address.create({
      data: {
        userId: testUser.id,
        receiverName: 'Test Receiver',
        receiverPhone: '13800138000',
        province: 'Beijing',
        city: 'Beijing',
        district: 'Chaoyang',
        detailAddress: 'Test Street 123',
        isDefault: true,
      },
    })

    // Generate auth header
    const token = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )
    authHeader = { Authorization: `Bearer ${token}` }
  })

  afterEach(async () => {
    // Clean up in reverse order of dependencies
    await prisma.cartItem.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.address.deleteMany({})
    await prisma.petIP.deleteMany({})
    await prisma.user.deleteMany({})
  })

  describe('GET /api/cart', () => {
    it('should get empty cart for new user', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set(authHeader)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual([])
    })

    it('should get cart with items', async () => {
      // Create cart items
      await prisma.cartItem.create({
        data: {
          userId: testUser.id,
          petIpId: testPetIP.id,
          productType: 'tshirt',
          productName: 'Custom T-Shirt',
          price: 99.99,
          quantity: 2,
        },
      })

      const response = await request(app)
        .get('/api/cart')
        .set(authHeader)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].productType).toBe('tshirt')
      expect(response.body.data[0].petIp).toBeDefined()
    })

    it('should return cart items ordered by createdAt desc', async () => {
      // Create multiple cart items
      await prisma.cartItem.createMany({
        data: [
          {
            userId: testUser.id,
            productType: 'tshirt',
            productName: 'T-Shirt 1',
            price: 99.99,
            quantity: 1,
          },
          {
            userId: testUser.id,
            productType: 'mug',
            productName: 'Mug 1',
            price: 29.99,
            quantity: 2,
          },
        ],
      })

      const response = await request(app)
        .get('/api/cart')
        .set(authHeader)
        .expect(200)

      expect(response.body.data[0].createdAt >= response.body.data[1].createdAt).toBe(true)
    })

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/cart')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/cart', () => {
    it('should add item to cart successfully', async () => {
      const cartItemData = {
        petIpId: testPetIP.id,
        productType: 'tshirt',
        productName: 'Custom T-Shirt',
        price: 99.99,
        size: 'L',
        baseStyle: 'modern',
        quantity: 2,
      }

      const response = await request(app)
        .post('/api/cart')
        .set(authHeader)
        .send(cartItemData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.productType).toBe(cartItemData.productType)
      expect(response.body.data.quantity).toBe(cartItemData.quantity)
      expect(response.body.data.petIp).toBeDefined()
    })

    it('should add item without PetIP association', async () => {
      const cartItemData = {
        productType: 'mug',
        productName: 'Custom Mug',
        price: 29.99,
        quantity: 1,
      }

      const response = await request(app)
        .post('/api/cart')
        .set(authHeader)
        .send(cartItemData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.petIpId).toBeNull()
    })

    it('should reject item with negative price', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set(authHeader)
        .send({
          productType: 'tshirt',
          productName: 'T-Shirt',
          price: -10,
          quantity: 1,
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      })

    it('should reject item with missing product type', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set(authHeader)
        .send({
          productName: 'T-Shirt',
          price: 99.99,
          quantity: 1,
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should reject item with missing product name', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set(authHeader)
        .send({
          productType: 'tshirt',
          price: 99.99,
          quantity: 1,
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should default quantity to 1 if not provided', async () => {
      const cartItemData = {
        productType: 'mug',
        productName: 'Mug',
        price: 29.99,
      }

      const response = await request(app)
        .post('/api/cart')
        .set(authHeader)
        .send(cartItemData)
        .expect(201)

      expect(response.body.data.quantity).toBe(1)
    })

    it('should handle zero quantity (should default to 1)', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set(authHeader)
        .send({
          productType: 'mug',
          productName: 'Mug',
          price: 29.99,
          quantity: 0,
        })
        .expect(201)

      expect(response.body.data.quantity).toBe(1)
    })

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/cart')
        .send({
          productType: 'tshirt',
          productName: 'T-Shirt',
          price: 99.99,
        })
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should handle fractional prices correctly', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set(authHeader)
        .send({
          petIpId: testPetIP.id,
          productType: 'tshirt',
          productName: 'T-Shirt',
          price: 99.999,
          quantity: 1,
        })
        .expect(201)

      expect(response.body.data.price).toBeCloseTo(99.999, 3)
    })
  })

  describe('DELETE /api/cart', () => {
    let cartItem

    beforeEach(async () => {
      cartItem = await prisma.cartItem.create({
        data: {
          userId: testUser.id,
          petIpId: testPetIP.id,
          productType: 'tshirt',
          productName: 'T-Shirt',
          price: 99.99,
          quantity: 1,
        },
      })
    })

    it('should delete item from cart successfully', async () => {
      const response = await request(app)
        .delete('/api/cart')
        .query({ id: cartItem.id })
        .set(authHeader)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Item removed from cart')

      // Verify item was deleted
      const deletedItem = await prisma.cartItem.findUnique({
        where: { id: cartItem.id },
      })
      expect(deletedItem).toBeNull()
    })

    it('should reject delete with missing item ID', async () => {
      const response = await request(app)
        .delete('/api/cart')
        .set(authHeader)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Cart item ID is required')
    })

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .delete('/api/cart')
        .query({ id: 'non-existent-id' })
        .set(authHeader)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Cart item not found')
    })

    it('should prevent deleting items belonging to other users', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: `other-${Date.now()}@example.com`,
          password: await bcrypt.hash('password123', 10),
          name: 'Other User',
          credits: 100,
        },
      })

      // Create cart item for other user
      const otherCartItem = await prisma.cartItem.create({
        data: {
          userId: otherUser.id,
          productType: 'mug',
          productName: 'Mug',
          price: 29.99,
          quantity: 1,
        },
      })

      // Try to delete other user's item
      const response = await request(app)
        .delete('/api/cart')
        .query({ id: otherCartItem.id })
        .set(authHeader)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Access denied')

      // Verify other user's item still exists
      const item = await prisma.cartItem.findUnique({
        where: { id: otherCartItem.id },
      })
      expect(item).not.toBeNull()
    })

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .delete('/api/cart')
        .query({ id: cartItem.id })
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('PATCH /api/cart/:id', () => {
    let cartItem

    beforeEach(async () => {
      cartItem = await prisma.cartItem.create({
        data: {
          userId: testUser.id,
          petIpId: testPetIP.id,
          productType: 'tshirt',
          productName: 'T-Shirt',
          price: 99.99,
          quantity: 1,
        },
      })
    })

    it('should update cart item quantity successfully', async () => {
      const newQuantity = 5

      const response = await request(app)
        .patch(`/api/cart/${cartItem.id}`)
        .set(authHeader)
        .send({ quantity: newQuantity })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.quantity).toBe(newQuantity)

      // Verify in database
      const updatedItem = await prisma.cartItem.findUnique({
        where: { id: cartItem.id },
      })
      expect(updatedItem.quantity).toBe(newQuantity)
    })

    it('should reject quantity less than 1', async () => {
      const response = await request(app)
        .patch(`/api/cart/${cartItem.id}`)
        .set(authHeader)
        .send({ quantity: 0 })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Valid quantity is required')
    })

    it('should reject negative quantity', async () => {
      const response = await request(app)
        .patch(`/api/cart/${cartItem.id}`)
        .set(authHeader)
        .send({ quantity: -1 })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .patch('/api/cart/non-existent-id')
        .set(authHeader)
        .send({ quantity: 5 })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Cart item not found')
    })

    it('should prevent updating items belonging to other users', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: `other-${Date.now()}@example.com`,
          password: await bcrypt.hash('password123', 10),
          name: 'Other User',
          credits: 100,
        },
      })

      // Create cart item for other user
      const otherCartItem = await prisma.cartItem.create({
        data: {
          userId: otherUser.id,
          productType: 'mug',
          productName: 'Mug',
          price: 29.99,
          quantity: 1,
        },
      })

      // Try to update other user's item
      const response = await request(app)
        .patch(`/api/cart/${otherCartItem.id}`)
        .set(authHeader)
        .send({ quantity: 5 })
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Access denied')
    })

    it('should handle missing quantity in request body', async () => {
      const response = await request(app)
        .patch(`/api/cart/${cartItem.id}`)
        .set(authHeader)
        .send({})
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .patch(`/api/cart/${cartItem.id}`)
        .send({ quantity: 5 })
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should handle very large quantities', async () => {
      const response = await request(app)
        .patch(`/api/cart/${cartItem.id}`)
        .set(authHeader)
        .send({ quantity: 999999 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.quantity).toBe(999999)
    })
  })

  describe('POST /api/cart/clear', () => {
    beforeEach(async () => {
      // Create multiple cart items
      await prisma.cartItem.createMany({
        data: [
          {
            userId: testUser.id,
            productType: 'tshirt',
            productName: 'T-Shirt 1',
            price: 99.99,
            quantity: 1,
          },
          {
            userId: testUser.id,
            productType: 'mug',
            productName: 'Mug 1',
            price: 29.99,
            quantity: 2,
          },
        ],
      })
    })

    it('should clear all cart items successfully', async () => {
      // Verify items exist before clearing
      const itemsBefore = await prisma.cartItem.findMany({
        where: { userId: testUser.id },
      })
      expect(itemsBefore.length).toBe(2)

      const response = await request(app)
        .post('/api/cart/clear')
        .set(authHeader)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Cart cleared successfully')

      // Verify all items were deleted
      const itemsAfter = await prisma.cartItem.findMany({
        where: { userId: testUser.id },
      })
      expect(itemsAfter).toEqual([])
    })

    it('should handle clearing empty cart', async () => {
      // Clear first
      await prisma.cartItem.deleteMany({
        where: { userId: testUser.id },
      })

      const response = await request(app)
        .post('/api/cart/clear')
        .set(authHeader)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should only clear items for the authenticated user', async () => {
      // Create another user with cart items
      const otherUser = await prisma.user.create({
        data: {
          email: `other-${Date.now()}@example.com`,
          password: await bcrypt.hash('password123', 10),
          name: 'Other User',
          credits: 100,
        },
      })

      await prisma.cartItem.create({
        data: {
          userId: otherUser.id,
          productType: 'mug',
          productName: 'Mug',
          price: 29.99,
          quantity: 1,
        },
      })

      // Clear cart for testUser
      await request(app)
        .post('/api/cart/clear')
        .set(authHeader)
        .expect(200)

      // Verify other user's items still exist
      const otherUserItems = await prisma.cartItem.findMany({
        where: { userId: otherUser.id },
      })
      expect(otherUserItems.length).toBe(1)
    })

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/cart/clear')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('Edge Cases and Integration', () => {
    it('should handle adding same PetIP multiple times', async () => {
      const cartItemData = {
        petIpId: testPetIP.id,
        productType: 'tshirt',
        productName: 'T-Shirt',
        price: 99.99,
        quantity: 1,
      }

      // Add same item twice
      await request(app)
        .post('/api/cart')
        .set(authHeader)
        .send(cartItemData)
        .expect(201)

      await request(app)
        .post('/api/cart')
        .set(authHeader)
        .send(cartItemData)
        .expect(201)

      // Should have 2 separate items
      const response = await request(app)
        .get('/api/cart')
        .set(authHeader)
        .expect(200)

      expect(response.body.data.length).toBe(2)
    })

    it('should handle concurrent updates to same item', async () => {
      const cartItem = await prisma.cartItem.create({
        data: {
          userId: testUser.id,
          productType: 'tshirt',
          productName: 'T-Shirt',
          price: 99.99,
          quantity: 1,
        },
      })

      // Update quantity multiple times
      await Promise.all([
        request(app)
          .patch(`/api/cart/${cartItem.id}`)
          .set(authHeader)
          .send({ quantity: 3 }),
        request(app)
          .patch(`/api/cart/${cartItem.id}`)
          .set(authHeader)
          .send({ quantity: 5 }),
      ])

      // Verify final state
      const item = await prisma.cartItem.findUnique({
        where: { id: cartItem.id },
      })

      // Should be one of the update values
      expect([3, 5]).toContain(item.quantity)
    })

    it('should handle cart items with all optional fields', async () => {
      const cartItemData = {
        petIpId: testPetIP.id,
        productType: 'hoodie',
        productName: 'Custom Hoodie',
        price: 149.99,
        size: 'XL',
        baseStyle: 'modern',
        quantity: 3,
        originalImage: 'http://example.com/original.jpg',
        generatedImage: 'http://example.com/generated.jpg',
      }

      const response = await request(app)
        .post('/api/cart')
        .set(authHeader)
        .send(cartItemData)
        .expect(201)

      expect(response.body.data.size).toBe(cartItemData.size)
      expect(response.body.data.baseStyle).toBe(cartItemData.baseStyle)
      expect(response.body.data.originalImage).toBe(cartItemData.originalImage)
      expect(response.body.data.generatedImage).toBe(cartItemData.generatedImage)
    })
  })
})
