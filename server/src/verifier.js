import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_INSTRUCTION = `You are CiteCheck AI, an expert academic fact-checking and citation verification system designed to assist researchers, peer-reviewers, and university students.

Your task is to critically analyze an academic claim against an excerpted source passage from a cited paper or reference.

You must categorize the verification into EXACTLY ONE of these four statuses:
1. "Supported": The source passage directly, unambiguously, and fully supports the substantive assertions made in the claim, without exaggeration or distorting findings.
2. "Partially Supported": The claim contains elements grounded in the passage, but exaggerates findings, generalizes rodent/in-vitro results to humans, converts correlation into causation, omits critical conditions/caveats, or misrepresents statistical significance.
3. "Not Supported": The source passage explicitly contradicts, refutes, or inverts the claim's core conclusion, or reaches the opposite finding.
4. "Insufficient Evidence": The source passage does not contain enough relevant data, methods, or empirical findings to evaluate the claim (e.g., passage only describes background/apparatus, or discusses an unrelated metric).

CRITICAL RULES:
- Ground your analysis strictly on the provided text. Do not invent facts or cite external knowledge not in the passage.
- Extract verbatim, exact quotations from the source passage whenever available.
- Provide a clear, honest academic verdict summary.
- List specific discrepancies or caveats that the student missed.
- Draft an improved, academically faithful revision of the claim that accurately reflects the source passage without overclaiming.
- Return ONLY valid JSON matching the specified format.`;

function parseJSONSafely(text) {
  let clean = (text || "").trim();
  if (clean.startsWith("```json")) {
    clean = clean.replace(/^```json\s*/, "").replace(/```$/, "").trim();
  } else if (clean.startsWith("```")) {
    clean = clean.replace(/^```\s*/, "").replace(/```$/, "").trim();
  }
  return JSON.parse(clean);
}

export async function verifyCitation({ claim, citation, sourcePassage, apiKey, modelName = "gemini-3.5-flash" }) {
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    const error = new Error("GEMINI_API_KEY is not configured on the server. Please add your key to server/.env.");
    error.code = "MISSING_API_KEY";
    throw error;
  }

  const prompt = `Please verify the following academic claim against the provided source passage.

=== ACADEMIC CLAIM ===
${claim.trim()}

=== CITATION DETAILS ===
${citation && citation.trim() ? citation.trim() : "Not provided"}

=== ORIGINAL SOURCE PASSAGE ===
${sourcePassage.trim()}

Analyze whether the claim is Supported, Partially Supported, Not Supported, or Insufficient Evidence.

Respond strictly in JSON with this structure:
{
  "result": "Supported" | "Partially Supported" | "Not Supported" | "Insufficient Evidence",
  "confidenceScore": <integer between 60 and 99>,
  "confidenceLevel": "High" | "Moderate" | "Low",
  "verdictSummary": "<concise 1-2 sentence executive verdict>",
  "evidenceQuotes": [
    {
      "quote": "<exact verbatim quote from source passage>",
      "relevance": "<brief note on why this quote matters>",
      "alignment": "supports" | "contradicts" | "context"
    }
  ],
  "detailedExplanation": "<detailed analytical breakdown comparing claim vs source passage nuances, scope, methodologies, and limitations>",
  "discrepancies": [
    "<specific discrepancy or overstatement (or state 'None identified - claim accurately mirrors the text' if fully supported)>"
  ],
  "suggestedRevision": "<an academically sound, faithful rephrasing of the claim that accurately captures what the source passage actually proves>",
  "suggestions": [
    "<actionable suggestion 1 for the researcher>",
    "<actionable suggestion 2 for citation and academic integrity>"
  ],
  "academicChecklist": {
    "causalityAccurate": <true|false>,
    "scopeAccurate": <true|false>,
    "magnitudeAccurate": <true|false>,
    "caveatsPreserved": <true|false>
  }
}`;

  const genAI = new GoogleGenerativeAI(apiKey);

  const candidateModels = [
    modelName,
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash"
  ].filter((val, idx, arr) => Boolean(val) && arr.indexOf(val) === idx);

  let lastError = null;

  for (const m of candidateModels) {
    try {
      console.log(`[CiteCheck AI] Attempting fast verification with model: ${m}...`);
      const model = genAI.getGenerativeModel({
        model: m,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      // 15-second timeout safeguard to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        const timer = setTimeout(() => {
          const timeoutErr = new Error(`Request to ${m} timed out after 15 seconds.`);
          timeoutErr.code = "TIMEOUT";
          reject(timeoutErr);
        }, 15000);
        // Clean up timer if generateContent finishes first
        if (typeof timer.unref === "function") timer.unref();
      });

      const response = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise
      ]);

      const text = response.response.text();
      const parsed = parseJSONSafely(text);

      // Sanitize and ensure result conforms to 1 of 4 statuses
      const validStatuses = ["Supported", "Partially Supported", "Not Supported", "Insufficient Evidence"];
      let result = parsed.result;
      if (!validStatuses.includes(result)) {
        const lower = String(result || "").toLowerCase();
        if (lower.includes("partially")) result = "Partially Supported";
        else if (lower.includes("not supported") || lower.includes("unsupported")) result = "Not Supported";
        else if (lower.includes("insufficient") || lower.includes("lack")) result = "Insufficient Evidence";
        else if (lower.includes("supported")) result = "Supported";
        else result = "Insufficient Evidence";
      }

      console.log(`[CiteCheck AI] Verification succeeded using model: ${m}`);
      return {
        ...parsed,
        result,
        verifiedAt: new Date().toISOString(),
        modelUsed: m,
      };
    } catch (err) {
      lastError = err;
      console.warn(`[CiteCheck AI] Model ${m} attempt: ${err.message}`);

      // If it's an authentication error, don't try other models
      if (err.message && (err.message.includes("API key not valid") || err.message.includes("API_KEY_INVALID"))) {
        const error = new Error("The configured Gemini API key is invalid or unauthorized.");
        error.code = "INVALID_API_KEY";
        throw error;
      }
    }
  }

  // If all candidate models failed
  throw lastError || new Error("Failed to verify citation with Gemini API.");
}
