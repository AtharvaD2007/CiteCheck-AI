# CiteCheck AI — Academic Citation Verification System

> **Intelligent, AI-powered fact-checking for researchers, peer-reviewers, and students.**  
> CiteCheck AI compares academic claims directly against cited source passages to ensure fidelity to primary literature and preserve scholarly integrity.

---

## 📖 Overview

Academic citations are frequently vulnerable to unintentional misattribution, overgeneralization, and causal distortion (e.g., claiming a rodent study established a universal cure in humans, or citing a methodological paper for an empirical finding).

**CiteCheck AI** leverages Google's Gemini models via a dedicated Node.js/Express backend to rigorously audit academic claims against the original passage excerpt.

### Key Capabilities
- **4 Distinct Academic Verdicts:**
  - 🟢 **Supported:** The source passage directly and unambiguously validates the claim.
  - 🟡 **Partially Supported:** The claim has some empirical grounding, but overstates findings, exaggerates effect sizes, or leaps from correlation to causation.
  - 🔴 **Not Supported:** The source passage refutes, inverts, or contradicts the core conclusion.
  - ⚪ **Insufficient Evidence:** The passage lacks sufficient empirical data or relevance to assess the claim.
- **Evidence Quotations:** Extracts verbatim quotes from the source text and classifies them as supporting, contradictory, or contextual.
- **Nuanced Comparative Analysis:** Evaluates scope boundaries, sample cohorts, and methodological constraints.
- **Academic Integrity Checklist:** Audits causality representation, subject/population scope, effect magnitude, and caveat preservation.
- **Actionable Rephrasing:** Generates an academically sound, publication-ready revision of the claim that accurately reflects the source passage.
- **Exporting Options:** Copy the full Markdown report to clipboard or download it as a `.md` / `.txt` report.
- **Curated Test Scenarios:** 4 pre-loaded real-world academic scenarios representing each verification outcome.
- **Scholarly Integrity Notice:** Explicitly distinguishes automated heuristic evaluations from peer review and primary reading.

---

## 🛠️ Architecture & Tech Stack

```
AI_MiniProject/
├── client/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Header, status pill, setup triggers
│   │   │   ├── SamplePicker.jsx        # 4 interactive sample scenario cards
│   │   │   ├── VerificationForm.jsx    # Inputs with validation, counters & steps
│   │   │   ├── ReportCard.jsx          # Color-coded verdicts, quotes, checklist
│   │   │   ├── ApiKeyModal.jsx         # Gemini API setup guide & diagnostics
│   │   │   ├── HistorySection.jsx      # Session-based verification history
│   │   │   └── AcademicDisclaimer.jsx  # Scholarly integrity banner
│   │   ├── utils/
│   │   │   └── exportHelpers.js        # Markdown report formatter & file downloader
│   │   ├── App.jsx                     # Core application orchestrator
│   │   ├── main.jsx                    # React 18 DOM root
│   │   └── index.css                   # Navy-blue academic design system
│   ├── index.html                      # HTML5 entry with Google academic fonts
│   ├── vite.config.js                  # Vite server & API proxy (/api -> :5001)
│   └── package.json
├── server/                     # Backend (Node.js + Express)
│   ├── src/
│   │   ├── index.js                    # Express REST API & SPA static server
│   │   ├── verifier.js                 # Gemini SDK integration & JSON schema audit
│   │   └── sampleCases.js              # Curated academic benchmark cases
│   ├── test-api.js                     # Automated API endpoint test script
│   ├── .env.example                    # Environment variable template
│   ├── .env                            # Backend configuration (port & API key)
│   └── package.json
├── .gitignore
├── package.json                # Monorepo root scripts (concurrent dev)
└── README.md
```

- **Frontend:** React 18, Vite 6, Lucide React icons, Custom Academic Design System (Midnight Navy `#142B4A` + Teal `#087E8B`).
- **Backend:** Node.js, Express 4, `@google/generative-ai` SDK, CORS, dotenv, file-backed session DB.
- **AI Model:** Google Gemini (`gemini-3.8-flash` with fallback to `gemini-3.8-pro`, `gemini-3.5-flash`, `gemini-2.5-flash`).

### 🎨 Visual & Motion System (Matching Academic Dashboard UI)
- **Primary Headings & Navigation:** `#142B4A` (Midnight Navy) with active teal indicators
- **Primary Buttons & Interactive Elements:** `#087E8B` (Deep Academic Teal) with hover lifts & active press feedback
- **Page Background:** `#F5F7FA` with a soft light-blue gradient curve (`#EDF4F9`)
- **Cards & Surfaces:** `#FFFFFF` with subtle `#DCE3EB` borders and soft drop shadows
- **Horizontal 3-Column Input Card:** Academic Claim, Citation / Reference, Source Passage across 3 columns with "+ Try Sample" and "Verify Citation ->"
- **Verification Report Card:** Navy banner header with quick "Copy Report" & "Download PDF" buttons, large verdict status card, source evidence quote block, detailed explanation, and suggestions banner
- **CSS Motion & Animations:**
  - `HeroIllustration`: Gentle floating books (`floatBooks`), tilting magnifying glass (`floatLens`), document page hovering (`floatDoc`), twinkling stars (`starTwinkle`), and ambient glow pulsing (`ambientPulse`)
  - `ReportCard`: Pop-in spring bounce (`anim-pop`), entrance slide-up (`cardEntrance`)
  - Forms: Error shake animation (`anim-shake`), button hover elevation and spinner

### 🔐 Academic Authentication & Custom Reports
- **User Authentication:** Sign up, sign in, and 1-click test login as Dr. Elena Rostova (Researcher) or Alex Chen (Student).
- **Self-Authored & Imported Reports:** Author your own academic peer-review reports or paste/import existing Markdown reports into your personal library.
- **My Reports Library:** Filter by verdict (Supported, Partially Supported, Not Supported, Insufficient Evidence), search by claim keyword, load into the viewer, and delete reports.

### 🎨 Visual & Design System
- **Primary Headings & Navigation:** `#142B4A` (Midnight Navy)
- **Primary Buttons & Interactive Elements:** `#087E8B` (Deep Academic Teal)
- **Page Background:** `#F5F7FA` (Neutral Soft Paper)
- **Cards & Surfaces:** `#FFFFFF` (Pure White)
- **Borders & Dividers:** `#DCE3EB` (Subtle Crisp Gray)
- **Typography:** Dark readable text (`#1B2533` body, `#142B4A` headings, Newsreader serif + Inter sans)
- **Verification Badges:**
  - 🟢 **Supported:** Soft green `#EBF9F1` background, `#A3E6BA` border, `#0D6832` text
  - 🟡 **Partially Supported:** Soft amber `#FEF7EA` background, `#FCD38D` border, `#8C5503` text
  - 🔴 **Not Supported:** Soft red `#FDF1F1` background, `#F9ABAB` border, `#991B1B` text
  - ⚪ **Insufficient Evidence:** Soft slate gray `#F1F5F9` background, `#CBD5E1` border, `#334155` text

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18 or higher (v20+ recommended)
- **npm** v9 or higher
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. Installation
Clone or navigate to the repository folder, then install all dependencies:

```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

Or install them individually:
```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 3. Configure Gemini API Key
Create or edit `server/.env`:

```bash
cp server/.env.example server/.env
```

Open `server/.env` and paste your Google Gemini API key:
```env
PORT=5001
GEMINI_API_KEY=AIzaSy...your_actual_key_here...
GEMINI_MODEL=gemini-2.5-flash
```

> 🔒 **Security Notice:** The Gemini API key is strictly stored on the backend server and is **never** exposed to the frontend client.

### 4. Run the Application

#### Development Mode (Concurrent Server + Vite Client)
```bash
npm run dev
```
- Frontend starts at: `http://localhost:5173`
- Backend API starts at: `http://localhost:5001`
- Requests to `/api/*` are automatically proxied from Vite to Express.

#### Production Build & Run
```bash
# Build the React frontend
npm run build

# Start the Node.js production server
npm start
```
- Open `http://localhost:5001` to use the unified app.

---

## 🧪 Sample Test Cases

CiteCheck AI includes four pre-configured academic test scenarios accessible directly from the top bar:

| Scenario | Domain | Targeted Outcome | Description |
| :--- | :--- | :---: | :--- |
| **Case 1** | Computer Science / AI | 🟢 **Supported** | Vaswani et al. (2017) Transformer self-attention architecture claim directly corroborated by text. |
| **Case 2** | Medicine / Metabolism | 🟡 **Partially Supported** | Rodent fasting longevity findings overgeneralized into a universal human longevity and cure claim. |
| **Case 3** | Neuroscience / Sleep | 🔴 **Not Supported** | Claim inverts experimental conclusion (caffeine disrupted slow-wave sleep and delayed REM, rather than enhancing it). |
| **Case 4** | Ecotoxicology / Marine | ⚪ **Insufficient Evidence** | Passage describes spectroscopic water-sampling methodology, containing no data regarding fish endocrine health. |

---

## 📡 API Endpoints

### `GET /api/health`
Returns backend status and whether a Gemini API key is configured.
```json
{
  "status": "ok",
  "service": "CiteCheck AI API",
  "version": "1.0.0",
  "hasApiKey": true,
  "model": "gemini-2.5-flash",
  "timestamp": "2026-10-29T10:30:00.000Z"
}
```

### `GET /api/samples`
Returns the 4 curated academic benchmark test cases.

### `POST /api/verify`
Evaluates an academic claim against source text.
- **Request Body:**
  ```json
  {
    "claim": "Academic statement or assertion",
    "citation": "Author, Year, Title, Journal (optional)",
    "sourcePassage": "Verbatim excerpt from cited publication"
  }
  ```
- **Response Structure:**
  ```json
  {
    "success": true,
    "report": {
      "result": "Supported" | "Partially Supported" | "Not Supported" | "Insufficient Evidence",
      "confidenceScore": 95,
      "confidenceLevel": "High",
      "verdictSummary": "Concise executive assessment",
      "evidenceQuotes": [
        {
          "quote": "Exact sentence from source text",
          "relevance": "Explanation of significance",
          "alignment": "supports" | "contradicts" | "context"
        }
      ],
      "detailedExplanation": "Deep comparative linguistic and empirical audit...",
      "discrepancies": ["Specific overstatements or omissions"],
      "suggestedRevision": "Faithful, publication-ready revision of the claim",
      "suggestions": ["Scholarly advice for citation accuracy"],
      "academicChecklist": {
        "causalityAccurate": true,
        "scopeAccurate": true,
        "magnitudeAccurate": true,
        "caveatsPreserved": true
      },
      "verifiedAt": "2026-10-29T10:30:00.000Z",
      "modelUsed": "gemini-2.5-flash"
    }
  }
  ```

---

## ⚖️ Scholarly Disclaimer

CiteCheck AI provides comparative natural language analysis powered by Google Gemini models. While designed with rigorous academic validation rubrics, automated assessments are assistive tools and **must not replace independent scholarly review** or comprehensive reading of peer-reviewed primary literature.
