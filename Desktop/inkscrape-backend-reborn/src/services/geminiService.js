const REQUIRED_PROMPT_CLAUSE =
  "Generate an agreement that strictly respects the artist's permissions and restrictions, aligns with the company's declared AI use case, grants no additional rights, and uses neutral legal language for informational compliance purposes.";

function buildFallbackAgreement(context) {
  const declared = context.companyDeclaredUseCases.length > 0 ? context.companyDeclaredUseCases.join(", ") : "none provided";
  const allowed = context.allowedUseCases.length > 0 ? context.allowedUseCases.join(", ") : "all uses";

  return [
    "Informational Agreement Summary",
    `Security tag: ${context.securityTag}`,
    `Company: ${context.companyName}`,
    `Declared use cases: ${declared}`,
    `Artist AI training permission: ${context.aiTrainingAllowed}`,
    `Allowed use cases: ${allowed}`,
    `Attribution required: ${context.attributionRequired ? "yes" : "no"}`,
    "This summary does not grant additional rights beyond the artist permission settings."
  ].join("\n");
}

function extractGeminiText(payload) {
  if (!payload || !Array.isArray(payload.candidates)) {
    return "";
  }

  for (const candidate of payload.candidates) {
    if (!candidate || !candidate.content || !Array.isArray(candidate.content.parts)) {
      continue;
    }

    const parts = candidate.content.parts.map((part) => part && part.text).filter(Boolean);
    if (parts.length > 0) {
      return parts.join("\n").trim();
    }
  }

  return "";
}

async function generateConditionalAgreement(context) {
  const fallbackText = buildFallbackAgreement(context);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      agreementText: fallbackText,
      provider: "fallback",
      model: "local-template"
    };
  }

  const prompt = [
    REQUIRED_PROMPT_CLAUSE,
    "",
    `Security tag: ${context.securityTag}`,
    `Company name: ${context.companyName}`,
    `Company declared use cases: ${context.companyDeclaredUseCases.join(", ") || "none provided"}`,
    `Artist AI training permission: ${context.aiTrainingAllowed}`,
    `Artist allowed use cases: ${context.allowedUseCases.join(", ") || "all uses"}`,
    `Attribution required: ${context.attributionRequired ? "yes" : "no"}`,
    `Notes: ${context.notes || "none"}`
  ].join("\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const payload = await response.json();
    const generatedText = extractGeminiText(payload);

    if (!generatedText) {
      throw new Error("Gemini response did not include text.");
    }

    return {
      agreementText: generatedText,
      provider: "gemini",
      model: "gemini-1.5-flash"
    };
  } catch (_error) {
    return {
      agreementText: fallbackText,
      provider: "fallback",
      model: "local-template"
    };
  }
}

module.exports = {
  generateConditionalAgreement
};
