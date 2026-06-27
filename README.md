# Duewell (formerly Last-Minute Life Saver)

[![Hackathon](https://img.shields.io/badge/Hackathon-Vibe2Ship-blueviolet?style=flat-square)](https://codingninjas.com)
[![Organizer](https://img.shields.io/badge/Organizer-Coding%20Ninjas%20x%20Google%20for%20Developers-blue?style=flat-square)](https://google.com)
[![Stack](https://img.shields.io/badge/Stack-React%2019%20%2B%20Vite%20%2B%20Supabase%20%2B%20Gemini-green?style=flat-square)](./package.json)

**Last-Minute Life Saver** — an AI-powered productivity companion that turns a chaotic task list into a prioritized daily plan.

---

## 🎯 Problem Statement

Students, professionals, and entrepreneurs frequently miss critical deadlines, not from lack of desire, but from overwhelming deadline anxiety and planning paralysis. Existing productivity tools rely on passive, annoying reminders that increase stress rather than guiding users toward realistic action. They show you *what* is late, but fail to help you figure out *how* to take the first step. **Duewell** bridges this gap by acting as a proactive, empathetic partner that translates chaotic backlogs into hyper-focused, achievable day plans.

---

## ✨ Features Implemented

*   **Task Creation with Effort Estimates:** Add tasks with clear deadlines, difficulty assessment (`easy` | `medium` | `hard`), and precise estimated hours to gauge workload realistically.
*   **AI-Powered Daily Plan Generation:** Powered by the **Gemini 2.5 Flash SDK**, a single tap transforms disorganized, overwhelming todo lists into a realistic, hour-by-hour action timeline complete with scheduled breaks and momentum-boost intervals.
*   **Dynamic Status & Risk Tracking:** Automatically monitors and labels task states—such as *On Track*, *Tight*, or *Overdue Risk*—allowing users to recognize bottleneck threats instantly.
*   **The Momentum Ring:** An interactive progress visualization dashboard. Watch your momentum ring light up and fill with warm energetic colors as you complete tasks and solidify habits throughout the day.
*   **AICoach & Recommendations Panel:** Access an empathetic, real-time AI productivity chat coach that helps break down big milestones into bite-sized sub-tasks, offering customized strategies to conquer stress.
*   **Proactive Habit Tracking:** Seamlessly integrate, track, and stack critical wellness habits (e.g., hydration, posture checks, brief stretching, mindfulness breathing) side-by-side with high-stakes sprints.
*   **Hands-Free Voice Input:** Input tasks organically via integrated Speech-to-Text Recognition, making quick updates frictionless when you are on the move.
*   **Intuitive Calendar View:** Visualize your tasks, schedules, and active deadliness in a clean monthly/weekly grid for long-range planning.
*   **Autonomous Extension-Request Drafting ("Rescue Station"):** When a deadline is hopelessly out of reach, use the Rescue Station to instantly draft polite, professionally structured emails to request project extensions.
*   **Auth & Profile Management System:** A comprehensive onboarding flow and authenticated workspace powered directly by Supabase, persisting user profiles, individual metadata, and personalized daily schedules.

---

## 🛠️ Tech Stack

*   **Frontend Framework:** React 19 (TypeScript) + Vite
*   **Styling Engine:** Tailwind CSS v4 + Lucide Icons
*   **Animations:** Motion (formerly Framer Motion)
*   **Database & Authentication:** Supabase (`@supabase/supabase-js`)
*   **Artificial Intelligence Engine:** Google Gemini AI SDK (`@google/genai`)
*   **Server Runtime:** Express & Node.js (`server.ts` compiled to CommonJS via `esbuild`)

---

## 🏗️ Architecture & How It Works

```
[ User Action: Add Tasks / Habits ]
               │
               ▼
   [ Supabase DB / Local Cache ] 
               │
               ▼
[ User clicks: "Generate Today's Plan" ]
               │
               ▼
  [ Node.js/Express Server Router ] (Protects API Keys)
               │
               ▼
   [ Google Gemini 2.5 Flash API ] (Analyzes work-rest balance, difficulty & priority)
               │
               ▼
  [ Structured AI Schedule returned ] ──► [ Rendered into Interactive Visual UI ]
```

1.  **Input:** The user specifies tasks, habits, difficulties, and time limits.
2.  **State Management:** Data is kept securely in Supabase (with client-side local fallback state if offline).
3.  **Prompt Engineering:** The Express proxy server routes the schedule payload to Gemini alongside strict parameters encouraging healthy work-break intervals.
4.  **Generation:** Gemini returns a pristine JSON schedule, which is rendered as interactive, checkbox-driven timeline blocks on the dashboard.

---

## 🚀 Setup & Local Installation

### Prerequisites

*   **Node.js** (v18 or higher recommended)
*   **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/duewell.git
cd duewell
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory based on `.env.example`:

```env
# Required for Gemini AI API calls (Get yours at https://aistudio.google.com/)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# The deployment or local development URL
APP_URL="http://localhost:3000"

# Supabase Auth and Database Connection Keys (Get yours at https://supabase.com/)
VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

### 4. Run the Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see your app running.

---

## 📦 Directory Structure

```
├── .env.example            # Environment variables placeholder
├── server.ts               # Express backend proxy serving API endpoints and Vite middleware
├── schema.sql              # Supabase database schemas and Row Level Security (RLS) configurations
├── metadata.json           # AI Studio applet configurations
├── vite.config.ts          # Vite asset compiling and development configurations
├── src/
│   ├── main.tsx            # Main frontend entry point
│   ├── App.tsx             # Main routing controller
│   ├── types.ts            # Shared TypeScript interfaces and enums
│   ├── index.css           # Global Tailwind CSS imports and fonts configuration
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client initializer
│   │   └── dataService.ts  # Unified local-mode & cloud-mode persistence connector
│   └── components/
│       ├── LandingPage.tsx # Redesigned elegant landing page
│       ├── SignInPage.tsx  # User authentication login portal
│       ├── SignUpPage.tsx  # User onboarding registration portal
│       ├── Dashboard.tsx   # Core workspace dashboard container
│       ├── Sidebar.tsx     # Clean, collapsable navigation rail
│       ├── Header.tsx      # Top bar with profiles and global date/calendar controls
│       ├── ProductivityHub.tsx # Task manager, planning timeline, and habit boards
│       ├── AICoachChat.tsx     # Dynamic Gemini-supported support chatbot drawer
│       └── RescueStation.tsx   # Extension-draft generator for at-risk deadlines
```

---

## 🌐 Deployment

This application is optimized for containerized deployments and is deployed on **Google Cloud Run** using AI Studio's server-side container orchestration system.
*   **Production Build:** The server-side entrypoint (`server.ts`) is bundled cleanly into a single production file (`dist/server.cjs`) using `esbuild`.
*   **Web Asset Optimization:** Static assets are built via `vite build` into `/dist` and served statically by the Express web-server when running in production (`NODE_ENV=production`).

---

## 🔮 Future Scope

1.  **Bidirectional Calendar Synchronization:** Real-time sync with Google Calendar, Outlook, or Apple Calendar to import events and export generated plans automatically.
2.  **Cross-Platform Mobile App:** Bring Duewell to iOS and Android using React Native or Capacitor, featuring native push notifications for critical action schedules.
3.  **Collaborative Team Boards:** Create shared projects allowing remote teams to cross-track deadlines while using Duewell AI to distribute team tasks based on individual bandwidths.

---

### Credits & Gratitude
Built as a solo project for the **Coding Ninjas x Google for Developers Vibe2Ship Hackathon**. Thank you to the mentors and organizers for providing this incredible opportunity!
