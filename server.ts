import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getAIClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in your Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. AI Prioritization Endpoint
app.post("/api/prioritize-tasks", async (req, res) => {
  try {
    const { tasks } = req.body;
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: "Invalid tasks payload. Expected a non-empty array of tasks." });
    }

    const ai = getAIClient();

    const prompt = `You are the "Last-Minute Life Saver" AI productivity companion. 
Your goal is to reduce deadline anxiety and build momentum.
Take this list of tasks and prioritize them. For each task, assess the urgency, estimated duration, difficulty, and deadline. 
Reorganize them into a logical, high-momentum execution order (e.g., matching a "quick wins first" or "critical tasks first" philosophy depending on deadlines).

For each task, provide:
1. An updated priority classification ('urgent', 'high', 'medium', 'low').
2. An assigned 'momentum_category' ('Critical: Do Now', 'Important: Next', 'Malleable: Squeeze In').
3. A predicted 'stress_score' (1 to 10 scale of how stressful this task is right now given the deadline).
4. A warm, friendly 'ai_tip' (max 2 sentences) written in a supportive, encouraging, near-friend tone on how to complete it without stress.

Here are the tasks:
${JSON.stringify(tasks, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an encouraging, friendly, stress-busting productivity assistant. You write with deep empathy, clear steps, and positive vibes. You NEVER sound corporate, mechanical, or clinical.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["prioritizedTasks", "coachingQuote"],
          properties: {
            coachingQuote: {
              type: Type.STRING,
              description: "A customized, short, energetic, comforting message to the user about their tasks today (max 2 sentences)."
            },
            prioritizedTasks: {
              type: Type.ARRAY,
              description: "The list of tasks reorganized in suggested execution order, with AI enrichments.",
              items: {
                type: Type.OBJECT,
                required: ["id", "title", "aiPriority", "momentumCategory", "stressScore", "aiTip"],
                properties: {
                  id: { type: Type.STRING, description: "The original task ID" },
                  title: { type: Type.STRING, description: "The task title" },
                  aiPriority: { type: Type.STRING, description: "Urgency-based priority: 'urgent', 'high', 'medium', 'low'" },
                  momentumCategory: { type: Type.STRING, description: "Action zone: 'Critical: Do Now', 'Important: Next', 'Malleable: Squeeze In'" },
                  stressScore: { type: Type.INTEGER, description: "Anxiety rating from 1 (peaceful) to 10 (very tense)" },
                  aiTip: { type: Type.STRING, description: "Warm, highly actionable stress-busting tip for this specific task." }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from Gemini.");
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    console.error("AI Prioritization Error:", error);
    res.status(500).json({ error: error.message || "Failed to prioritize tasks with AI." });
  }
});

// 3. AI Plan Generator Endpoint
app.post("/api/generate-daily-plan", async (req, res) => {
  try {
    const { tasks, habits, currentTimeStr } = req.body;
    
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "Invalid tasks payload. Expected an array." });
    }

    const ai = getAIClient();

    const prompt = `You are the 'Last-Minute Life Saver' productivity partner.
Generate a friendly, realistic, stress-free hour-by-hour timeline for today starting around ${currentTimeStr || "9:00 AM"}.
Integrate the user's pending tasks and active habits with smart, satisfying slots for breaks, momentum-boosts, or buffer periods.
Rule: Do not schedule tasks back-to-back without breaks. If a task takes > 60 mins, split it or add a "brain recharge" break.

Pending Tasks:
${JSON.stringify(tasks.filter(t => t.status !== 'completed'), null, 2)}

Active Habits:
${JSON.stringify(habits, null, 2)}

Please return a detailed JSON object with:
1. 'mantra': A warm, custom-tailored daily motto focused on progress over perfection (max 15 words).
2. 'recommendations': A list of 3-4 highly personalized, actionable suggestions to relieve stress, conquer the current deadlines, and make micro-progress.
3. 'tasks': An array containing all pending tasks. For every task, analyze its urgency, duration, difficulty, and deadline to assign:
   - 'task_id': The original task UUID (matching the ID in the task list).
   - 'priority_rank': An integer rank (1 for the absolute most critical/urgent task, then 2, 3, etc.).
   - 'suggested_start_time': The recommended start time of the task (e.g., '09:00 AM').
   - 'suggested_end_time': The recommended end time of the task (e.g., '10:00 AM').
   - 'risk_level': 'low', 'medium', or 'high' based on how close the deadline is relative to current time and task duration.
   - 'one_sentence_tip': A warm, encouraging, specific one-sentence tip for this task to ease stress and ensure completion.
4. 'timeline': An array of time slots representing today's plan. Each slot should have:
   - 'startTime': e.g., '09:00 AM'
   - 'endTime': e.g., '09:45 AM'
   - 'label': The name of the event (e.g., "Attack: [Task Name]", "Momentum Recharge", "Complete Habit: [Habit Name]", "Buffer Zone")
   - 'type': Must be one of 'task', 'break', 'habit', 'buffer'
   - 'relatedTaskId': The original task UUID if the event is a task, or empty.
   - 'advice': A short, playful tip for this slot.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an encouraging coach. You excel at planning realistic, human-scaled days that prevent burnout and eliminate deadline panic. You speak directly, warmly, and use light humor.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["mantra", "recommendations", "tasks", "timeline"],
          properties: {
            mantra: { type: Type.STRING, description: "A highly comforting, progress-focused daily theme phrase." },
            recommendations: {
              type: Type.ARRAY,
              description: "A list of 3-4 highly personalized, actionable suggestions to relieve stress and tackle deadlines today.",
              items: { type: Type.STRING }
            },
            tasks: {
              type: Type.ARRAY,
              description: "The list of pending tasks enriched with priority rank, risk level, start/end suggestions, and custom advice tips.",
              items: {
                type: Type.OBJECT,
                required: ["task_id", "priority_rank", "suggested_start_time", "suggested_end_time", "risk_level", "one_sentence_tip"],
                properties: {
                  task_id: { type: Type.STRING, description: "The original task UUID" },
                  priority_rank: { type: Type.INTEGER, description: "Priority rank number starting from 1" },
                  suggested_start_time: { type: Type.STRING, description: "Recommended start time (e.g. 10:00 AM)" },
                  suggested_end_time: { type: Type.STRING, description: "Recommended end time (e.g. 11:00 AM)" },
                  risk_level: { type: Type.STRING, description: "Risk level of missing the deadline: must be 'low', 'medium', or 'high'" },
                  one_sentence_tip: { type: Type.STRING, description: "A comforting and specific one-sentence tip for this task." }
                }
              }
            },
            timeline: {
              type: Type.ARRAY,
              description: "Structured event slots spanning the day",
              items: {
                type: Type.OBJECT,
                required: ["startTime", "endTime", "label", "type", "advice"],
                properties: {
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  label: { type: Type.STRING },
                  type: { type: Type.STRING, description: "Type: 'task', 'break', 'habit', 'buffer'" },
                  relatedTaskId: { type: Type.STRING },
                  advice: { type: Type.STRING, description: "Comforting micro-advice for this specific block." }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from Gemini.");
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    console.error("AI Plan Generator Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate daily plan with AI." });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
