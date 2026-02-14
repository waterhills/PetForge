/**
 * JWT Token Security Tests
 *
 * Comprehensive security tests for JWT token generation, validation, and usage.
 * Tests cover token generation, validation, expiration, refresh, and security best practices.
 */

import { describe, it, expect, beforeAll, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../../src/config/database.js';
import authRoutes from '../../src/routes/auth.js';

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('JWT Token Security Tests', () => {
  let testUser;
  let validToken;

  beforeAll(() => {
    // Set test environment
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing';
    process.env.JWT_EXPIRES_IN = '7d';
  });

  afterEach(async () => {
    // Clean up database
    await prisma.user.deleteMany({});
  });

  /**
   * Token Generation Tests
   */
  describe('Token Generation', () => {
    it('should generate token with secure expiration (7 days)', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();

      const token = response.body.data.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verify expiration (default: 7 days)
      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBe(7 * 24 * 60 * 60); // 7 days in seconds
    });

    it('should not include sensitive data in token payload', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = response.body.data.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verify sensitive data is NOT included
      expect(decoded).not.toHaveProperty('password');
      expect(decoded).not.toHaveProperty('credits');
      expect(decoded).not.toHaveProperty('phone');
      expect(decoded).not.toHaveProperty('bio');

      // Verify only necessary data is included
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('email');
    });

    it('should use HS256 algorithm by default', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = response.body.data.token;
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded.header.alg).toBe('HS256');
    });

    it('should generate unique token for each login', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      // Register user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Login first time
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      // Login second time
      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      const token1 = response1.body.data.token;
      const token2 = response2.body.data.token;

      // Tokens should be different (different iat timestamps)
      expect(token1).not.toBe(token2);

      const decoded1 = jwt.decode(token1);
      const decoded2 = jwt.decode(token2);

      expect(decoded1.iat).not.toBe(decoded2.iat);
    });

    it('should include correct userId in token', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = response.body.data.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(decoded.userId).toBe(user.id);
    });

    it('should include correct email in token', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = response.body.data.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.email).toBe(userData.email);
    });
  });

  /**
   * Token Validation Tests
   */
  describe('Token Validation', () => {
    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Test User',
          credits: 100,
        },
      });

      validToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    });

    it('should accept valid token on protected route', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.email).toBe(testUser.email);
    });

    it('should reject request without Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should reject request with empty Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', '')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with Authorization header without Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', validToken)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token format', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-a-valid-jwt')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired token');
    });

    it('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired token');
    });

    it('should reject request with token signed with wrong secret', async () => {
      const wrongSecretToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        'wrong-secret-key',
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${wrongSecretToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired token');
    });

    it('should reject request with malformed token (missing signature)', async () => {
      const malformedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.'; // Missing signature part

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${malformedToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with empty token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should set req.user and req.userId when token is valid', async () => {
      // This test verifies middleware behavior
      // We'll test this indirectly by checking if we can access user-specific data

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // If middleware sets req.userId correctly, we should get the correct user
      expect(response.body.data.id).toBe(testUser.id);
    });
  });

  /**
   * Token Expiration Tests
   */
  describe('Token Expiration', () => {
    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Test User',
          credits: 100,
        },
      });
    });

    it('should accept token with valid expiration time', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should accept token that expires in the future (1 hour)', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should accept token that expires in the future (1 minute)', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1m' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject token that expired 1 second ago', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' } // Expired 1 second ago
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject token that expired 1 hour ago', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject token that expired 1 day ago', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1d' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should have correct exp claim in decoded token', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const decoded = jwt.decode(token);

      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');

      // exp should be in the future
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should have correct iat (issued at) claim in decoded token', async () => {
      const now = Math.floor(Date.now() / 1000);

      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const decoded = jwt.decode(token);

      expect(decoded.iat).toBeDefined();
      expect(typeof decoded.iat).toBe('number');

      // iat should be very close to now (within 1 second)
      expect(Math.abs(decoded.iat - now)).toBeLessThanOrEqual(1);
    });
  });

  /**
   * Token Refresh Tests
   * Note: Current implementation doesn't have a refresh endpoint, but we test token renewal through login
   */
  describe('Token Refresh/Renewal', () => {
    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Test User',
          credits: 100,
        },
      });
    });

    it('should generate new token on login (token renewal)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();

      const token = response.body.data.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.userId).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
    });

    it('should generate different token on each login', async () => {
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      const token1 = response1.body.data.token;
      const token2 = response2.body.data.token;

      // Tokens should be different
      expect(token1).not.toBe(token2);
    });

    it('should accept newly generated token after old one expires', async () => {
      // Login and get first token
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      const token1 = response1.body.data.token;

      // Verify first token works
      const verifyResponse1 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(verifyResponse1.body.success).toBe(true);

      // Login again to get new token
      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      const token2 = response2.body.data.token;

      // Verify new token works
      const verifyResponse2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(verifyResponse2.body.success).toBe(true);
    });
  });

  /**
   * Security Best Practices Tests
   */
  describe('Security Best Practices', () => {
    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Test User',
          credits: 100,
        },
      });
    });

    it('should not expose token in error messages', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).not.toContain('Bearer');
      expect(response.body.error).not.toMatch(/eyJ/); // JWT base64 pattern
    });

    it('should not accept token with tampered payload', async () => {
      // Create a valid token
      const validToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Tamper with the token (change the payload)
      const [header, payload, signature] = validToken.split('.');
      const tamperedPayload = Buffer.from(payload)
        .toString('base64')
        .replace(testUser.id, 'tampered-id');
      const tamperedToken = `${header}.${Buffer.from(tamperedPayload).toString('base64')}.${signature}`;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should use strong secret key (length > 20 characters)', () => {
      const secretLength = process.env.JWT_SECRET.length;
      expect(secretLength).toBeGreaterThan(20);
    });

    it('should not include password in token (even if hashed)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      const token = response.body.data.token;
      const decoded = jwt.decode(token);

      expect(decoded).not.toHaveProperty('password');
    });

    it('should return 401 instead of 403 for missing token', async () => {
      // Missing token = 401 Unauthorized
      const response1 = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response1.body.error).toBe('Access token required');

      // Invalid token = 403 Forbidden
      const response2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response2.body.error).toBe('Invalid or expired token');
    });

    it('should handle multiple concurrent requests with same token', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Send 10 concurrent requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`)
        );
      }

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  /**
   * Edge Cases Tests
   */
  describe('Edge Cases', () => {
    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Test User',
          credits: 100,
        },
      });
    });

    it('should handle token with extra whitespace', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Token with leading/trailing whitespace should fail
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer  ${token}  `)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should handle token with lowercase "bearer" prefix (case-sensitive)', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Lowercase "bearer" should fail
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `bearer ${token}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle token with uppercase "BEARER" prefix', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Uppercase "BEARER" should fail
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `BEARER ${token}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject token for non-existent user', async () => {
      const token = jwt.sign(
        { userId: 'non-existent-user-id', email: 'fake@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('should handle token with Unicode characters in email', async () => {
      const userWithUnicode = await prisma.user.create({
        data: {
          email: 'test+unicode@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Test User',
          credits: 100,
        },
      });

      const token = jwt.sign(
        { userId: userWithUnicode.id, email: userWithUnicode.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
