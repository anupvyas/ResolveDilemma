import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client to prevent crashing on startup if key is temporarily missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Schemas for the structured Gemini responses
const prosConsSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A highly concise and elegant title of the decision." },
    summary: { type: Type.STRING, description: "A brief, professional 1-2 sentence background of the dilemma." },
    pros: {
      type: Type.ARRAY,
      description: "List of positive aspects. Provide 4 to 6 strong entries.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique short id like 'pro_1', 'pro_2'." },
          text: { type: Type.STRING, description: "The core pro, phrased concisely (5-10 words)." },
          impact: { type: Type.INTEGER, description: "Initial score of positive significance on a scale from 1 (low) to 5 (critical)." },
          category: { type: Type.STRING, description: "Single-word category, e.g. Cost, Growth, Health, Joy." },
          details: { type: Type.STRING, description: "A brief sentence explaining the reasoning or context." }
        },
        required: ["id", "text", "impact", "category", "details"]
      }
    },
    cons: {
      type: Type.ARRAY,
      description: "List of negative aspects. Provide 4 to 6 strong entries.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique short id like 'con_1', 'con_2'." },
          text: { type: Type.STRING, description: "The core con, phrased concisely (5-10 words)." },
          impact: { type: Type.INTEGER, description: "Initial score of negative significance on a scale from 1 (low) to 5 (critical)." },
          category: { type: Type.STRING, description: "Single-word category, e.g. Cost, Risk, Stress, Effort." },
          details: { type: Type.STRING, description: "A brief sentence explaining the reasoning or context." }
        },
        required: ["id", "text", "impact", "category", "details"]
      }
    },
    recommendation: { type: Type.STRING, description: "A balanced, thoughtful, final piece of advice or 'tiebreaker' logic guiding the user on how to decide. Keep it to 2-3 sentences." }
  },
  required: ["title", "summary", "pros", "cons", "recommendation"]
};

const comparisonSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Concise title of this comparison study." },
    summary: { type: Type.STRING, description: "A brief professional background of the comparison dilemma." },
    options: {
      type: Type.ARRAY,
      description: "The list of exact option names being compared. Limit to 2 to 4 options based on the prompt.",
      items: { type: Type.STRING }
    },
    criteria: {
      type: Type.ARRAY,
      description: "A list of 4 to 6 relevant comparison dimensions.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique short id like 'crit_1', 'crit_2'." },
          name: { type: Type.STRING, description: "Name of the criterion (e.g., 'Initial Budget', 'Long-term Growth', 'Effort')." },
          description: { type: Type.STRING, description: "A short phrase explaining why this criterion matters." },
          ratings: {
            type: Type.ARRAY,
            description: "Ratings for each option for this criterion. Must have exactly one rating per option listed in the options array.",
            items: {
              type: Type.OBJECT,
              properties: {
                option: { type: Type.STRING, description: "Must match one of the option names in the options list exactly." },
                rating: { type: Type.INTEGER, description: "Rating score on a scale of 1 (poor) to 5 (excellent)." },
                comment: { type: Type.STRING, description: "Short 1-sentence comment explaining the rating." }
              },
              required: ["option", "rating", "comment"]
            }
          }
        },
        required: ["id", "name", "description", "ratings"]
      }
    },
    recommendation: { type: Type.STRING, description: "A clear, compelling conclusion recommending one option or explaining the trade-offs. 2-3 sentences." }
  },
  required: ["title", "summary", "options", "criteria", "recommendation"]
};

const swotSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Concise title of the SWOT analysis." },
    summary: { type: Type.STRING, description: "A brief professional background of the strategic situation." },
    strengths: {
      type: Type.ARRAY,
      description: "Internal positive capabilities (3 to 5 items).",
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "Name of the strength." },
          details: { type: Type.STRING, description: "Short explanation." }
        },
        required: ["text", "details"]
      }
    },
    weaknesses: {
      type: Type.ARRAY,
      description: "Internal negative limiters (3 to 5 items).",
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "Name of the weakness." },
          details: { type: Type.STRING, description: "Short explanation." }
        },
        required: ["text", "details"]
      }
    },
    opportunities: {
      type: Type.ARRAY,
      description: "External positive possibilities (3 to 5 items).",
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "Name of the opportunity." },
          details: { type: Type.STRING, description: "Short explanation." }
        },
        required: ["text", "details"]
      }
    },
    threats: {
      type: Type.ARRAY,
      description: "External negative risks (3 to 5 items).",
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "Name of the threat." },
          details: { type: Type.STRING, description: "Short explanation." }
        },
        required: ["text", "details"]
      }
    },
    recommendation: { type: Type.STRING, description: "Strategic tie-breaker recommendation using strengths to exploit opportunities and defending weaknesses. 2-3 sentences." }
  },
  required: ["title", "summary", "strengths", "weaknesses", "opportunities", "threats", "recommendation"]
};

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Main AI Decision analysis generation route
app.post("/api/decide", async (req, res) => {
  try {
    const { type, prompt, context } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      res.status(400).json({ error: "Please enter a valid decision question." });
      return;
    }

    if (!type || !["pros-cons", "comparison", "swot"].includes(type)) {
      res.status(400).json({ error: "Invalid or missing decision analysis type." });
      return;
    }

    const ai = getGeminiClient();

    let chosenSchema;
    let typeInstructions = "";

    if (type === "pros-cons") {
      chosenSchema = prosConsSchema;
      typeInstructions = `Perform a Pros and Cons analysis of this decision. Identify around 4 to 6 strong Pros and 4 to 6 strong Cons. Ensure to score the impact initially from 1 (minor significance) to 5 (critical factor). Deliver a clear final 'tiebreaker' recommendation.`;
    } else if (type === "comparison") {
      chosenSchema = comparisonSchema;
      typeInstructions = `Perform a multi-option comparison. Identify the list of 2 to 4 options to compare (from the prompt, e.g. moving to 'Paris' vs 'Berlin', or buying a 'Tesla' vs 'Honda'). Generate 4 to 6 criteria/dimensions (e.g. Cost, Career opportunity, Fun) and rate each option on each criterion from 1 (poor) to 5 (excellent) with an explanatory comment.`;
    } else {
      chosenSchema = swotSchema;
      typeInstructions = `Perform a SWOT (Strengths, Weaknesses, Opportunities, Threats) strategic analysis on this decision or situation. Strengths and Weaknesses are internal factors, whereas Opportunities and Threats are external environmental factors. Provide 3 to 5 realistic items in each of the four categories.`;
    }

    const systemInstruction = `You are "The Tiebreaker", a premium decision-making AI coach. Your goal is to guide the user through complex personal or professional decisions by structuring information logically, analyzing trade-offs, and suggesting weightings.
      Always respond strictly in JSON that matches the requested schema. Provide clear, balanced, and insightful points. Do not mention any JSON schemas or formatting markdown in your text, only return the clean JSON representation.`;

    const contents = `Decision Dilemma: "${prompt}"
    ${context ? `Additional Context: "${context}"` : ""}
    
    Analysis type requested: ${type}
    Instructions: ${typeInstructions}
    
    Please analyze and return the populated schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: chosenSchema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini AI.");
    }

    const parsedData = JSON.parse(text);
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Gemini decision error:", error);
    res.status(500).json({
      error: error.message || "An unexpected error occurred during AI analysis. Please verify your GEMINI_API_KEY."
    });
  }
});

// Vite/Static file handling
async function startApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Tiebreaker server running on http://localhost:${PORT}`);
  });
}

startApp().catch((err) => {
  console.error("Failed to start server:", err);
});
