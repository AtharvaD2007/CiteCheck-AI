import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { User } from './models/User.js';
import { Report } from './models/Report.js';
import { Session } from './models/Session.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

// In-memory cache for fast session token lookup
const memorySessionCache = new Map();

// Helper to read JSON safely
function readJSON(file, fallback = []) {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`[File DB] Error reading ${file}:`, err.message);
  }
  return fallback;
}

// Safely migrate existing JSON file data into MongoDB Atlas
async function migrateFromJSONFiles() {
  try {
    let migratedUsers = 0;
    let migratedReports = 0;

    // 1. Migrate Users
    if (fs.existsSync(USERS_FILE)) {
      const usersData = readJSON(USERS_FILE, []);
      for (const u of usersData) {
        if (!u || !u.email) continue;
        const cleanEmail = u.email.trim().toLowerCase();
        const existing = await User.findOne({
          $or: [{ id: u.id }, { email: cleanEmail }]
        }).lean();

        if (!existing) {
          await User.create({
            id: u.id || `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            name: (u.name || 'Scholar').trim(),
            email: cleanEmail,
            passwordHash: u.passwordHash,
            role: u.role || 'Researcher',
            institution: u.institution || 'Academic Institution',
            isVerified: u.isVerified !== undefined ? u.isVerified : true,
            verificationToken: u.verificationToken || null,
            verificationTokenExpires: u.verificationTokenExpires ? new Date(u.verificationTokenExpires) : null,
            createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
            verifiedAt: u.verifiedAt ? new Date(u.verifiedAt) : new Date()
          });
          migratedUsers++;
        }
      }
    }

    // 2. Migrate Reports
    if (fs.existsSync(REPORTS_FILE)) {
      const reportsData = readJSON(REPORTS_FILE, []);
      for (const r of reportsData) {
        if (!r || !r.id || !r.userId) continue;
        const existing = await Report.findOne({ id: r.id }).lean();
        if (!existing) {
          await Report.create({
            id: r.id,
            userId: r.userId,
            title: r.title || 'Academic Verification Report',
            input: r.input || {},
            report: r.report || {},
            createdAt: r.createdAt ? new Date(r.createdAt) : new Date()
          });
          migratedReports++;
        }
      }
    }

    if (migratedUsers > 0 || migratedReports > 0) {
      console.log(`[MongoDB Migration] Successfully migrated ${migratedUsers} user(s) and ${migratedReports} report(s) from JSON files to MongoDB.`);
    } else {
      console.log('[MongoDB Migration] Existing records verified. MongoDB database is up to date.');
    }
  } catch (err) {
    console.warn('[MongoDB Migration Warning] File migration notice:', err.message);
  }
}

// Connect to MongoDB Atlas
export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/citecheck';

  try {
    // Avoid re-connecting if already connected
    if (mongoose.connection.readyState === 1) {
      return;
    }

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB Error] Database connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB Warning] Lost connection to MongoDB.');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[MongoDB Info] Reconnected to MongoDB.');
    });

    console.log('[MongoDB] Connecting to database...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    console.log(`[MongoDB] Connected successfully to ${mongoose.connection.name} (${mongoose.connection.host})`);

    // Run one-time safe migration from existing JSON files
    await migrateFromJSONFiles();
  } catch (err) {
    console.error(`[MongoDB Connection Failed] ${err.message}`);
    console.warn('[MongoDB] Please check your MONGODB_URI in server/.env.');
    throw err;
  }
}

export const DB = {
  isConnected() {
    return mongoose.connection.readyState === 1;
  },

  // User Management
  async findUserByEmail(email) {
    if (!email) return null;
    return await User.findOne({ email: email.trim().toLowerCase() }).lean();
  },

  async findUserById(id) {
    if (!id) return null;
    return await User.findOne({ id }).lean();
  },

  async findUserByVerificationToken(token) {
    if (!token) return null;
    return await User.findOne({ verificationToken: token }).lean();
  },

  async createUser({ name, email, password, role = 'Researcher', institution = 'Academic Institution' }) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail }).lean();

    if (existing) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    // Fast, secure bcrypt hashing (8 rounds = ~15ms, non-blocking)
    const passwordHash = await bcrypt.hash(password, 8);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUserDoc = await User.create({
      id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: role.trim() || 'Researcher',
      institution: institution.trim() || 'Academic Institution',
      isVerified: true,
      verificationToken,
      verificationTokenExpires,
      createdAt: new Date(),
      verifiedAt: new Date()
    });

    return newUserDoc.toObject();
  },

  async verifyUserEmail(token) {
    if (!token) {
      throw new Error('Verification token is required.');
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      throw new Error('Invalid or expired verification token.');
    }

    if (user.verificationTokenExpires && new Date(user.verificationTokenExpires) < new Date()) {
      throw new Error('Verification token has expired. Please request a new verification link.');
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    user.verifiedAt = new Date();
    await user.save();

    return this.sanitizeUser(user.toObject());
  },

  async generateNewVerificationToken(email) {
    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      throw new Error('User with this email was not found.');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = tokenExpires;
    await user.save();

    return { user: this.sanitizeUser(user.toObject()), verificationToken };
  },

  async verifyCredentials(email, password) {
    const user = await this.findUserByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;
    return user;
  },

  async createSession(userId) {
    const token = `tok_${crypto.randomBytes(24).toString('hex')}`;
    memorySessionCache.set(token, userId);

    try {
      await Session.create({ token, userId });
    } catch (err) {
      console.warn('[Session Error] Could not persist session to MongoDB:', err.message);
    }

    return token;
  },

  async getUserByToken(token) {
    if (!token) return null;

    // Check memory cache first for rapid response
    let userId = memorySessionCache.get(token);

    if (!userId) {
      const sessionDoc = await Session.findOne({ token }).lean();
      if (sessionDoc) {
        userId = sessionDoc.userId;
        memorySessionCache.set(token, userId);
      }
    }

    if (!userId) return null;
    const user = await this.findUserById(userId);
    if (!user) return null;
    return this.sanitizeUser(user);
  },

  async deleteSession(token) {
    if (!token) return;
    memorySessionCache.delete(token);
    try {
      await Session.deleteOne({ token });
    } catch {
      // ignore
    }
  },

  sanitizeUser(user) {
    if (!user) return null;
    const { _id, passwordHash, verificationToken, verificationTokenExpires, ...safeUser } = user;
    return safeUser;
  },

  // Reports Management - Strictly isolated per user with duplicate prevention
  async getReportsByUser(userId) {
    if (!userId) return [];
    const userReports = await Report.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Ensure My Reports displays each saved report only once
    const seenSignatures = new Set();
    const seenIds = new Set();
    const uniqueReports = [];

    for (const r of userReports) {
      if (!r || !r.id || seenIds.has(r.id)) continue;

      const cleanClaim = (r.input?.claim || '').trim().toLowerCase();
      const cleanPassage = (r.input?.sourcePassage || '').trim().toLowerCase();
      const sig = `${cleanClaim}|${cleanPassage}`;

      if (cleanClaim && cleanPassage && seenSignatures.has(sig)) {
        continue;
      }

      seenIds.add(r.id);
      if (cleanClaim && cleanPassage) {
        seenSignatures.add(sig);
      }

      const { _id, ...cleanReport } = r;
      uniqueReports.push(cleanReport);
    }

    return uniqueReports;
  },

  async getReportById(id, userId) {
    if (!id || !userId) return null;
    const reportDoc = await Report.findOne({ id, userId }).lean();
    if (!reportDoc) return null;
    const { _id, ...cleanReport } = reportDoc;
    return cleanReport;
  },

  async saveReport({ userId, title, input, report }) {
    if (!userId) {
      throw new Error('User authentication required to save reports.');
    }

    // Backend duplicate protection: check if an identical report already exists for this user
    const cleanClaim = (input?.claim || '').trim().toLowerCase();
    const cleanPassage = (input?.sourcePassage || '').trim().toLowerCase();

    if (cleanClaim && cleanPassage) {
      const existingReport = await Report.findOne({
        userId,
        'input.claim': { $regex: new RegExp(`^${cleanClaim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        'input.sourcePassage': { $regex: new RegExp(`^${cleanPassage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      }).lean();

      if (existingReport) {
        const { _id, ...cleanReport } = existingReport;
        return cleanReport;
      }
    }

    const newReportData = {
      id: `rep_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId,
      title: title || (input?.claim ? (input.claim.slice(0, 60) + (input.claim.length > 60 ? '...' : '')) : 'Academic Verification Report'),
      input,
      report,
      createdAt: new Date()
    };

    const createdDoc = await Report.create(newReportData);
    const { _id, ...savedReport } = createdDoc.toObject();
    return savedReport;
  },

  async deleteReport(id, userId) {
    if (!id || !userId) return false;
    const res = await Report.deleteOne({ id, userId });
    return res.deletedCount > 0;
  }
};
