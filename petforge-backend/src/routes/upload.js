import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import prisma from '../config/database.js';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Auth middleware for upload
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow guest uploads - create/use a guest user
      req.userId = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'petforge-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    // Token invalid, allow as guest
    req.userId = null;
    next();
  }
};

// Configure multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

// Upload pet photo and generate PetIP
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const { name, style } = req.body;

    if (!name || !style) {
      // Clean up uploaded file if validation fails
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        error: 'Name and style are required',
      });
    }

    // Get or create user for this upload
    let userId = req.userId;

    if (!userId) {
      // Create or get guest user
      const guestUser = await prisma.user.upsert({
        where: { email: 'guest@petforge.local' },
        update: {},
        create: {
          email: 'guest@petforge.local',
          name: 'Guest User',
          password: 'guest-placeholder',
          credits: 0,
        },
      });
      userId = guestUser.id;
    }

    // In production, you would call AI service here
    // For now, copy the uploaded file as "generated"
    const generatedFilename = 'generated-' + req.file.filename;
    const generatedPath = path.join(__dirname, '../../uploads', generatedFilename);
    await fs.copyFile(req.file.path, generatedPath);

    // Calculate rarity based on random chance
    const rarityRoll = Math.random();
    const rarity = rarityRoll < 0.05 ? 'Legendary' :
                   rarityRoll < 0.15 ? 'Epic' :
                   rarityRoll < 0.35 ? 'Rare' : 'Common';

    // Create PetIP in database
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
    const petIP = await prisma.petIP.create({
      data: {
        userId,
        name,
        style,
        originalImage: `${baseUrl}/uploads/${req.file.filename}`,
        generatedImage: `${baseUrl}/uploads/${generatedFilename}`,
        rarity,
      },
    });

    res.json({
      success: true,
      data: petIP,
    });
  } catch (error) {
    console.error('Upload error:', error);

    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      error: 'Upload failed',
    });
  }
});

export default router;
