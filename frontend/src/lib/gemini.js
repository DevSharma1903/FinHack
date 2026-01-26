// gemini.js - FINAL WORKING VERSION

// Rate limiting state
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 4000; // 4 seconds between requests

/**
 * Builds a detailed prompt for Gemini using user inputs + calculated outputs.
 */
export function buildSipRdFdExplanationPrompt({
  userInputs,
  calculationResults,
  recommendedOption,
}) {
  const safe = (v) => (v === undefined || v === null || v === "" ? "-" : v);

  return [
    "You are a helpful financial educator for Indian investors.",
    "Explain the SIP vs RD vs FD recommendation for THIS specific user.",
    "Write in simple, non-technical language, but be precise.",
    "Keep it concise (6-10 short bullets) plus a short summary paragraph.",
    "Do NOT claim guaranteed returns. Add a short risk/disclaimer line.",
    "",
    "## User profile (inputs)",
    `- Monthly income: ${safe(userInputs.monthlyIncome)}`,
    `- Monthly savings / investible amount: ${safe(userInputs.monthlyInvestmentAmount)}`,
    `- Suggested monthly split: SIP ${safe(userInputs.monthlyAllocationSip)} | RD ${safe(userInputs.monthlyAllocationRd)} | FD ${safe(userInputs.monthlyAllocationFd)}`,
    `- Duration / horizon (years): ${safe(userInputs.durationYears)}`,
    `- Saving capacity: ${safe(userInputs.savingCapacity)}`,
    `- Risk profile: ${safe(userInputs.riskProfile)}`,
    `- Financial goals: ${safe(userInputs.financialGoals)}`,
    "",
    "## Calculation results",
    `- SIP projected value: ${safe(calculationResults.sipValue)}`,
    `- RD projected value: ${safe(calculationResults.rdValue)}`,
    `- FD projected value: ${safe(calculationResults.fdValue)}`,
    `- Recommended option: ${safe(recommendedOption)}`,
    `- SIP percentage allocation: ${safe(calculationResults.sipPct)}%`,
    `- RD percentage allocation: ${safe(calculationResults.rdPct)}%`,
    `- FD percentage allocation: ${safe(calculationResults.fdPct)}%`,
    "",
    "## Instructions",
    "1) Explain why the percentage allocation split is best for this user.",
    "2) Explicitly reference their income, horizon, and risk profile.",
    "3) Explain the recommended option among the three also but in less detail.",
    "4) Mention key considerations/risks (volatility, liquidity, taxation, inflation).",
    "5) End with an actionable next step (what they should do now).",
    "6) Don't do any text formatting, like bold or italics.",
  ].join("\n");
}

/**
 * Call Gemini REST API with v1 endpoint
 * IMPORTANT: Must use full model name with "models/" prefix
 */
async function callGeminiAPI(apiKey, modelName, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Main function with rate limiting - uses direct REST API calls
 * Uses FULL model names as returned by ListModels API
 */
export async function generateSipRdFdExplanation({
  userInputs,
  calculationResults,
  recommendedOption,
}) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_api_key_here") {
    throw new Error(
      "Missing Gemini API key. Set VITE_GEMINI_API_KEY in frontend/.env"
    );
  }

  // Rate limiting check
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000);
    throw new Error(
      `Please wait ${waitTime} more second${waitTime > 1 ? 's' : ''} before generating again.`
    );
  }

  const prompt = buildSipRdFdExplanationPrompt({
    userInputs,
    calculationResults,
    recommendedOption,
  });

  try {
    lastRequestTime = Date.now();
    
    // Try models that work with v1 endpoint - USE FULL NAMES with "models/" prefix
    const modelsToTry = [
      "models/gemini-2.5-flash",
      "models/gemini-2.0-flash",
      "models/gemini-2.5-pro",
    ];
    
    let lastError;
    for (const model of modelsToTry) {
      try {
        console.log(`Trying model: ${model}`);
        const text = await callGeminiAPI(apiKey, model, prompt);
        console.log(`✓ Success with ${model}`);
        return text;
      } catch (err) {
        console.log(`✗ ${model} failed`);
        lastError = err;
        continue;
      }
    }
    
    throw lastError;
    
  } catch (error) {
    console.error("Gemini API error:", error);

    const errorMsg = error.message || "";
    
    if (errorMsg.includes("quota") || errorMsg.includes("429")) {
      throw new Error("API rate limit reached. Please wait a minute and try again.");
    } else if (errorMsg.includes("401") || errorMsg.includes("403")) {
      throw new Error("Invalid API key. Please check your configuration.");
    } else if (errorMsg.includes("wait")) {
      throw error;
    } else {
      throw new Error(`Failed to generate explanation: ${errorMsg}`);
    }
  }
}

/**
 * Check remaining cooldown time
 */
export function getRemainingCooldown() {
  const timeSinceLastRequest = Date.now() - lastRequestTime;
  const remaining = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
  
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / 1000);
}
