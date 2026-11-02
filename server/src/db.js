import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory token store: sessionToken -> userId
const tokenStore = new Map();

// Helper to read JSON safely
function readJSON(file, fallback = []) {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
  }
  return fallback;
}

// Helper to write JSON safely
function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
  }
}

// Initialize data files — ensure all accounts are active and verified (no email verification needed)
function initializeDB() {
  if (!fs.existsSync(USERS_FILE)) {
    writeJSON(USERS_FILE, []);
  } else {
    // Ensure existing accounts are marked verified
    const users = readJSON(USERS_FILE, []);
    let modified = false;
    for (const u of users) {
      if (u.isVerified !== true) {
        u.isVerified = true;
        u.verificationToken = null;
        modified = true;
      }
    }
    if (modified) {
      writeJSON(USERS_FILE, users);
    }
  }

  if (!fs.existsSync(REPORTS_FILE)) {
    writeJSON(REPORTS_FILE, []);
  }
}

initializeDB();

export const DB = {
  // User Management
  findUserByEmail(email) {
    if (!email) return null;
    const users = readJSON(USERS_FILE, []);
    return users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
  },

  findUserById(id) {
    if (!id) return null;
    const users = readJSON(USERS_FILE, []);
    return users.find((u) => u.id === id) || null;
  },

  findUserByVerificationToken(token) {
    if (!token) return null;
    const users = readJSON(USERS_FILE, []);
    return users.find((u) => u.verificationToken === token) || null;
  },

  async createUser({ name, email, password, role = 'Researcher', institution = 'Academic Institution' }) {
    const users = readJSON(USERS_FILE, []);
    const cleanEmail = email.trim().toLowerCase();
    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

    if (existingIndex !== -1) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    // Fast, secure bcrypt hashing (8 rounds = ~15ms, zero event loop freezing)
    const passwordHash = await bcrypt.hash(password, 8);

    const newUser = {
      id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: role.trim() || 'Researcher',
      institution: institution.trim() || 'Academic Institution',
      isVerified: true, // Email verification removed: users are immediately verified
      verificationToken: null,
      verificationTokenExpires: null,
      createdAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString()
    };

    users.push(newUser);
    writeJSON(USERS_FILE, users);
    return newUser;
  },

  verifyUserEmail(token) {
    // Email verification removed: return true / user directly
    const users = readJSON(USERS_FILE, []);
    if (token) {
      const user = users.find((u) => u.verificationToken === token) || users[0];
      if (user) {
        user.isVerified = true;
        writeJSON(USERS_FILE, users);
        return this.sanitizeUser(user);
      }
    }
    return { isVerified: true };
  },

  generateNewVerificationToken(email) {
    const users = readJSON(USERS_FILE, []);
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    return { user: user ? this.sanitizeUser(user) : null, verificationToken: 'not_required' };
  },

  async verifyCredentials(email, password) {
    const user = this.findUserByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;
    return user;
  },

  createSession(userId) {
    const token = `tok_${crypto.randomBytes(24).toString('hex')}`;
    tokenStore.set(token, userId);
    return token;
  },

  getUserByToken(token) {
    if (!token) return null;
    const userId = tokenStore.get(token);
    if (!userId) return null;
    const user = this.findUserById(userId);
    if (!user) return null;
    return this.sanitizeUser(user);
  },

  deleteSession(token) {
    tokenStore.delete(token);
  },

  sanitizeUser(user) {
    if (!user) return null;
    const { passwordHash, verificationToken, verificationTokenExpires, ...safeUser } = user;
    return safeUser;
  },

  // Reports Management - Strictly isolated per user with duplicate prevention
  getReportsByUser(userId) {
    if (!userId) return [];
    const reports = readJSON(REPORTS_FILE, []);
    const userReports = reports
      .filter((r) => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
      uniqueReports.push(r);
    }

    return uniqueReports;
  },

  getReportById(id, userId) {
    if (!id || !userId) return null;
    const reports = readJSON(REPORTS_FILE, []);
    return reports.find((r) => r.id === id && r.userId === userId) || null;
  },

  saveReport({ userId, title, input, report }) {
    if (!userId) {
      throw new Error('User authentication required to save reports.');
    }
    const reports = readJSON(REPORTS_FILE, []);

    // Backend duplicate protection: check if an identical report already exists for this user
    const cleanClaim = (input?.claim || '').trim().toLowerCase();
    const cleanPassage = (input?.sourcePassage || '').trim().toLowerCase();

    if (cleanClaim && cleanPassage) {
      const existingReport = reports.find((r) => {
        if (r.userId !== userId) return false;
        const rClaim = (r.input?.claim || '').trim().toLowerCase();
        const rPassage = (r.input?.sourcePassage || '').trim().toLowerCase();
        return rClaim === cleanClaim && rPassage === cleanPassage;
      });

      if (existingReport) {
        // Return existing saved record without adding a duplicate
        return existingReport;
      }
    }

    const newReport = {
      id: `rep_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId,
      title: title || (input?.claim ? (input.claim.slice(0, 60) + (input.claim.length > 60 ? '...' : '')) : 'Academic Verification Report'),
      input,
      report,
      createdAt: new Date().toISOString()
    };

    reports.unshift(newReport);
    writeJSON(REPORTS_FILE, reports);
    return newReport;
  },

  deleteReport(id, userId) {
    if (!id || !userId) return false;
    const reports = readJSON(REPORTS_FILE, []);
    const index = reports.findIndex((r) => r.id === id && r.userId === userId);
    if (index === -1) {
      return false;
    }
    reports.splice(index, 1);
    writeJSON(REPORTS_FILE, reports);
    return true;
  }
};
