import React, { useState, useEffect } from "react";
import { RouteType, Task, Habit, TimelineSlot, PriorityType, DifficultyType } from "../types";
import { dataService } from "../lib/dataService";
import { isSupabaseConfigured } from "../lib/supabase";
import { 
  Zap, LogOut, Plus, Calendar, Clock, CheckCircle2, Circle, Trash2, 
  Sparkles, ListFilter, AlertTriangle, Check, RefreshCw, Eye, Award, HelpCircle,
  AlertCircle, TrendingUp
} from "lucide-react";
import confetti from "canvas-confetti";

interface DashboardProps {
  userEmail: string;
  userId: string;
  onLogout: () => void;
  onNavigate: (route: RouteType) => void;
}

export default function Dashboard({ userEmail, userId, onLogout, onNavigate }: DashboardProps) {
  // Current Time State
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [currentPlan, setCurrentPlan] = useState<TimelineSlot[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [satisfyingLine, setSatisfyingLine] = useState("");
  const [planMantra, setPlanMantra] = useState("");
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [aiPrioritizing, setAiPrioritizing] = useState(false);
  const [aiPlanning, setAiPlanning] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Filter & Form States
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "ai">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New Task Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [priority, setPriority] = useState<PriorityType>("medium");
  const [difficulty, setDifficulty] = useState<DifficultyType>("medium");
  const [category, setCategory] = useState("Work");

  // New Habit Form
  const [newHabitName, setNewHabitName] = useState("");
  const [showHabitForm, setShowHabitForm] = useState(false);

  // Walkthrough Onboarding State
  const [walkthroughStep, setWalkthroughStep] = useState<number | null>(null);

  // Tick current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const fetchedTasks = await dataService.getTasks(userId);
        const fetchedHabits = await dataService.getHabits(userId);
        const savedPlan = await dataService.getDailyPlan(userId);
        
        // Restore AI enriched tasks if cached
        const cachedEnriched = localStorage.getItem(`ai_enriched_tasks_${userId}`);
        if (cachedEnriched) {
          const parsed = JSON.parse(cachedEnriched) as Task[];
          // Merge dynamic AI properties into fetched tasks
          const merged = fetchedTasks.map(t => {
            const aiData = parsed.find(pt => pt.id === t.id);
            if (aiData) {
              return {
                ...t,
                aiPriority: aiData.aiPriority,
                momentumCategory: aiData.momentumCategory,
                stressScore: aiData.stressScore,
                aiTip: aiData.aiTip,
                riskStatus: aiData.riskStatus,
                priorityRank: aiData.priorityRank,
                suggestedStartTime: aiData.suggestedStartTime,
                suggestedEndTime: aiData.suggestedEndTime,
                riskLevel: aiData.riskLevel
              };
            }
            return t;
          });
          setTasks(merged);
        } else {
          setTasks(fetchedTasks);
        }

        setHabits(fetchedHabits);
        
        if (savedPlan) {
          if (Array.isArray(savedPlan.plan_data)) {
            setCurrentPlan(savedPlan.plan_data);
            setRecommendations([]);
          } else if (savedPlan.plan_data && typeof savedPlan.plan_data === "object") {
            const planObj = savedPlan.plan_data as any;
            setCurrentPlan(planObj.schedule || []);
            setRecommendations(planObj.recommendations || []);
          }
          setPlanMantra(savedPlan.encouragement);
        }

        // Trigger onboarding walkthrough if first login after signup
        const isFirst = localStorage.getItem("lifesaver_is_first_signup");
        if (isFirst === "true") {
          setWalkthroughStep(1); // Start first step
          localStorage.removeItem("lifesaver_is_first_signup");
        }
      } catch (err: any) {
        setActionError("Could not load your records. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  // Clean success/error notifications after some time
  useEffect(() => {
    if (actionSuccess || actionError) {
      const t = setTimeout(() => {
        setActionSuccess("");
        setActionError("");
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [actionSuccess, actionError]);

  // Task Actions
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadlineDate) {
      setActionError("Please provide a title and due date.");
      return;
    }

    try {
      const combinedDeadline = new Date(`${deadlineDate}T${deadlineTime}`).toISOString();
      const created = await dataService.createTask(userId, {
        title,
        description,
        deadline: combinedDeadline,
        estimated_minutes: estimatedMinutes,
        priority,
        difficulty,
        category
      });

      setTasks(prev => [...prev, created]);
      setActionSuccess(`Added task: "${title}"`);
      
      // Reset form
      setTitle("");
      setDescription("");
      setDeadlineDate("");
      setDeadlineTime("23:59");
      setEstimatedMinutes(30);
      setPriority("medium");
      setDifficulty("medium");
      setCategory("Work");
      setShowAddForm(false);
    } catch (err: any) {
      setActionError("Failed to add task. Try again.");
    }
  };

  const handleToggleTaskStatus = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === "completed" ? "pending" : "completed";
    const completedAt = newStatus === "completed" ? new Date().toISOString() : null;

    try {
      const updated = await dataService.updateTask(userId, taskId, {
        status: newStatus,
        completed_at: completedAt
      });

      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated } : t));
      
      if (newStatus === "completed") {
        // Play satisfying moment confetti burst
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!prefersReducedMotion) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.65 },
            colors: ["#FF6B4A", "#4CAF82", "#F2A93B"]
          });
        }
        
        // Randomize a super friendly and satisfying line
        const completionLines = [
          "Nice work — one less thing to worry about.",
          "Momentum is building up! Beautiful execution.",
          "Crossed it off. Feel the weight lifting from your shoulders.",
          "Boom. Done. Breathe in deep and savor the feeling of checking that off."
        ];
        const randomLine = completionLines[Math.floor(Math.random() * completionLines.length)];
        setSatisfyingLine(randomLine);
        // Clear after 6 seconds
        setTimeout(() => setSatisfyingLine(""), 6000);

        setActionSuccess("Excellent win! Momentum increased!");
      } else {
        setActionSuccess("Task set back to pending.");
      }
    } catch (err) {
      setActionError("Could not update task status.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await dataService.deleteTask(userId, taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setActionSuccess("Task removed successfully.");
    } catch (err) {
      setActionError("Failed to remove task.");
    }
  };

  // Habit Actions
  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    try {
      const created = await dataService.createHabit(userId, newHabitName.trim());
      setHabits(prev => [...prev, created]);
      setActionSuccess(`Habit "${newHabitName}" registered!`);
      setNewHabitName("");
      setShowHabitForm(false);
    } catch (err) {
      setActionError("Failed to record habit.");
    }
  };

  const handleToggleHabit = async (habitId: string) => {
    try {
      const updated = await dataService.toggleHabitForToday(userId, habitId);
      setHabits(prev => prev.map(h => h.id === habitId ? updated : h));
      setActionSuccess("Habit updated! Keep that streak burning!");
    } catch (err) {
      setActionError("Failed to toggle habit.");
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await dataService.deleteHabit(userId, habitId);
      setHabits(prev => prev.filter(h => h.id !== habitId));
      setActionSuccess("Habit deleted.");
    } catch (err) {
      setActionError("Could not delete habit.");
    }
  };

  // AI Actions: 1. Prioritize Tasks
  const handleAIPrioritisation = async () => {
    if (tasks.filter(t => t.status !== 'completed').length === 0) {
      setActionError("Add some pending tasks first before running AI prioritization.");
      return;
    }

    setAiPrioritizing(true);
    setActionError("");

    try {
      const response = await fetch("/api/prioritize-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      });

      if (!response.ok) {
        throw new Error("Gemini AI API returned an error.");
      }

      const data = await response.json();
      const aiPrioritizedList = data.prioritizedTasks;
      const coachingMsg = data.coachingQuote;

      // Map the AI-assigned fields back to our tasks list
      const updatedTasks = tasks.map(t => {
        const aiUpdate = aiPrioritizedList.find((aiT: any) => aiT.id === t.id);
        if (aiUpdate) {
          return {
            ...t,
            aiPriority: aiUpdate.aiPriority as PriorityType,
            momentumCategory: aiUpdate.momentumCategory,
            stressScore: aiUpdate.stressScore,
            aiTip: aiUpdate.aiTip
          };
        }
        return t;
      });

      // Save prioritized list to state and local cache
      setTasks(updatedTasks);
      await dataService.savePrioritizedTasks(userId, updatedTasks);
      
      // Auto-set filter to 'ai' to let user see prioritized list
      setFilter("ai");
      setActionSuccess("AI Prioritization complete! Look at your curated list.");
      if (coachingMsg) {
        setPlanMantra(coachingMsg);
      }
    } catch (err: any) {
      console.error(err);
      setActionError("Failed to connect with Gemini AI. Check your GEMINI_API_KEY.");
    } finally {
      setAiPrioritizing(false);
    }
  };

  // AI Actions: 2. Generate Daily Plan
  const handleAIGeneratePlan = async () => {
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    if (pendingTasks.length === 0) {
      setActionError("Please register at least one task before building a daily schedule.");
      return;
    }

    setAiPlanning(true);
    setActionError("");

    try {
      const currentTimeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const response = await fetch("/api/generate-daily-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: pendingTasks,
          habits,
          currentTimeStr
        })
      });

      if (!response.ok) {
        throw new Error("Daily scheduler API failed.");
      }

      const data = await response.json();
      setCurrentPlan(data.timeline || []);
      setPlanMantra(data.mantra || "");
      setRecommendations(data.recommendations || []);

      // If the AI returned tasks metadata, enrich task objects
      let nextTasks = [...tasks];
      if (data.tasks && Array.isArray(data.tasks)) {
        nextTasks = tasks.map(t => {
          const update = data.tasks.find((tu: any) => tu.task_id === t.id);
          if (update) {
            let riskStatus: "On Track" | "Tight" | "Overdue Risk" = "On Track";
            if (update.risk_level === "high") {
              riskStatus = "Overdue Risk";
            } else if (update.risk_level === "medium") {
              riskStatus = "Tight";
            } else {
              riskStatus = "On Track";
            }

            return {
              ...t,
              riskStatus,
              aiTip: update.one_sentence_tip,
              priorityRank: update.priority_rank,
              suggestedStartTime: update.suggested_start_time,
              suggestedEndTime: update.suggested_end_time,
              riskLevel: update.risk_level
            };
          }
          return t;
        });
        setTasks(nextTasks);
        await dataService.savePrioritizedTasks(userId, nextTasks);
      }

      // Save daily plan with schedule and recommendations in plan_data
      await dataService.saveDailyPlan(userId, {
        plan_data: { schedule: data.timeline || [], recommendations: data.recommendations || [] } as any,
        encouragement: data.mantra || "",
        plan_date: new Date().toISOString().split("T")[0]
      });

      setActionSuccess("Your personalized daily plan, recommendations, and risk tips are ready!");
    } catch (err) {
      console.error(err);
      setActionError("Failed to schedule tasks. Please verify your connection.");
    } finally {
      setAiPlanning(false);
    }
  };

  const getTaskRiskStatus = (task: Task): "On Track" | "Tight" | "Overdue Risk" => {
    if (task.status === "completed") return "On Track";
    if (task.riskStatus) return task.riskStatus;
    
    const now = currentTime.getTime();
    const deadline = new Date(task.deadline).getTime();
    const diffTime = deadline - now;
    const diffHours = diffTime / (1000 * 60 * 60);

    if (diffTime < 0) {
      return "Overdue Risk";
    } else if (diffHours < 6) {
      return "Tight";
    }
    return "On Track";
  };

  // Calculations for Momentum Ring
  const totalTasksToday = tasks.length;
  const completedTasksToday = tasks.filter(t => t.status === "completed").length;
  const taskCompletionPercent = totalTasksToday > 0 
    ? Math.round((completedTasksToday / totalTasksToday) * 100) 
    : 0;

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const mostUrgentTask = pendingTasks.length > 0
    ? [...pendingTasks].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0]
    : null;

  // Render prioritized or filtered task lists
  const getFilteredTasks = () => {
    if (filter === "pending") return tasks.filter(t => t.status === "pending");
    if (filter === "completed") return tasks.filter(t => t.status === "completed");
    if (filter === "ai") {
      // Sort tasks by momentumCategory priority: Critical first, then Important, then Malleable
      const categoryOrder = {
        "Critical: Do Now": 1,
        "Important: Next": 2,
        "Malleable: Squeeze In": 3,
        "undefined": 4
      };
      return [...tasks].sort((a, b) => {
        const orderA = categoryOrder[a.momentumCategory || "undefined"];
        const orderB = categoryOrder[b.momentumCategory || "undefined"];
        return orderA - orderB;
      });
    }
    return tasks;
  };

  // Format datetimes friendly
  const formatDeadline = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffTime = date.getTime() - currentTime.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);

    // Dynamic warning labels
    let urgencyClass = "text-gray-500 bg-gray-50";
    let urgencyLabel = "";

    if (taskCompletionPercent === 100) {
      urgencyLabel = "Done";
    }

    if (diffTime < 0) {
      urgencyClass = "text-white bg-[#E2574C]";
      urgencyLabel = "OVERDUE";
    } else if (diffHours < 3) {
      urgencyClass = "text-white bg-[#FF6B4A] animate-pulse";
      urgencyLabel = "DUE SOON";
    } else if (diffHours < 24) {
      urgencyClass = "text-[#232323] bg-[#F2A93B]/20 border border-[#F2A93B]/40";
      urgencyLabel = "DUE TODAY";
    }

    const options: Intl.DateTimeFormatOptions = { 
      month: "short", 
      day: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    };
    return {
      formatted: date.toLocaleDateString([], options),
      urgencyClass,
      urgencyLabel,
      isOverdue: diffTime < 0
    };
  };

  // Check if habit is completed today
  const isHabitDoneToday = (habit: Habit) => {
    const todayStr = new Date().toISOString().split("T")[0];
    return habit.completed_dates.includes(todayStr);
  };

  return (
    <div className="min-h-screen bg-transparent text-[#232323] flex flex-col font-sans pb-16 relative">
      
      {/* Onboarding walkthrough overlays */}
      {walkthroughStep !== null && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white/80 backdrop-blur-xl p-7 max-w-sm rounded-2xl border border-white/40 shadow-xl text-center relative animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-[#FF6B4A]/10 text-[#FF6B4A] flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            
            {walkthroughStep === 1 && (
              <>
                <h3 className="font-outfit text-xl font-bold mb-2">1. Add your tasks</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-light mb-6">
                  Add high-stakes items with deadlines and estimated effort here. Our clean design lets you quickly catalog everything that's stressing you.
                </p>
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => setWalkthroughStep(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Skip guide
                  </button>
                  <button 
                    onClick={() => setWalkthroughStep(2)}
                    className="px-4 py-2 bg-[#FF6B4A] hover:bg-[#ff5631] text-white text-xs font-semibold custom-btn shadow-sm"
                  >
                    Next tip
                  </button>
                </div>
              </>
            )}

            {walkthroughStep === 2 && (
              <>
                <h3 className="font-outfit text-xl font-bold mb-2">2. Autopilot Your Day</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-light mb-6">
                  Unsure where to start? Use the <span className="font-semibold text-[#FF6B4A]">Generate Today's Plan</span> button. Gemini AI builds a balanced hourly timeline, adding buffers and breaks.
                </p>
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => setWalkthroughStep(1)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setWalkthroughStep(3)}
                    className="px-4 py-2 bg-[#FF6B4A] hover:bg-[#ff5631] text-white text-xs font-semibold custom-btn shadow-sm"
                  >
                    Next tip
                  </button>
                </div>
              </>
            )}

            {walkthroughStep === 3 && (
              <>
                <h3 className="font-outfit text-xl font-bold mb-2">3. Fuel Your Momentum</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-light mb-6">
                  Your <span className="font-semibold text-[#FF6B4A]">Momentum Ring</span> at the top tracks progress. Watch it ignite with coral-orange color as you mark items done!
                </p>
                <button 
                  onClick={() => setWalkthroughStep(null)}
                  className="w-full py-2.5 bg-[#FF6B4A] hover:bg-[#ff5631] text-white text-xs font-semibold custom-btn shadow-sm"
                >
                  Let's get started!
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/45 backdrop-blur-md border-b border-white/30 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("/")}>
            <div className="w-8 h-8 rounded-full bg-[#FF6B4A] flex items-center justify-center text-white shadow-sm">
              <Zap className="w-4 h-4 fill-white stroke-none" />
            </div>
            <span className="font-outfit text-lg font-bold tracking-tight">Last-Minute Life Saver</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <div className="px-3 py-1.5 bg-[#FAFAF9] border border-[#ECE9E3] rounded-full text-gray-600 tabular-nums font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#FF6B4A]" />
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} &bull; {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>

            <div className="text-gray-500">
              Logged in: <span className="font-medium text-[#232323]">{userEmail}</span>
            </div>

            <button
              onClick={() => setWalkthroughStep(1)}
              className="p-1.5 text-gray-400 hover:text-[#FF6B4A] transition-colors"
              title="Show Guide"
              id="guide-btn"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 font-semibold rounded-lg border border-transparent transition-all flex items-center gap-1.5"
              id="logout-btn"
            >
              <LogOut className="w-3.5 h-3.5" /> Log out
            </button>
          </div>
        </div>
      </header>

      {/* Top Banner alert (if local mock mode) */}
      {!isSupabaseConfigured && (
        <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs text-amber-800">
            <span className="flex items-center gap-2 font-light">
              <AlertTriangle className="w-4 h-4 text-[#F2A93B] shrink-0" />
              <span>You are currently in offline Sandbox Mode. To enable secure cloud backup, configure <strong className="font-semibold text-amber-950">VITE_SUPABASE_URL</strong> and <strong className="font-semibold text-amber-950">VITE_SUPABASE_ANON_KEY</strong> in your Secrets.</span>
            </span>
            <button 
              onClick={() => {
                // Copy sql instructions placeholder
                setActionSuccess("Copied database schema link reference!");
              }} 
              className="underline text-amber-950 hover:text-amber-800 font-semibold"
            >
              How to setup Database?
            </button>
          </div>
        </div>
      )}

      {/* Alerts */}
      {actionError && (
        <div className="fixed top-20 right-6 bg-red-50 border border-red-200 text-xs text-red-700 px-4 py-3 rounded-xl shadow-lg z-40 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#E2574C]" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="fixed top-20 right-6 bg-emerald-50 border border-emerald-200 text-xs text-[#4CAF82] px-4 py-3 rounded-xl shadow-lg z-40 flex items-center gap-2">
          <Check className="w-4 h-4 text-[#4CAF82]" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* UPPER ROW: Momentum Ring Header Card & Motivation */}
        <section className="lg:col-span-12" id="momentum-section">
          <div className="custom-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left max-w-xl">
              <div className="inline-block px-3 py-1 bg-orange-50 border border-orange-100 rounded-full text-xs font-semibold text-[#FF6B4A]">
                🎯 Today's Target
              </div>
              <h2 className="font-outfit text-3xl font-extrabold tracking-tight">Your Momentum Hub</h2>
              
              <p className="text-gray-500 font-light text-sm md:text-base leading-relaxed">
                {planMantra || "No pressure, just progress. Every small action you complete right now chips away at the deadline anxiety."}
              </p>

              {/* AI Actions Quick Row */}
              <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <button
                  onClick={handleAIPrioritisation}
                  disabled={aiPrioritizing || loading}
                  className="px-4 py-2 bg-white hover:bg-orange-50 text-[#FF6B4A] hover:text-[#ff5631] border border-[#FF6B4A]/40 text-xs font-semibold custom-btn shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  id="btn-ai-prioritize"
                >
                  {aiPrioritizing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sorting chaos...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Curate AI Priorities
                    </>
                  )}
                </button>

                <button
                  onClick={handleAIGeneratePlan}
                  disabled={aiPlanning || loading}
                  className="px-4 py-2 bg-[#FF6B4A] hover:bg-[#ff5631] text-white text-xs font-semibold custom-btn shadow-sm hover:shadow flex items-center gap-1.5 disabled:opacity-50"
                  id="btn-generate-plan"
                >
                  {aiPlanning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Structuring day...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3.5 h-3.5" /> Generate Today's Plan
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Momentum Ring Signature Element */}
            <div className="flex flex-col items-center shrink-0 w-full md:w-auto" id="momentum-ring-container">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* SVG Circular Progress Ring */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="#ECE9E3"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="#FF6B4A"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - taskCompletionPercent / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                {/* Inner textual score */}
                <div className="absolute text-center">
                  <span className="font-outfit text-3xl font-bold text-[#232323] tabular-nums">
                    {taskCompletionPercent}%
                  </span>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Momentum</p>
                </div>
              </div>

              {/* Brief encouraging line below */}
              <p className="text-xs text-gray-600 font-medium mt-3 text-center max-w-[180px]">
                {totalTasksToday === 0 
                  ? "No tasks registered yet!" 
                  : `${completedTasksToday} of ${totalTasksToday} done — ${
                      taskCompletionPercent === 100 
                        ? "absolutely incredible job!" 
                        : taskCompletionPercent > 60 
                        ? "almost there, keep pushin'!" 
                        : "building steady flow!"
                    }`}
              </p>
            </div>
          </div>
        </section>

        {/* Most Urgent Reminder Banner */}
        {mostUrgentTask && (
          <section className="lg:col-span-12" id="urgent-reminder-banner">
            <div className="bg-gradient-to-r from-[#FF6B4A]/10 to-[#F2A93B]/10 border border-[#FF6B4A]/30 backdrop-blur-md rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 text-[#FF6B4A]/5 pointer-events-none">
                <AlertCircle className="w-48 h-48" />
              </div>
              
              <div className="flex items-start gap-3.5 relative z-10">
                <div className="p-2 bg-[#FF6B4A]/10 text-[#FF6B4A] rounded-xl flex-shrink-0 mt-0.5 animate-pulse">
                  <AlertCircle className="w-5.5 h-5.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#FF6B4A] uppercase tracking-wider bg-orange-100/60 px-2 py-0.5 rounded-full">
                      🔥 Rescue Target
                    </span>
                    <span className="text-[10px] text-gray-500 font-semibold tabular-nums">
                      Due: {formatDeadline(mostUrgentTask.deadline).formatted}
                    </span>
                  </div>
                  <h4 className="font-outfit text-base font-extrabold text-[#232323]">
                    {mostUrgentTask.title}
                  </h4>
                  {mostUrgentTask.aiTip ? (
                    <p className="text-xs text-gray-600 italic font-light">
                      💡 &ldquo;{mostUrgentTask.aiTip}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600 italic font-light">
                      💡 No pressure. Break it into 3 small parts and just start the first part for 15 minutes!
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 relative z-10 w-full md:w-auto justify-end">
                <button
                  onClick={() => handleToggleTaskStatus(mostUrgentTask.id)}
                  className="w-full md:w-auto px-4 py-2 bg-[#FF6B4A] hover:bg-[#ff5631] text-white text-xs font-bold custom-btn shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  id="complete-urgent-task"
                >
                  <Check className="w-4 h-4 stroke-[3]" /> Defuse Now
                </button>
              </div>
            </div>
          </section>
        )}

        {/* BOTTOM ROW: LEFT (Tasks Column - lg:col-span-8), RIGHT (Daily plan & habits Column - lg:col-span-4) */}
        
        {/* Tasks Section */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-outfit text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>Your Rescue Station</span>
              <span className="text-xs px-2.5 py-1 bg-gray-100 rounded-full text-gray-500 tabular-nums">{tasks.filter(t => t.status === 'pending').length} pending</span>
            </h3>

            {/* Navigation & Add trigger */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Tabs */}
              <div className="bg-white border border-[#ECE9E3] rounded-lg p-0.5 flex gap-0.5">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1.5 text-xs font-semibold custom-btn ${filter === "all" ? "bg-[#FAFAF9] text-[#232323]" : "text-gray-500 hover:text-gray-900"}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("pending")}
                  className={`px-3 py-1.5 text-xs font-semibold custom-btn ${filter === "pending" ? "bg-[#FAFAF9] text-[#232323]" : "text-gray-500 hover:text-gray-900"}`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter("completed")}
                  className={`px-3 py-1.5 text-xs font-semibold custom-btn ${filter === "completed" ? "bg-[#FAFAF9] text-[#232323]" : "text-gray-500 hover:text-gray-900"}`}
                >
                  Done
                </button>
                <button
                  onClick={() => setFilter("ai")}
                  className={`px-3 py-1.5 text-xs font-semibold custom-btn flex items-center gap-1 ${filter === "ai" ? "bg-orange-50 text-[#FF6B4A]" : "text-gray-500 hover:text-[#FF6B4A]"}`}
                >
                  <Sparkles className="w-3 h-3" /> AI Prioritized
                </button>
              </div>

              {/* Add Task Button */}
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-[#232323] hover:bg-gray-800 text-white text-xs font-semibold custom-btn shadow-xs flex items-center gap-1"
                id="add-task-toggle"
              >
                <Plus className="w-3.5 h-3.5" /> Add Task
              </button>
            </div>
          </div>

          {/* Add Task Expandable Form */}
          {showAddForm && (
            <div className="custom-card p-6 animate-fade-in" id="add-task-form-container">
              <h4 className="font-outfit font-bold text-lg mb-4 text-[#FF6B4A]">Register a High-Stakes Deadline</h4>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Task Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Finish final chemistry paper citations"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2 bg-[#FAFAF9] border border-[#ECE9E3] focus:border-[#FF6B4A] outline-none text-sm rounded-lg"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Brief details or subtasks</label>
                    <textarea
                      placeholder="Describe parts to tackle so the AI can build dynamic tips..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2 bg-[#FAFAF9] border border-[#ECE9E3] focus:border-[#FF6B4A] outline-none text-sm rounded-lg h-20 resize-none"
                    />
                  </div>

                  {/* Deadline Date */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Due Date</label>
                    <input
                      type="date"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="w-full px-4 py-2 bg-[#FAFAF9] border border-[#ECE9E3] focus:border-[#FF6B4A] outline-none text-sm rounded-lg"
                      required
                    />
                  </div>

                  {/* Deadline Time */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Due Time</label>
                    <input
                      type="time"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      className="w-full px-4 py-2 bg-[#FAFAF9] border border-[#ECE9E3] focus:border-[#FF6B4A] outline-none text-sm rounded-lg"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2 bg-[#FAFAF9] border border-[#ECE9E3] focus:border-[#FF6B4A] outline-none text-sm rounded-lg"
                    >
                      <option value="Academic">Academic</option>
                      <option value="Work">Work</option>
                      <option value="Personal">Personal</option>
                      <option value="Admin">Admin</option>
                      <option value="Health">Health</option>
                    </select>
                  </div>

                  {/* Estimated Minutes Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Effort Estimate</label>
                    <select
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-[#FAFAF9] border border-[#ECE9E3] focus:border-[#FF6B4A] outline-none text-sm rounded-lg"
                    >
                      <option value={15}>15min (Quick Win)</option>
                      <option value={30}>30min (Focused Block)</option>
                      <option value={60}>1hr (Deep Dive)</option>
                      <option value={120}>2hr+ (Heavy Sprint)</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as PriorityType)}
                      className="w-full px-4 py-2 bg-[#FAFAF9] border border-[#ECE9E3] focus:border-[#FF6B4A] outline-none text-sm rounded-lg"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent / S.O.S</option>
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Difficulty level</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as DifficultyType)}
                      className="w-full px-4 py-2 bg-[#FAFAF9] border border-[#ECE9E3] focus:border-[#FF6B4A] outline-none text-sm rounded-lg"
                    >
                      <option value="easy">Easy (quick win)</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard (heavy sprint)</option>
                    </select>
                  </div>

                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium custom-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#FF6B4A] hover:bg-[#ff5631] text-white text-xs font-bold custom-btn shadow-sm"
                    id="add-task-submit"
                  >
                    Rescue This Deadline
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Loader or Placeholder state for task empty list */}
          {loading ? (
            <div className="py-20 text-center text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-[#FF6B4A]" />
              <p className="font-light text-sm">Organizing your rescue desk...</p>
            </div>
          ) : getFilteredTasks().length === 0 ? (
            <div className="custom-card p-12 text-center bg-white/40 backdrop-blur-md">
              <CheckCircle2 className="w-12 h-12 text-[#4CAF82] mx-auto mb-4" />
              <h4 className="font-outfit text-lg font-bold mb-1">Rescue Zone Clear</h4>
              <p className="text-gray-500 text-sm font-light max-w-sm mx-auto mb-6">
                You have no tasks yet. Add one to get your day moving.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-[#FF6B4A] hover:bg-[#ff5631] text-white text-xs font-semibold custom-btn shadow-xs"
              >
                Add task
              </button>
            </div>
          ) : (
            /* Tasks List rendering */
            <div className="space-y-4" id="tasks-list">
              {getFilteredTasks().map((task) => {
                const deadlineData = formatDeadline(task.deadline);
                
                return (
                  <div 
                    key={task.id} 
                    className={`custom-card p-5 transition-all border-l-4 hover:border-l-8 ${
                      task.status === "completed" 
                        ? "border-l-[#4CAF82] opacity-75" 
                        : task.priority === "urgent"
                        ? "border-l-[#FF6B4A]"
                        : task.priority === "high"
                        ? "border-l-[#F2A93B]"
                        : "border-l-[#ECE9E3]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      
                      {/* Checkbox trigger & Title info */}
                      <div className="flex items-start gap-3">
                        <button 
                          onClick={() => handleToggleTaskStatus(task.id)}
                          className="mt-1 transition-transform transform active:scale-95 text-[#232323] cursor-pointer"
                          id={`toggle-task-${task.id}`}
                        >
                          {task.status === "completed" ? (
                            <CheckCircle2 className="w-5.5 h-5.5 text-[#4CAF82] fill-emerald-50 stroke-2" />
                          ) : (
                            <Circle className="w-5.5 h-5.5 text-gray-300 hover:text-[#FF6B4A] stroke-2" />
                          )}
                        </button>

                        <div>
                          <h4 className={`font-outfit text-base font-bold ${task.status === "completed" ? "line-through text-gray-400" : "text-[#232323]"}`}>
                            {task.title}
                          </h4>
                          
                          {task.description && (
                            <p className="text-xs text-gray-500 font-light mt-1 max-w-xl leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Attribute badges */}
                          <div className="flex flex-wrap items-center gap-2 mt-3.5">
                            <span className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                              {task.category}
                            </span>
                            
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              task.priority === "urgent" 
                                ? "bg-red-50 text-[#E2574C] border border-red-100" 
                                : task.priority === "high"
                                ? "bg-amber-50 text-[#F2A93B] border border-amber-100"
                                : "bg-gray-50 text-gray-500 border border-gray-100"
                            }`}>
                              Priority: {task.priority}
                            </span>

                            <span className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[10px] font-medium text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#FF6B4A]" /> {task.estimated_minutes} min effort
                            </span>

                            {/* Risk Status Badge */}
                            {(() => {
                              const rStatus = getTaskRiskStatus(task);
                              let rClass = "";
                              if (rStatus === "Overdue Risk") rClass = "bg-red-50 text-red-600 border border-red-100";
                              else if (rStatus === "Tight") rClass = "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse";
                              else rClass = "bg-emerald-50 text-emerald-600 border border-emerald-100";
                              
                              return (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1 uppercase tracking-wider ${rClass}`}>
                                  {rStatus === "Overdue Risk" && <AlertTriangle className="w-2.5 h-2.5" />}
                                  {rStatus === "Tight" && <Clock className="w-2.5 h-2.5" />}
                                  {rStatus === "On Track" && <Check className="w-2.5 h-2.5" />}
                                  {rStatus}
                                </span>
                              );
                            })()}

                            {/* Dynamic Urgency Label Badge */}
                            {deadlineData.urgencyLabel && (
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest tabular-nums ${deadlineData.urgencyClass}`}>
                                {deadlineData.urgencyLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 text-gray-400 hover:text-[#E2574C] rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
                          title="Delete task"
                          id={`delete-task-${task.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                    {/* AI Enriched Section (Only displays if AI prioritized has run) */}
                    {(task.aiTip || task.momentumCategory || task.stressScore || task.priorityRank || task.suggestedStartTime || task.riskLevel) && task.status !== "completed" && (
                      <div className="mt-4 pt-4 border-t border-dashed border-gray-100 bg-[#FAFAF9]/60 p-3 rounded-xl">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FF6B4A]">
                            <Sparkles className="w-3.5 h-3.5 fill-[#FF6B4A] stroke-none" />
                            <span>AI Companion Insights</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {task.priorityRank !== undefined && (
                              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[10px] font-bold flex items-center gap-1">
                                <Award className="w-3 h-3" /> Rank #{task.priorityRank}
                              </span>
                            )}

                            {task.suggestedStartTime && task.suggestedEndTime && (
                              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-semibold flex items-center gap-1">
                                <Clock className="w-3 h-3 text-indigo-500" /> {task.suggestedStartTime} &ndash; {task.suggestedEndTime}
                              </span>
                            )}

                            {task.riskLevel && (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                                task.riskLevel === "high"
                                  ? "bg-red-50 text-red-700 border-red-100 animate-pulse"
                                  : task.riskLevel === "medium"
                                  ? "bg-amber-50 text-amber-700 border-amber-100"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-100"
                              }`}>
                                Risk: {task.riskLevel.toUpperCase()}
                              </span>
                            )}

                            {task.momentumCategory && (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                task.momentumCategory === "Critical: Do Now"
                                  ? "bg-red-50 text-[#E2574C]"
                                  : "bg-orange-50 text-[#FF6B4A]"
                              }`}>
                                {task.momentumCategory}
                              </span>
                            )}

                            {task.stressScore !== undefined && (
                              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                <span className="font-semibold text-gray-800">Anxiety level:</span> 
                                <span className="font-extrabold text-[#FF6B4A]">{task.stressScore}/10</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {task.aiTip && (
                          <p className="text-xs text-gray-600 font-light italic leading-normal">
                            &ldquo;{task.aiTip}&rdquo;
                          </p>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Habits & Plan Timeline (lg:col-span-4) */}
        <section className="lg:col-span-4 space-y-8">
          
          {/* Habits Section */}
          <div className="space-y-4" id="habits-section">
            <div className="flex items-center justify-between">
              <h3 className="font-outfit text-xl font-bold tracking-tight">Sustained Habits</h3>
              <button
                onClick={() => setShowHabitForm(!showHabitForm)}
                className="p-1.5 bg-white border border-[#ECE9E3] hover:bg-gray-50 rounded-lg text-gray-600 text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer"
                id="add-habit-toggle"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add Habit Tiny Form */}
            {showHabitForm && (
              <form onSubmit={handleCreateHabit} className="custom-card p-4 animate-fade-in space-y-3">
                <input
                  type="text"
                  placeholder="e.g. 5-minute deep breathing, Water check"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#ECE9E3] focus:border-[#FF6B4A] outline-none text-xs rounded-lg"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHabitForm(false)}
                    className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-500 text-[10px] font-medium rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#FF6B4A] hover:bg-[#ff5631] text-white text-[10px] font-bold rounded-md"
                    id="add-habit-submit"
                  >
                    Install Habit
                  </button>
                </div>
              </form>
            )}

            {/* Habits List */}
            {habits.length === 0 ? (
              <p className="text-xs text-gray-400 italic font-light">No daily support habits registered yet.</p>
            ) : (
              <div className="space-y-2">
                {habits.map((habit) => {
                  const done = isHabitDoneToday(habit);
                  return (
                    <div key={habit.id} className="custom-card p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => handleToggleHabit(habit.id)}
                          className="transition-transform transform active:scale-90 shrink-0 cursor-pointer"
                          id={`toggle-habit-${habit.id}`}
                        >
                          {done ? (
                            <div className="w-5 h-5 rounded-md bg-[#4CAF82] flex items-center justify-center text-white">
                              <Check className="w-3.5 h-3.5 stroke-2" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-md border-2 border-gray-200 hover:border-[#FF6B4A]" />
                          )}
                        </button>
                        
                        <div className="min-w-0">
                          <span className={`text-xs font-semibold block truncate ${done ? "line-through text-gray-400" : "text-[#232323]"}`}>
                            {habit.name}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium block">
                            Streak: <span className="text-[#FF6B4A] font-bold tabular-nums">{habit.streak} days</span>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1 text-gray-300 hover:text-[#E2574C] rounded"
                        title="Delete habit"
                        id={`delete-habit-${habit.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recommendations Panel */}
          <div className="space-y-4" id="recommendations-section">
            <h3 className="font-outfit text-xl font-bold tracking-tight flex items-center gap-1.5 text-[#FF6B4A]">
              <Sparkles className="w-5 h-5 fill-[#FF6B4A] stroke-none animate-pulse" />
              <span>Recommendations</span>
            </h3>
            <div className="custom-card p-5 bg-white/45 backdrop-blur-md border border-white/40 space-y-3">
              {recommendations.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-light leading-relaxed">
                    Let Gemini evaluate your high-stakes tasks to produce custom-tailored recommendations and quick wins!
                  </p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed font-light">
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#FF6B4A]" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Daily Schedule Timeline Section */}
          <div className="space-y-4" id="timeline-section">
            <h3 className="font-outfit text-xl font-bold tracking-tight">Today's Schedule</h3>
            
            {currentPlan.length === 0 ? (
              <div className="custom-card p-6 text-center border border-dashed">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-xs text-gray-500 font-light leading-relaxed mb-4">
                  No plan generated yet. Let Gemini organize your deadlines, workload, and rest intervals today.
                </p>
                <button
                  onClick={handleAIGeneratePlan}
                  disabled={aiPlanning || loading}
                  className="w-full py-2 bg-[#FF6B4A] hover:bg-[#ff5631] text-white text-xs font-semibold custom-btn shadow-xs"
                  id="btn-generate-plan-placeholder"
                >
                  Generate Daily Plan
                </button>
              </div>
            ) : (
              <div className="relative pl-4 border-l-2 border-[#ECE9E3] space-y-4">
                {currentPlan.map((slot, index) => (
                  <div key={index} className="relative group">
                    {/* Ring Node indicator */}
                    <div className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 bg-white ${
                      slot.type === "task" 
                        ? "border-[#FF6B4A]" 
                        : slot.type === "break"
                        ? "border-[#4CAF82]"
                        : "border-gray-300"
                    }`} />

                    <div className="bg-white/45 backdrop-blur-md p-3 rounded-xl border border-white/40 shadow-xs">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold mb-1.5 uppercase tracking-wide tabular-nums">
                        <span>{slot.startTime} &ndash; {slot.endTime}</span>
                        <span className={`px-1.5 py-0.5 rounded ${
                          slot.type === "task"
                            ? "bg-orange-50 text-[#FF6B4A]"
                            : slot.type === "break"
                            ? "bg-emerald-50 text-[#4CAF82]"
                            : "bg-gray-100 text-gray-600"
                        }`}>{slot.type}</span>
                      </div>

                      <h5 className="font-outfit text-xs font-bold text-gray-800 leading-tight">
                        {slot.label}
                      </h5>

                      {slot.advice && (
                        <p className="text-[10px] text-gray-500 mt-1 font-light italic leading-normal">
                          &ldquo;{slot.advice}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Reset schedule trigger */}
                <button
                  onClick={handleAIGeneratePlan}
                  disabled={aiPlanning}
                  className="w-full text-center py-2 text-xs text-gray-400 hover:text-[#FF6B4A] transition-all flex items-center justify-center gap-1"
                  id="rebuild-timeline"
                >
                  <RefreshCw className={`w-3 h-3 ${aiPlanning ? "animate-spin" : ""}`} /> 
                  Rebuild schedule
                </button>
              </div>
            )}
          </div>

        </section>

      </main>

      {/* Satisfying Moment Toast */}
      {satisfyingLine && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#232323]/90 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-white/10 animate-slide-up max-w-md w-11/12">
          <div className="p-1 bg-[#4CAF82] text-white rounded-full flex-shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div className="text-sm font-semibold leading-snug">
            {satisfyingLine}
          </div>
        </div>
      )}

    </div>
  );
}
