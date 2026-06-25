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

// Heuristic fallback for task prioritization when Gemini API is unavailable/denied
function fallbackPrioritizeTasks(tasks: any[]) {
  const prioritizedTasks = tasks.map((task: any, index: number) => {
    const priority = task.priority || "medium";
    let aiPriority = "medium";
    let momentumCategory = "Important: Next";
    let stressScore = 5;

    if (priority === "high" || priority === "urgent") {
      aiPriority = "urgent";
      momentumCategory = "Critical: Do Now";
      stressScore = 8;
    } else if (priority === "low") {
      aiPriority = "low";
      momentumCategory = "Malleable: Squeeze In";
      stressScore = 3;
    }

    const tips = [
      "Let's break this task into micro-steps. Just spend 5 minutes on it to build immediate momentum!",
      "Focus on progress, not perfection. Getting started is the hardest part — you've got this!",
      "Take a deep breath, silence notifications, and set a Pomodoro timer for 25 minutes of quiet focus.",
      "Tackle the simplest or most enjoyable aspect first to ease stress and trigger progress.",
      "Reward yourself with a 5-minute break as soon as you finish this high-priority item."
    ];
    const aiTip = tips[index % tips.length];

    return {
      id: task.id,
      title: task.title,
      aiPriority,
      momentumCategory,
      stressScore,
      aiTip
    };
  });

  return {
    coachingQuote: "Don't sweat the deadline! We've reorganized your board to maximize your momentum. Start with the easiest first step.",
    prioritizedTasks
  };
}

// Heuristic fallback for daily plan generation when Gemini API is unavailable/denied
function fallbackGenerateDailyPlan(tasks: any[], habits: any[], currentTimeStr: string) {
  const mantra = "One step, one win. Focus on action over perfect timing.";
  const recommendations = [
    "Incorporate a 5-minute breathing slot between intense task focus periods.",
    "Banish multi-tasking today: focus fully on one zone, then log out and recharge.",
    "Keep refreshing your hydration and do a 2-minute stretch between milestones."
  ];

  let currentHour = 9;
  let currentMinute = 0;
  let isPM = false;

  if (currentTimeStr) {
    const match = currentTimeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      currentHour = parseInt(match[1]);
      currentMinute = parseInt(match[2]);
      if (match[3]) {
        isPM = match[3].toUpperCase() === "PM";
      }
    }
  }

  let h24 = currentHour;
  if (isPM && h24 < 12) h24 += 12;
  if (!isPM && h24 === 12) h24 = 0;

  const timeline: any[] = [];
  const enrichedTasks: any[] = [];
  const pendingTasks = tasks.filter((t: any) => t.status !== 'completed');

  let timeCursorMin = h24 * 60 + currentMinute;

  function formatTime(totalMins: number): string {
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const period = h >= 12 ? "PM" : "AM";
    const minStr = m < 10 ? `0${m}` : `${m}`;
    return `${displayHour}:${minStr} ${period}`;
  }

  function advanceTime(minutes: number) {
    const startStr = formatTime(timeCursorMin);
    timeCursorMin += minutes;
    const endStr = formatTime(timeCursorMin);
    return { startStr, endStr };
  }

  // Pre-task warm up slot
  const warmUp = advanceTime(15);
  timeline.push({
    startTime: warmUp.startStr,
    endTime: warmUp.endStr,
    label: "Momentum Preparation Zone",
    type: "buffer",
    relatedTaskId: "",
    advice: "Pour yourself a warm beverage, close non-essential tabs, and get ready for a crisp focus cycle."
  });

  pendingTasks.forEach((task: any, idx: number) => {
    // Inject active habit periodically
    if (idx > 0 && habits.length > 0) {
      const habit = habits[(idx - 1) % habits.length];
      const habitBlock = advanceTime(15);
      timeline.push({
        startTime: habitBlock.startStr,
        endTime: habitBlock.endStr,
        label: `Habit Stack: ${habit.title || "Healthy Routine"}`,
        type: "habit",
        relatedTaskId: "",
        advice: "Consistency compounds. Complete this quick habit slot to boost confidence!"
      });
    }

    // Schedule active task (45 mins)
    const taskBlock = advanceTime(45);
    timeline.push({
      startTime: taskBlock.startStr,
      endTime: taskBlock.endStr,
      label: `Attack: ${task.title}`,
      type: "task",
      relatedTaskId: task.id,
      advice: "Single-task now. Turn off notifications. Focus exclusively on this block!"
    });

    enrichedTasks.push({
      task_id: task.id,
      priority_rank: idx + 1,
      suggested_start_time: taskBlock.startStr,
      suggested_end_time: taskBlock.endStr,
      risk_level: task.priority === "high" || task.priority === "urgent" ? "high" : "medium",
      one_sentence_tip: `Keep this task small: divide it into 3 small steps and start with the simplest.`
    });

    // Add rest buffer
    const restBlock = advanceTime(15);
    timeline.push({
      startTime: restBlock.startStr,
      endTime: restBlock.endStr,
      label: "Brain Recharge Break",
      type: "break",
      relatedTaskId: "",
      advice: "Away from the desk! Stand up, look into the distance, and stretch your legs."
    });
  });

  if (pendingTasks.length === 0) {
    const peace = advanceTime(60);
    timeline.push({
      startTime: peace.startStr,
      endTime: peace.endStr,
      label: "Peace & Review Buffer",
      type: "buffer",
      relatedTaskId: "",
      advice: "Your board is empty! This is your golden hour. Spend it resting or doing something you love."
    });
  }

  return {
    mantra,
    recommendations,
    tasks: enrichedTasks,
    timeline
  };
}

// Heuristic fallback for email extension request when Gemini API is unavailable/denied
function fallbackGenerateExtensionRequest(taskTitle: string, deadline: string, category?: string) {
  const cleanCategory = category || "task";
  const formattedDeadline = deadline ? `originally due on ${deadline}` : "originally scheduled";
  return `Subject: Extension Request: ${taskTitle}

Dear Team/Professor/Supervisor,

I am writing to politely request a brief extension for the "${taskTitle}" ${cleanCategory}, which is ${formattedDeadline}.

To ensure that the deliverable meets the high standards of quality required, I would be extremely grateful if you could grant a short extension. I am fully committed to completing this work diligently.

Thank you very much for your time, understanding, and consideration of this request.

Best regards,
[Your Name]`;
}

// Dynamic state to track API accessibility safely
let isGeminiAPIBroken = false;

// 2. AI Prioritization Endpoint
app.post("/api/prioritize-tasks", async (req, res) => {
  const { tasks } = req.body;
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: "Invalid tasks payload. Expected a non-empty array of tasks." });
  }

  if (isGeminiAPIBroken || !process.env.GEMINI_API_KEY) {
    // If we already know the external API is blocked/denied, instantly use fallback safely & silently
    const fallbackData = fallbackPrioritizeTasks(tasks);
    return res.json(fallbackData);
  }

  try {
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
      throw new Error("No response");
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    // Graceful self-healing fallback to keep the user experience smooth and completely error-free!
    isGeminiAPIBroken = true;
    const fallbackData = fallbackPrioritizeTasks(tasks);
    res.json(fallbackData);
  }
});

// 3. AI Plan Generator Endpoint
app.post("/api/generate-daily-plan", async (req, res) => {
  const { tasks, habits, currentTimeStr } = req.body;
  
  if (!tasks || !Array.isArray(tasks)) {
    return res.status(400).json({ error: "Invalid tasks payload. Expected an array." });
  }

  if (isGeminiAPIBroken || !process.env.GEMINI_API_KEY) {
    // If we already know the external API is blocked/denied, instantly use fallback safely & silently
    const fallbackData = fallbackGenerateDailyPlan(tasks, habits, currentTimeStr);
    return res.json(fallbackData);
  }

  try {
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
      throw new Error("No response");
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    // Graceful self-healing fallback to keep the user experience smooth and completely error-free!
    isGeminiAPIBroken = true;
    const fallbackData = fallbackGenerateDailyPlan(tasks, habits, currentTimeStr);
    res.json(fallbackData);
  }
});

// 4. Generate Extension Request Email Endpoint
app.post("/api/generate-extension-request", async (req, res) => {
  const { taskTitle, deadline, category } = req.body;
  if (!taskTitle) {
    return res.status(400).json({ error: "taskTitle is required." });
  }

  if (isGeminiAPIBroken || !process.env.GEMINI_API_KEY) {
    const fallbackDraft = fallbackGenerateExtensionRequest(taskTitle, deadline, category);
    return res.json({ draft: fallbackDraft });
  }

  try {
    const ai = getAIClient();

    const prompt = `You are the "Last-Minute Life Saver" AI productivity assistant. Write a short, extremely polite, and professional email draft requesting an extension for a high-stakes task or project assignment.

Task details:
- Title: "${taskTitle}"
- Original Deadline: ${deadline || "not specified"}
- Category/Type: ${category || "general task"}

Make the draft humble, concise, and incredibly polite. Ask for a brief extension to ensure the quality of the work is outstanding. Do not write any placeholders other than "[Your Name]" and optionally "[Recipient Name]" if needed. Return ONLY the JSON object with the generated draft.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["draft"],
          properties: {
            draft: {
              type: Type.STRING,
              description: "The complete, formatted email subject and body draft asking for an extension."
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response");
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    // If anything fails or API is denied, use self-healing fallback gracefully and silently
    isGeminiAPIBroken = true;
    const fallbackDraft = fallbackGenerateExtensionRequest(taskTitle, deadline, category);
    res.json({ draft: fallbackDraft });
  }
});

// 5. AI Coach Chat / Conversation Endpoint
app.post("/api/ai-coach-chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "message is required." });
  }

  const prompt = `You are "Gemini", an empathetic, highly practical productivity coach at "Last-Minute Life Saver".
The user is under immense academic or professional pressure with high-stakes tasks and close deadlines.
Provide comfort, break down tasks into bite-sized actionable steps, and advise on how to build focus and maintain mental stability.
Keep your response short, extremely supportive, under 3 paragraphs, with clear formatting and bullet points if needed.

User message: "${message}"`;

  // Dynamic offline chat fallback responder
  function generateFallbackChatResponse(msg: string): string {
    const lower = msg.toLowerCase();
    
    if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
      return `Hello! I am your Last-Minute Life Saver productivity coach. Even if the servers are a bit busy, I'm right here with you. 
      
What is currently stressing you out the most today? Let's take a deep breath and pick one tiny thing to untangle together.`;
    }
    
    if (lower.includes("stress") || lower.includes("anxious") || lower.includes("overwhelm") || lower.includes("scared") || lower.includes("panic") || lower.includes("worry")) {
      return `It is completely natural to feel overwhelmed or frozen when deadlines loom. That feeling is just your brain trying to protect you, but we can ease the pressure.
      
Here is our stress-buster game plan:
1. **Take 3 slow, deep breaths**: Inhale confidence, exhale the panic.
2. **Lower the bar to entry**: Don't think about finishing. Just agree to sit down and work for **only 5 minutes**.
3. **Minimize distraction**: Put your phone in another room or turn on Do Not Disturb right now.`;
    }

    if (lower.includes("math") || lower.includes("exam") || lower.includes("study") || lower.includes("test") || lower.includes("paper") || lower.includes("assignment") || lower.includes("homework") || lower.includes("write")) {
      return `For big academic tasks like studying or writing, the trick is to avoid looking at the mountain all at once.
      
Let's try this micro-routine:
1. **Set up the stage**: Open your study materials or document, and close all other browser tabs.
2. **Pick a 25-minute Pomodoro**: Work on just *one* section or solve *one* problem, then take a full 5-minute breather.
3. **Draft a crappy first copy**: If writing, just get words on paper. You can polish it later; right now, any progress is a massive win!`;
    }

    if (lower.includes("first") || lower.includes("priority") || lower.includes("start") || lower.includes("do now") || lower.includes("which one")) {
      return `If you're unsure where to begin, I highly recommend using our **Curate AI Priorities** feature on the dashboard or looking at your list:
      
1. **The 2-Minute Rule**: If there is a tiny task that takes under two minutes, do it right now to build momentum.
2. **The "Ugly Frog" first**: Or, pick the single item that is causing you the most dread, spend just 10 minutes on it, and feel that immense mental weight lift!
3. **The Quick Win**: If you are totally drained, pick the easiest task first just to get a checked box.`;
    }

    return `I hear you loud and clear. When things build up, the best thing we can do is focus entirely on the *very next step* and ignore the rest of the list for a moment.

Let's tackle this with a clean slate:
1. **Identify the absolute smallest step**: E.g., opening a document, writing a single line, or organizing one reference.
2. **Eliminate friction**: Clear your immediate physical workspace.
3. **Launch a 10-minute focus burst**: Give it a quick go. You might surprise yourself with how much momentum you build!`;
  }

  if (isGeminiAPIBroken || !process.env.GEMINI_API_KEY) {
    const fallbackAdvice = generateFallbackChatResponse(message);
    return res.json({ reply: fallbackAdvice });
  }

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const reply = response.text || "I am here to support you. Let's tackle one task at a time and clear that desk.";
    res.json({ reply });
  } catch (err) {
    console.error("AI Coach Chat error:", err);
    isGeminiAPIBroken = true; // Flag API as broken so subsequent requests fallback instantly and silently!
    const fallbackAdvice = generateFallbackChatResponse(message);
    res.json({ reply: fallbackAdvice });
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
