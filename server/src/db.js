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

// Initialize clean empty data files and ensure all users have active access
function initializeDB() {
  if (!fs.existsSync(USERS_FILE)) {
    writeJSON(USERS_FILE, []);
  } else {
    // Ensure all existing accounts are marked verified with full access
    const users = readJSON(USERS_FILE, []);
    let modified = false;
    users.forEach((u) => {
      if (!u.isVerified || u.verificationToken) {
        u.isVerified = true;
        u.verificationToken = null;
        u.verificationTokenExpires = null;
        if (!u.verifiedAt) u.verifiedAt = new Date().toISOString();
        modified = true;
      }
    });
    if (modified) writeJSON(USERS_FILE, users);
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

  createUser({ name, email, password, role = 'Researcher', institution = 'Academic Institution' }) {
    const users = readJSON(USERS_FILE, []);
    const cleanEmail = email.trim().toLowerCase();
    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // If user already registered, seamlessly refresh profile & credentials
    if (existingIndex !== -1) {
      const existingUser = users[existingIndex];
      existingUser.name = name.trim() || existingUser.name;
      existingUser.passwordHash = passwordHash;
      existingUser.role = role.trim() || existingUser.role || 'Researcher';
      existingUser.institution = institution.trim() || existingUser.institution || 'Academic Institution';
      existingUser.isVerified = true;
      existingUser.verificationToken = null;
      existingUser.verificationTokenExpires = null;
      existingUser.updatedAt = new Date().toISOString();
      if (!existingUser.verifiedAt) existingUser.verifiedAt = new Date().toISOString();

      users[existingIndex] = existingUser;
      writeJSON(USERS_FILE, users);
      return existingUser;
    }

    const newUser = {
      id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: role.trim() || 'Researcher',
      institution: institution.trim() || 'Academic Institution',
      isVerified: true,
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
    if (!token) {
      throw new Error('Verification token is required.');
    }
    const users = readJSON(USERS_FILE, []);
    const userIndex = users.findIndex((u) => u.verificationToken === token);
    if (userIndex === -1) {
      throw new Error('Invalid or expired verification token.');
    }

    const user = users[userIndex];
    if (user.verificationTokenExpires && new Date(user.verificationTokenExpires) < new Date()) {
      throw new Error('Verification token has expired. Please request a new verification link.');
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    user.verifiedAt = new Date().toISOString();

    users[userIndex] = user;
    writeJSON(USERS_FILE, users);
    return this.sanitizeUser(user);
  },

  generateNewVerificationToken(email) {
    const users = readJSON(USERS_FILE, []);
    const cleanEmail = email.trim().toLowerCase();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (userIndex === -1) {
      throw new Error('User with this email was not found.');
    }

    const user = users[userIndex];
    if (user.isVerified) {
      throw new Error('Email is already verified.');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = tokenExpires;

    users[userIndex] = user;
    writeJSON(USERS_FILE, users);

    return { user, verificationToken };
  },

  verifyCredentials(email, password) {
    const user = this.findUserByEmail(email);
    if (!user) return null;
    const isValid = bcrypt.compareSync(password, user.passwordHash);
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
