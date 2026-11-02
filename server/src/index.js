import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { verifyCitation } from "./verifier.js";
import { DB } from "./db.js";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5001;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Middlewares
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Helper to extract authenticated user from Authorization header
function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  return DB.getUserByToken(token);
}

// Middleware: Require valid logged-in user
function requireAuth(req, res, next) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Authentication required. Please sign in to continue." });
  }
  req.user = user;
  next();
}

// Middleware: Verified status (Email verification removed: pass-through)
function requireVerified(req, res, next) {
  next();
}

// Serve static frontend files if client/dist exists
const clientDistPath = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));

// Health & Status check endpoint
app.get("/api/health", (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyConfigured = Boolean(apiKey && apiKey.trim() !== "" && apiKey !== "your_gemini_api_key_here");
  const hasEmailService = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

  res.json({
    status: "ok",
    service: "CiteCheck AI API",
    version: "2.1.0",
    hasApiKey: isKeyConfigured,
    model: GEMINI_MODEL,
    hasEmailService,
    timestamp: new Date().toISOString()
  });
});

// ================= AUTHENTICATION ENDPOINTS =================

// Register new user (Instant: account is immediately verified and active)
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role, institution } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Full Name is required." });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email address is required." });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const newUser = await DB.createUser({ name, email, password, role, institution });
    const token = DB.createSession(newUser.id);
    const safeUser = DB.sanitizeUser(newUser);

    res.json({
      success: true,
      message: "Registration successful! Welcome to CiteCheck AI.",
      user: safeUser,
      token,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please provide both email and password." });
    }

    const user = await DB.verifyCredentials(email, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = DB.createSession(user.id);
    const safeUser = DB.sanitizeUser(user);

    res.json({ success: true, user: safeUser, token });
  } catch (err) {
    res.status(500).json({ error: "Authentication failed. " + err.message });
  }
});

// Verify email address (Pass-through: verification no longer required)
app.post("/api/auth/verify-email", (req, res) => {
  res.json({
    success: true,
    message: "Email verification is not required. Your account has full access.",
    user: { isVerified: true },
  });
});

app.get("/api/auth/verify-email", (req, res) => {
  const appUrl = (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");
  res.redirect(`${appUrl}/`);
});

app.post("/api/auth/resend-verification", (req, res) => {
  res.json({
    success: true,
    message: "Email verification is not required. Your account is already verified.",
  });
});

// Current user profile
app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    DB.deleteSession(token);
  }
  res.json({ success: true, message: "Logged out successfully" });
});

// ================= CITATION VERIFICATION (GEMINI API) =================

// In-flight verification tracking to prevent duplicate concurrent API executions
const inFlightVerifications = new Map();

// Perform live Gemini AI verification (Protected: authenticated + verified user)
app.post("/api/verify", requireAuth, requireVerified, async (req, res) => {
  try {
    const { claim, citation, sourcePassage } = req.body;

    if (!claim || claim.trim().length < 5) {
      return res.status(400).json({
        error: "Please provide a valid academic claim of at least 5 characters."
      });
    }

    if (!sourcePassage || sourcePassage.trim().length < 15) {
      return res.status(400).json({
        error: "Please provide a substantial source passage excerpt of at least 15 characters."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
      return res.status(503).json({
        error: "Google Gemini API Key is not configured on the server. Please add your GEMINI_API_KEY to server/.env to enable live citation checking.",
        missingKey: true
      });
    }

    // Deduplication key per user + claim + sourcePassage
    const dedupeKey = `${req.user.id}:${claim.trim().toLowerCase()}:${sourcePassage.trim().toLowerCase()}`;

    let verificationPromise = inFlightVerifications.get(dedupeKey);
    if (!verificationPromise) {
      verificationPromise = (async () => {
        const report = await verifyCitation({
          claim,
          citation,
          sourcePassage,
          apiKey,
          modelName: GEMINI_MODEL
        });

        // Automatically save exactly one actual verification report linked to the logged in user
        const savedReport = DB.saveReport({
          userId: req.user.id,
          input: { claim, citation, sourcePassage },
          report
        });

        return {
          success: true,
          report,
          savedReport
        };
      })();

      inFlightVerifications.set(dedupeKey, verificationPromise);
    }

    try {
      const result = await verificationPromise;
      res.json(result);
    } finally {
      inFlightVerifications.delete(dedupeKey);
    }
  } catch (err) {
    console.error("[CiteCheck AI] Verification error:", err);
    res.status(500).json({
      error: err.message || "Failed to verify citation with Gemini API.",
      details: err.code || null
    });
  }
});

// ================= PERSONAL REPORT MANAGEMENT =================

// Get logged-in user's personal reports (Protected: authenticated + verified user)
app.get("/api/reports", requireAuth, requireVerified, (req, res) => {
  const reports = DB.getReportsByUser(req.user.id);
  res.json({ success: true, reports });
});

// Save an existing report (Protected: authenticated + verified user)
app.post("/api/reports", requireAuth, requireVerified, (req, res) => {
  try {
    const { title, input, report } = req.body;

    if (!report || !input || !input.claim) {
      return res.status(400).json({ error: "Invalid report data: claim input and report result are required." });
    }

    const saved = DB.saveReport({
      userId: req.user.id,
      title,
      input,
      report
    });

    res.json({ success: true, report: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a report owned by the user (Protected: authenticated + verified user)
app.delete("/api/reports/:id", requireAuth, requireVerified, (req, res) => {
  try {
    const reportId = req.params.id;
    const deleted = DB.deleteReport(reportId, req.user.id);

    if (!deleted) {
      return res.status(404).json({ error: "Report not found or you do not have permission to delete it." });
    }

    res.json({ success: true, message: "Report deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all route to serve SPA for client-side routing if dist exists
app.get("*", (req, res) => {
  const indexPath = path.resolve(clientDistPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send("CiteCheck AI API Server running. Client frontend not built yet.");
    }
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`  CiteCheck AI Server Running`);
  console.log(`  Port: http://localhost:${PORT}`);
  console.log(`  Model: ${GEMINI_MODEL}`);
  console.log(`  Gemini Key: ${process.env.GEMINI_API_KEY ? "CONFIGURED" : "MISSING (Set in server/.env)"}`);
  console.log(`=================================================\n`);
});
