import React, { useState, useEffect } from "react";
import { RouteType, Task, Habit, TimelineSlot, PriorityType, DifficultyType } from "../types";
import { dataService } from "../lib/dataService";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { 
  Zap, LogOut, Plus, Calendar, Clock, CheckCircle2, Circle, Trash2, 
  Sparkles, ListFilter, AlertTriangle, Check, RefreshCw, Eye, Award, HelpCircle,
  AlertCircle, TrendingUp, Repeat, Mic, MicOff, Mail, Copy, X, ArrowLeft,
  LayoutDashboard, User, Settings, Search, Bell, Moon, Sun, ChevronRight, ChevronDown, Sliders, Activity, PanelLeftClose, PanelLeft,
  Phone, Briefcase, Target, BookOpen, Volume2, VolumeX, Save, Edit2, Loader2,
  Trophy, Shield, Flame, Fingerprint, Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AICoachChat from "./AICoachChat";
import RescueStation from "./RescueStation";
import ProductivityHub from "./ProductivityHub";
import confetti from "canvas-confetti";

interface DashboardProps {
  userEmail: string;
  userId: string;
  onLogout: () => void;
  onNavigate: (route: RouteType) => void;
}

interface ParsedTaskInfo {
  title: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  detectedDeadlineText?: string;
}

function parseSpokenText(spokenText: string): ParsedTaskInfo {
  const text = spokenText.trim();
  const keywords = ["due on", "due at", "due", "by tomorrow", "by today", "by", "on", "at"];
  let splitIndex = -1;
  let matchedKeyword = "";
  const lowerText = text.toLowerCase();
  
  for (const kw of keywords) {
    const idx = lowerText.lastIndexOf(" " + kw + " ");
    const startsWithKw = lowerText.startsWith(kw + " ");
    
    if (idx !== -1) {
      if (idx > splitIndex) {
        splitIndex = idx;
        matchedKeyword = kw;
      }
    } else if (startsWithKw && splitIndex === -1) {
      splitIndex = 0;
      matchedKeyword = kw;
    }
  }
  
  if (splitIndex === -1) {
    const relativeKeywords = ["tomorrow", "today", "next week"];
    for (const kw of relativeKeywords) {
      const idx = lowerText.lastIndexOf(" " + kw);
      if (idx !== -1 && idx > splitIndex) {
        splitIndex = idx;
        matchedKeyword = kw;
      }
    }
  }

  let titlePart = text;
  let deadlinePart = "";

  if (splitIndex !== -1) {
    titlePart = text.substring(0, splitIndex).trim();
    if (splitIndex === 0) {
      deadlinePart = text.substring(matchedKeyword.length).trim();
    } else {
      deadlinePart = text.substring(splitIndex + matchedKeyword.length + 1).trim();
      if (["tomorrow", "today", "next week"].includes(matchedKeyword)) {
        deadlinePart = matchedKeyword + " " + deadlinePart;
      }
    }
  }

  const targetDate = new Date();
  let dateFound = false;
  let timeFound = false;
  let parsedDateStr = "";
  let parsedTimeStr = "23:59";
  const dlLower = deadlinePart.toLowerCase().trim();
  
  if (dlLower) {
    if (dlLower.includes("today")) {
      dateFound = true;
      targetDate.setDate(targetDate.getDate());
    } else if (dlLower.includes("tomorrow")) {
      dateFound = true;
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (dlLower.includes("day after tomorrow")) {
      dateFound = true;
      targetDate.setDate(targetDate.getDate() + 2);
    } else {
      const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      let foundDayIdx = -1;
      for (let i = 0; i < 7; i++) {
        if (dlLower.includes(daysOfWeek[i])) {
          foundDayIdx = i;
          break;
        }
      }
      
      if (foundDayIdx !== -1) {
        dateFound = true;
        const currentDay = targetDate.getDay();
        let daysToAdd = foundDayIdx - currentDay;
        if (daysToAdd <= 0) {
          daysToAdd += 7;
        }
        if (dlLower.includes("next")) {
          if (foundDayIdx - currentDay > 0) {
            daysToAdd += 7;
          }
        }
        targetDate.setDate(targetDate.getDate() + daysToAdd);
      } else {
        const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
        const shortMonths = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        
        let foundMonthIdx = -1;
        for (let i = 0; i < 12; i++) {
          if (dlLower.includes(months[i]) || dlLower.includes(shortMonths[i])) {
            foundMonthIdx = i;
            break;
          }
        }
        
        if (foundMonthIdx !== -1) {
          dateFound = true;
          targetDate.setMonth(foundMonthIdx);
          const dayRegex = /\b(\d{1,2})(st|nd|rd|th)?\b/;
          const match = dlLower.match(dayRegex);
          if (match) {
            targetDate.setDate(parseInt(match[1], 10));
          }
          const yearRegex = /\b(202\d)\b/;
          const yearMatch = dlLower.match(yearRegex);
          if (yearMatch) {
            targetDate.setFullYear(parseInt(yearMatch[1], 10));
          } else {
            const now = new Date();
            if (targetDate.getTime() < now.getTime() - 86400000) {
              targetDate.setFullYear(now.getFullYear() + 1);
            }
          }
        }
      }
    }
    
    if (dlLower.includes("noon")) {
      timeFound = true;
      parsedTimeStr = "12:00";
    } else if (dlLower.includes("midnight")) {
      timeFound = true;
      parsedTimeStr = "00:00";
    } else {
      const timeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
      const timeMatch = dlLower.match(timeRegex);
      if (timeMatch) {
        timeFound = true;
        let hour = parseInt(timeMatch[1], 10);
        const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : "";
        if (ampm === "pm" && hour < 12) hour += 12;
        if (ampm === "am" && hour === 12) hour = 0;
        const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
        const minStr = minute < 10 ? `0${minute}` : `${minute}`;
        parsedTimeStr = `${hourStr}:${minStr}`;
      }
    }
  }

  if (dateFound) {
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
    const dd = String(targetDate.getDate()).padStart(2, "0");
    parsedDateStr = `${yyyy}-${mm}-${dd}`;
  }

  titlePart = titlePart.replace(/\b(by|due|on|at|due on|due at)$/i, "").trim();
  titlePart = titlePart.replace(/\s+/g, " ");

  if (titlePart.length > 0) {
    titlePart = titlePart.charAt(0).toUpperCase() + titlePart.slice(1);
  }

  return {
    title: titlePart,
    date: dateFound ? parsedDateStr : undefined,
    time: timeFound ? parsedTimeStr : undefined,
    detectedDeadlineText: deadlinePart || undefined
  };
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
  const [showCalendarView, setShowCalendarView] = useState(false);
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [aiPrioritizing, setAiPrioritizing] = useState(false);
  const [aiPlanning, setAiPlanning] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionSuccessAction, setActionSuccessAction] = useState<{ label: string; onClick: () => void } | null>(null);
  
  // Non-happy-path error tracking states
  const [initialLoadError, setInitialLoadError] = useState(false);
  const [aiPrioritizeError, setAiPrioritizeError] = useState(false);
  const [aiPlanningError, setAiPlanningError] = useState(false);
  const [aiDraftError, setAiDraftError] = useState<Record<string, boolean>>({});

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
  const [markAsHabitInForm, setMarkAsHabitInForm] = useState(false);
  const [celebration, setCelebration] = useState<{ show: boolean; habitName: string; days: number } | null>(null);

  // Walkthrough Onboarding State
  const [walkthroughStep, setWalkthroughStep] = useState<number | null>(null);

  // Premium Layout States
  const [activeView, setActiveView] = useState<"dashboard" | "productivity" | "momentum" | "rescue" | "coach" | "profile" | "settings">("dashboard");
  const [viewHistory, setViewHistory] = useState<string[]>(["dashboard"]);

  useEffect(() => {
    setViewHistory(prev => {
      if (prev[prev.length - 1] === activeView) {
        return prev;
      }
      return [...prev, activeView];
    });
  }, [activeView]);

  const handleGoBack = () => {
    if (viewHistory.length > 1) {
      const newHistory = [...viewHistory];
      newHistory.pop(); // Remove current view
      const prevView = newHistory[newHistory.length - 1] as any;
      setViewHistory(newHistory);
      setActiveView(prevView || "dashboard");
    } else {
      setActiveView("dashboard");
    }
  };

  const [productivitySubTab, setProductivitySubTab] = useState<"tasks" | "habits" | "schedule">("tasks");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string; type: 'alert' | 'success' | 'info' }>>([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: "Hello! I am Gemini, your Duewell productivity coach. I know deadlines can feel terrifying, but together we can break through the paralysis. What is currently stressing you out the most today?" }
  ]);
  const [currentChatMessage, setCurrentChatMessage] = useState("");
  const [coachChatLoading, setCoachChatLoading] = useState(false);
  const [coachRole, setCoachRole] = useState<"comfort" | "sergeant" | "analyst">("comfort");
  const [profileName, setProfileName] = useState("");
  const [profileIsEditing, setProfileIsEditing] = useState(false);
  const [profileEditName, setProfileEditName] = useState("");
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);

  // Additional basic details state
  const [phone, setPhone] = useState("");
  const [occupation, setOccupation] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [bio, setBio] = useState("");
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editOccupation, setEditOccupation] = useState("");
  const [editFocusArea, setEditFocusArea] = useState("");
  const [editBio, setEditBio] = useState("");
  const [detailsUpdateLoading, setDetailsUpdateLoading] = useState(false);
  const [detailsSuccessMessage, setDetailsSuccessMessage] = useState("");
  const [detailsErrorMessage, setDetailsErrorMessage] = useState("");
  const [emailCopied, setEmailCopied] = useState(false);

  // AI premium handlers state
  const [explodingTaskId, setExplodingTaskId] = useState<string | null>(null);
  const [roadmappingTaskId, setRoadmappingTaskId] = useState<string | null>(null);

  // App settings state
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [stressTolerance, setStressTolerance] = useState("Balanced");
  const [enableSound, setEnableSound] = useState(true);
  const [enableAITips, setEnableAITips] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccessMessage, setSettingsSuccessMessage] = useState("");
  const [settingsErrorMessage, setSettingsErrorMessage] = useState("");

  useEffect(() => {
    async function loadUserProfileAndSettings() {
      // 1. Load Profile Name
      const localName = localStorage.getItem("lifesaver_user_full_name") || "";
      setProfileName(localName);
      setProfileEditName(localName);

      // 2. Load User Profile Details
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const metaName = user.user_metadata?.full_name || user.user_metadata?.name || "";
            const metaPhone = user.user_metadata?.phone_number || "";
            const metaOccupation = user.user_metadata?.occupation || "";
            const metaFocusArea = user.user_metadata?.focus_area || "";
            const metaBio = user.user_metadata?.bio || "";

            if (metaName) {
              setProfileName(metaName);
              setProfileEditName(metaName);
              localStorage.setItem("lifesaver_user_full_name", metaName);
            }
            setPhone(metaPhone);
            setEditPhone(metaPhone);
            setOccupation(metaOccupation);
            setEditOccupation(metaOccupation);
            setFocusArea(metaFocusArea);
            setEditFocusArea(metaFocusArea);
            setBio(metaBio);
            setEditBio(metaBio);

            if (metaPhone) localStorage.setItem("lifesaver_user_phone", metaPhone);
            if (metaOccupation) localStorage.setItem("lifesaver_user_occupation", metaOccupation);
            if (metaFocusArea) localStorage.setItem("lifesaver_user_focus_area", metaFocusArea);
            if (metaBio) localStorage.setItem("lifesaver_user_bio", metaBio);
          }
        } catch (e) {
          console.error("Supabase profile load error:", e);
        }
      } else {
        const cachedPhone = localStorage.getItem("lifesaver_user_phone") || "";
        const cachedOccupation = localStorage.getItem("lifesaver_user_occupation") || "";
        const cachedFocusArea = localStorage.getItem("lifesaver_user_focus_area") || "";
        const cachedBio = localStorage.getItem("lifesaver_user_bio") || "";

        setPhone(cachedPhone);
        setEditPhone(cachedPhone);
        setOccupation(cachedOccupation);
        setEditOccupation(cachedOccupation);
        setFocusArea(cachedFocusArea);
        setEditFocusArea(cachedFocusArea);
        setBio(cachedBio);
        setEditBio(cachedBio);
      }

      // 3. Load App Settings
      const savedWork = localStorage.getItem("lifesaver_setting_work_duration");
      const savedBreak = localStorage.getItem("lifesaver_setting_break_duration");
      const savedStress = localStorage.getItem("lifesaver_setting_stress_tolerance");
      const savedSound = localStorage.getItem("lifesaver_setting_enable_sound");
      const savedAITips = localStorage.getItem("lifesaver_setting_enable_ai_tips");

      if (savedWork) setWorkDuration(parseInt(savedWork, 10));
      if (savedBreak) setBreakDuration(parseInt(savedBreak, 10));
      if (savedStress) setStressTolerance(savedStress);
      if (savedSound) setEnableSound(savedSound !== "false");
      if (savedAITips) setEnableAITips(savedAITips !== "false");
    }

    loadUserProfileAndSettings();
  }, []);

  const handleUpdateProfileName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = profileEditName.trim();
    if (!trimmed) return;
    setProfileUpdateLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.updateUser({ data: { full_name: trimmed } });
      }
      localStorage.setItem("lifesaver_user_full_name", trimmed);
      setProfileName(trimmed);
      setProfileIsEditing(false);
      setActionSuccess("Profile name updated successfully!");
      window.dispatchEvent(
        new CustomEvent("profile-updated", { detail: { fullName: trimmed } })
      );
    } catch (err) {
      setActionError("Could not update profile name.");
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsErrorMessage("");
    setDetailsSuccessMessage("");
    setDetailsUpdateLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.updateUser({
          data: {
            phone_number: editPhone.trim(),
            occupation: editOccupation.trim(),
            focus_area: editFocusArea.trim(),
            bio: editBio.trim()
          }
        });

        if (error) throw error;

        if (data.user) {
          const uPhone = data.user.user_metadata?.phone_number || editPhone.trim();
          const uOccupation = data.user.user_metadata?.occupation || editOccupation.trim();
          const uFocusArea = data.user.user_metadata?.focus_area || editFocusArea.trim();
          const uBio = data.user.user_metadata?.bio || editBio.trim();

          setPhone(uPhone);
          setOccupation(uOccupation);
          setFocusArea(uFocusArea);
          setBio(uBio);

          localStorage.setItem("lifesaver_user_phone", uPhone);
          localStorage.setItem("lifesaver_user_occupation", uOccupation);
          localStorage.setItem("lifesaver_user_focus_area", uFocusArea);
          localStorage.setItem("lifesaver_user_bio", uBio);

          setDetailsSuccessMessage("Your profile details have been successfully updated!");
          setIsEditingDetails(false);
        }
      } else {
        // Local mode update
        setTimeout(() => {
          const uPhone = editPhone.trim();
          const uOccupation = editOccupation.trim();
          const uFocusArea = editFocusArea.trim();
          const uBio = editBio.trim();

          setPhone(uPhone);
          setOccupation(uOccupation);
          setFocusArea(uFocusArea);
          setBio(uBio);

          localStorage.setItem("lifesaver_user_phone", uPhone);
          localStorage.setItem("lifesaver_user_occupation", uOccupation);
          localStorage.setItem("lifesaver_user_focus_area", uFocusArea);
          localStorage.setItem("lifesaver_user_bio", uBio);

          setDetailsSuccessMessage("Profile details updated locally!");
          setIsEditingDetails(false);
          setDetailsUpdateLoading(false);
        }, 500);
      }
    } catch (err: any) {
      setDetailsErrorMessage(err.message || "Failed to update profile details.");
    } finally {
      setDetailsUpdateLoading(false);
    }
  };

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsErrorMessage("");
    setSettingsSuccessMessage("");
    setSettingsLoading(true);

    try {
      localStorage.setItem("lifesaver_setting_work_duration", workDuration.toString());
      localStorage.setItem("lifesaver_setting_break_duration", breakDuration.toString());
      localStorage.setItem("lifesaver_setting_stress_tolerance", stressTolerance);
      localStorage.setItem("lifesaver_setting_enable_sound", enableSound.toString());
      localStorage.setItem("lifesaver_setting_enable_ai_tips", enableAITips.toString());

      // Trigger custom settings updated event
      window.dispatchEvent(new CustomEvent("settings-updated"));

      setTimeout(() => {
        setSettingsSuccessMessage("Application settings successfully saved!");
        setSettingsLoading(false);
      }, 450);
    } catch (err) {
      setSettingsErrorMessage("Could not save settings. Please try again.");
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    const list: typeof notifications = [];
    const pending = tasks.filter(t => t.status !== 'completed');
    const overdueCount = pending.filter(t => {
      const diff = new Date(t.deadline).getTime() - new Date().getTime();
      return diff < 0;
    }).length;
    if (overdueCount > 0) {
      list.push({ id: 'overdue', text: `You have ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} requiring urgent rescue!`, time: 'Just now', type: 'alert' });
    }
    const dueTodayCount = pending.filter(t => {
      const diff = new Date(t.deadline).getTime() - new Date().getTime();
      return diff >= 0 && diff < 24 * 60 * 60 * 1000;
    }).length;
    if (dueTodayCount > 0) {
      list.push({ id: 'duetoday', text: `${dueTodayCount} high-stakes task${dueTodayCount > 1 ? 's are' : ' is'} due today.`, time: 'Just now', type: 'info' });
    }
    if (currentPlan.length > 0) {
      list.push({ id: 'plan', text: "Your daily focus timeline has been generated by Gemini.", time: 'Updated', type: 'success' });
    }
    setNotifications(list);
  }, [tasks, currentPlan]);

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const msg = currentChatMessage.trim();
    if (!msg) return;
    
    // Save current messages list to map into history
    const historyList = [...chatMessages];
    
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setCurrentChatMessage("");
    setCoachChatLoading(true);
    try {
      const res = await fetch("/api/ai-coach-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: msg,
          role: coachRole,
          history: historyList.map(h => ({ role: h.role === 'user' ? 'user' : 'model', text: h.text }))
        })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', text: data.reply || "I am here for you. Let's break things down together." }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: "I ran into a small connection blip. Let's still take a slow, deep breath, and pick the smallest possible task to start with." }]);
    } finally {
      setCoachChatLoading(false);
    }
  };

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [speechFeedback, setSpeechFeedback] = useState("");

  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setSpeechFeedback("Listening... Speak your task now!");
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setActionError("Microphone permission denied. Please enable mic access.");
          setSpeechFeedback("Permission denied.");
        } else if (event.error === "no-speech") {
          setSpeechFeedback("No speech detected. Please try again.");
        } else {
          setSpeechFeedback(`Speech error: ${event.error}`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSpeechFeedback(`Heard: "${transcript}"`);
          handleSpokenText(transcript);
        }
      };

      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      setActionError("Speech recognition is not supported in this browser. Try Chrome, Edge or Safari!");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setActionError("");
      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition", err);
      }
    }
  };

  const handleSpokenText = (transcript: string) => {
    const parsed = parseSpokenText(transcript);
    
    if (parsed.title) {
      setTitle(parsed.title);
    }
    
    if (parsed.date) {
      setDeadlineDate(parsed.date);
      setActionSuccess(`Parsed: "${parsed.title}" due on ${parsed.date}`);
    } else {
      const todayStr = new Date().toISOString().split("T")[0];
      setDeadlineDate(todayStr);
      setActionSuccess(`Parsed: "${parsed.title}" (Deadline not specified, set to today)`);
    }

    if (parsed.time) {
      setDeadlineTime(parsed.time);
    }

    setShowAddForm(true);
  };

  // State for Extension request email drafts
  const [extensionDrafts, setExtensionDrafts] = useState<Record<string, string>>({});
  const [loadingDrafts, setLoadingDrafts] = useState<Record<string, boolean>>({});
  const [copiedDrafts, setCopiedDrafts] = useState<Record<string, boolean>>({});

  const handleGenerateExtensionDraft = async (task: Task) => {
    setLoadingDrafts(prev => ({ ...prev, [task.id]: true }));
    setAiDraftError(prev => ({ ...prev, [task.id]: false }));
    setActionError("");
    try {
      const response = await fetch("/api/generate-extension-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: task.title,
          deadline: task.deadline,
          category: task.category,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate draft");
      }
      const data = await response.json();
      setExtensionDrafts(prev => ({ ...prev, [task.id]: data.draft }));
      setAiDraftError(prev => ({ ...prev, [task.id]: false }));
      setActionSuccess(`Draft extension request for "${task.title}" generated successfully!`);
    } catch (err: any) {
      console.error(err);
      setAiDraftError(prev => ({ ...prev, [task.id]: true }));
      setActionError(`Could not generate an extension draft for "${task.title}". Gemini might be temporarily overloaded.`);
    } finally {
      setLoadingDrafts(prev => ({ ...prev, [task.id]: false }));
    }
  };

  const handleCopyDraft = (taskId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDrafts(prev => ({ ...prev, [taskId]: true }));
    setTimeout(() => {
      setCopiedDrafts(prev => ({ ...prev, [taskId]: false }));
    }, 2000);
  };

  // Tick current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setInitialLoadError(false);
      setActionError("");
      const rawTasks = await dataService.getTasks(userId);
      const fetchedTasks = rawTasks.map(t => ({
        ...t,
        subtasks: t.subtasks ? t.subtasks.map((st: any) => {
          let titleStr = st.title;
          if (st.title && typeof st.title === "object") {
            titleStr = typeof st.title.title === "string"
              ? `${st.title.title}${st.title.estimated_minutes ? ` (${st.title.estimated_minutes}m)` : ""}`
              : JSON.stringify(st.title);
          }
          return {
            ...st,
            title: typeof titleStr === "string" ? titleStr : String(titleStr || "")
          };
        }) : undefined
      }));
      const fetchedHabits = await dataService.getHabits(userId);
      const savedPlan = await dataService.getDailyPlan(userId);
      
      // Restore AI enriched tasks if cached
      const cachedEnriched = localStorage.getItem(`ai_enriched_tasks_${userId}`);
      if (cachedEnriched) {
        const parsedRaw = JSON.parse(cachedEnriched) as Task[];
        const parsed = parsedRaw.map(t => ({
          ...t,
          subtasks: t.subtasks ? t.subtasks.map((st: any) => {
            let titleStr = st.title;
            if (st.title && typeof st.title === "object") {
              titleStr = typeof st.title.title === "string"
                ? `${st.title.title}${st.title.estimated_minutes ? ` (${st.title.estimated_minutes}m)` : ""}`
                : JSON.stringify(st.title);
            }
            return {
              ...st,
              title: typeof titleStr === "string" ? titleStr : String(titleStr || "")
            };
          }) : undefined
        }));
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
              riskLevel: aiData.riskLevel,
              subtasks: t.subtasks || aiData.subtasks // Keep latest subtasks
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

      // Check for automatic seeding of sample data
      if (fetchedTasks.length === 0 && fetchedHabits.length === 0 && !localStorage.getItem("duewell_has_seeded_" + userId)) {
        localStorage.setItem("duewell_has_seeded_" + userId, "true");
        setTimeout(() => {
          handleSeedSampleData();
        }, 100);
        return;
      }

      // Trigger onboarding walkthrough if first login after signup
      const isFirst = localStorage.getItem("lifesaver_is_first_signup");
      if (isFirst === "true") {
        setWalkthroughStep(1); // Start first step
        localStorage.removeItem("lifesaver_is_first_signup");
      }
    } catch (err: any) {
      console.error(err);
      setInitialLoadError(true);
      setActionError("We had a small hiccup connecting to our database server. You can retry anytime.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedSampleData = async () => {
    try {
      setLoading(true);
      setActionError("");
      setActionSuccess("");

      // 1. Fetch and clean up existing tasks & habits to prevent duplicates
      const currentTasks = await dataService.getTasks(userId);
      const currentHabits = await dataService.getHabits(userId);

      for (const t of currentTasks) {
        await dataService.deleteTask(userId, t.id);
      }
      for (const h of currentHabits) {
        await dataService.deleteHabit(userId, h.id);
      }

      // 2. Create high-quality Sample Tasks
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      const todayUrgent = new Date();
      todayUrgent.setHours(todayUrgent.getHours() + 2);

      const tasksToSeed = [
        {
          title: "Organic Chemistry: Study reaction mechanisms",
          description: "Focus on nucleophilic substitution (SN1/SN2) and elimination (E1/E2) mechanisms for midterms.",
          deadline: todayUrgent.toISOString(),
          estimated_minutes: 60,
          priority: "urgent" as PriorityType,
          difficulty: "hard" as DifficultyType,
          category: "Academic",
          subtasks: [
            { id: "st-1", title: "Review organic chemistry lecture notes on nucleophiles", completed: false },
            { id: "st-2", title: "Draw SN1 vs SN2 reaction rate diagrams", completed: false },
            { id: "st-3", title: "Solve chapter end practice problems 1 to 8", completed: false }
          ]
        },
        {
          title: "Draft Duewell software product specifications",
          description: "Specify the micro-schedule generator algorithm and user preference caching details.",
          deadline: tomorrow.toISOString(),
          estimated_minutes: 45,
          priority: "high" as PriorityType,
          difficulty: "medium" as DifficultyType,
          category: "Work",
          subtasks: [
            { id: "st-4", title: "Write core input/output schemas", completed: false },
            { id: "st-5", title: "Refine offline cache fallback logic", completed: false }
          ]
        },
        {
          title: "Review biology project final submission outline",
          description: "Submit final outline on canvas before midnight.",
          deadline: new Date(Date.now() + 18000000).toISOString(), // 5 hours from now
          estimated_minutes: 30,
          priority: "urgent" as PriorityType,
          difficulty: "easy" as DifficultyType,
          category: "Academic",
          subtasks: [
            { id: "st-6", title: "Check reference list APA citations", completed: false },
            { id: "st-7", title: "Upload document to Canvas", completed: false }
          ]
        },
        {
          title: "Renew car insurance policy",
          description: "Check quotes from three insurers and renew policy.",
          deadline: dayAfter.toISOString(),
          estimated_minutes: 20,
          priority: "medium" as PriorityType,
          difficulty: "easy" as DifficultyType,
          category: "Admin",
          subtasks: []
        }
      ];

      const seededTasks: Task[] = [];
      for (const t of tasksToSeed) {
        const created = await dataService.createTask(userId, {
          title: t.title,
          description: t.description,
          deadline: t.deadline,
          estimated_minutes: t.estimated_minutes,
          priority: t.priority,
          difficulty: t.difficulty,
          category: t.category,
          subtasks: t.subtasks
        });
        seededTasks.push(created);
      }

      // 3. Create high-quality Sample Habits
      const habitsToSeed = [
        "Morning deep breathing (5 min)",
        "Stay hydrated: Drink 3L of water",
        "Stretching break"
      ];

      for (const hName of habitsToSeed) {
        await dataService.createHabit(userId, hName);
      }

      // 4. Set up an initial high-quality Daily Plan / Schedule
      const seededPlanData: TimelineSlot[] = [
        {
          startTime: "09:00",
          endTime: "10:00",
          label: "Organic Chemistry: Study reaction mechanisms",
          type: "task",
          relatedTaskId: seededTasks[0].id,
          advice: "Deep Work session focusing on SN1/SN2. Eliminate distractions."
        },
        {
          startTime: "10:00",
          endTime: "10:30",
          label: "Review biology project final outline",
          type: "task",
          relatedTaskId: seededTasks[2].id,
          advice: "Proofread chapter references and fix citations before uploading."
        },
        {
          startTime: "10:30",
          endTime: "10:45",
          label: "Stretching Break & Water Hydration",
          type: "break",
          advice: "Take a physical break. Stand up and drink a tall glass of water."
        },
        {
          startTime: "11:00",
          endTime: "11:45",
          label: "Draft Duewell specifications",
          type: "task",
          relatedTaskId: seededTasks[1].id,
          advice: "Bite-sized planning: Write the core input/output API schemas."
        }
      ];

      await dataService.saveDailyPlan(userId, {
        plan_date: new Date().toISOString().split("T")[0],
        plan_data: seededPlanData,
        encouragement: "Fantastic daily template seeded! You have a beautifully structured flow. Banish task paralysis and start strong!"
      });

      // Clear any enrichment caches to reload cleanly
      localStorage.removeItem(`ai_enriched_tasks_${userId}`);
      localStorage.setItem("duewell_has_seeded_" + userId, "true");

      // 5. Reload
      await loadDashboardData();
      setActionSuccess("Seeded 4 high-quality tasks, 3 habits, and a complete daily schedule timeline!");
    } catch (err: any) {
      console.error(err);
      setActionError("Could not complete sample data seeding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  // Clean success/error notifications after some time
  useEffect(() => {
    if (actionSuccess || actionError) {
      const timeoutDuration = actionSuccess && actionSuccessAction ? 12000 : 5000;
      const t = setTimeout(() => {
        setActionSuccess("");
        setActionError("");
      }, timeoutDuration);
      return () => clearTimeout(t);
    }
  }, [actionSuccess, actionError, actionSuccessAction]);

  // Sync actionSuccessAction state with actionSuccess
  useEffect(() => {
    if (!actionSuccess) {
      setActionSuccessAction(null);
    } else if (
      actionSuccess !== "AI Prioritization complete! Look at your curated list." &&
      actionSuccess !== "Your personalized daily plan, recommendations, and risk tips are ready!"
    ) {
      setActionSuccessAction(null);
    }
  }, [actionSuccess]);

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
        title: title.trim(),
        description,
        deadline: combinedDeadline,
        estimated_minutes: estimatedMinutes,
        priority,
        difficulty,
        category
      });

      setTasks(prev => [...prev, created]);
      setActionSuccess(`Added task: "${title}"`);

      // If marked as daily habit, create a habit too
      if (markAsHabitInForm) {
        try {
          const matchingHabit = habits.find(h => h.name.toLowerCase().trim() === title.toLowerCase().trim());
          if (!matchingHabit) {
            const createdHabit = await dataService.createHabit(userId, title.trim());
            setHabits(prev => [...prev, createdHabit]);
          }
        } catch (habitErr) {
          console.error("Failed to auto-create habit for task", habitErr);
        }
      }
      
      // Reset form
      setTitle("");
      setDescription("");
      setDeadlineDate("");
      setDeadlineTime("23:59");
      setEstimatedMinutes(30);
      setPriority("medium");
      setDifficulty("medium");
      setCategory("Work");
      setMarkAsHabitInForm(false);
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

  const handleExplodeTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setExplodingTaskId(taskId);
    setActionSuccess("");
    setActionError("");
    try {
      const res = await fetch("/api/ai-explode-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: task.title, description: task.description })
      });
      const data = await res.json();
      if (data.subtasks && Array.isArray(data.subtasks)) {
        const formattedSubtasks = data.subtasks.map((st: any, i: number) => {
          const titleStr = typeof st === "string" ? st : `${st?.title || ""}${st?.estimated_minutes ? ` (${st.estimated_minutes}m)` : ""}`;
          return {
            id: i.toString(),
            title: titleStr,
            completed: false
          };
        });
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: formattedSubtasks } : t));
        try {
          await dataService.updateTask(userId, taskId, { subtasks: formattedSubtasks });
        } catch (e) {
          console.warn("Supabase persistence omitted for subtasks, using React local memory:", e);
        }
        setActionSuccess(`Successfully exploded "${task.title}" into micro-steps!`);
      } else {
        setActionError("The AI didn't return any subtasks. Try again!");
      }
    } catch (err) {
      setActionError("Failed to connect to the Exploder service.");
    } finally {
      setExplodingTaskId(null);
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t));
    try {
      await dataService.updateTask(userId, taskId, { subtasks: updatedSubtasks });
    } catch (e) {
      console.warn("Supabase persistence failed for subtasks, using local state:", e);
    }
  };

  const handleGenerateAcademicStrategy = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setRoadmappingTaskId(taskId);
    setActionSuccess("");
    setActionError("");
    try {
      const res = await fetch("/api/ai-generate-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: task.title, 
          description: task.description,
          difficulty: task.difficulty,
          category: task.category
        })
      });
      const data = await res.json();
      if (data.phases && Array.isArray(data.phases)) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, academicRoadmap: data.phases } : t));
        try {
          await dataService.updateTask(userId, taskId, { academicRoadmap: data.phases });
        } catch (e) {
          console.warn("Supabase persistence omitted for roadmap, using React local memory:", e);
        }
        setActionSuccess(`Generated an exam prep learning strategy for "${task.title}"!`);
      } else {
        setActionError("The AI strategist didn't return a valid roadmap.");
      }
    } catch (err) {
      setActionError("Failed to generate strategic roadmap.");
    } finally {
      setRoadmappingTaskId(null);
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

  const handleToggleHabitForDate = async (habitId: string, dateStr: string) => {
    try {
      const habitToToggle = habits.find(h => h.id === habitId);
      if (!habitToToggle) return;
      const isCurrentlyCompleted = habitToToggle.completed_dates.includes(dateStr);
      
      const updated = await dataService.toggleHabitForDate(userId, habitId, dateStr);
      setHabits(prev => prev.map(h => h.id === habitId ? updated : h));
      
      // Auto-toggle matching task if date is today
      const todayStr = new Date().toISOString().split("T")[0];
      if (dateStr === todayStr) {
        const matchingTask = tasks.find(t => t.title.toLowerCase().trim() === habitToToggle.name.toLowerCase().trim());
        if (matchingTask) {
          const expectedStatus = !isCurrentlyCompleted ? "completed" : "pending";
          if (matchingTask.status !== expectedStatus) {
            await dataService.updateTask(userId, matchingTask.id, { 
              status: expectedStatus as any,
              completed_at: expectedStatus === "completed" ? new Date().toISOString() : null 
            });
            const updatedTask: Task = { 
              ...matchingTask, 
              status: expectedStatus as any,
              completed_at: expectedStatus === "completed" ? new Date().toISOString() : null 
            };
            setTasks(prev => prev.map(t => t.id === matchingTask.id ? updatedTask : t));
          }
        }
      }

      // If we newly checked it
      if (!isCurrentlyCompleted) {
        if (updated.streak === 3 || updated.streak === 7) {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#FF6B4A", "#4CAF82", "#FFD700", "#3B82F6"]
          });
          setCelebration({
            show: true,
            habitName: updated.name,
            days: updated.streak
          });
          
          setTimeout(() => {
            setCelebration(prev => {
              if (prev && prev.days === updated.streak && prev.habitName === updated.name) {
                return null;
              }
              return prev;
            });
          }, 4500);
        }
      }
      
      setActionSuccess("Habit tracked! Keeping that streak alive!");
    } catch (err) {
      setActionError("Failed to toggle habit.");
    }
  };

  const handleToggleHabit = async (habitId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    await handleToggleHabitForDate(habitId, todayStr);
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
    setAiPrioritizeError(false);
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
      setAiPrioritizeError(false);
      setActionSuccess("AI Prioritization complete! Look at your curated list.");
      setActionSuccessAction({
        label: "View",
        onClick: () => {
          setActiveView("productivity");
          setProductivitySubTab("tasks");
          setFilter("ai");
        }
      });
      if (coachingMsg) {
        setPlanMantra(coachingMsg);
      }
    } catch (err: any) {
      console.error(err);
      setAiPrioritizeError(true);
      setActionError("Failed to reach Gemini AI. Please check your internet connection or verify your GEMINI_API_KEY.");
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
    setAiPlanningError(false);
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

      setAiPlanningError(false);
      setActionSuccess("Your personalized daily plan, recommendations, and risk tips are ready!");
      setActionSuccessAction({
        label: "View",
        onClick: () => {
          setActiveView("productivity");
          setProductivitySubTab("schedule");
        }
      });
    } catch (err) {
      console.error(err);
      setAiPlanningError(true);
      setActionError("Failed to design your daily schedule. Gemini might be sleeping. Let's try again!");
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

  const parseTimeStr = (timeStr: string): { hour: number; minute: number } | null => {
    if (!timeStr) return null;
    const match = timeStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return null;
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && hour < 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return { hour, minute };
  };

  const get7DayWindow = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const singleChar = label.substring(0, 1);
      days.push({ dateStr, label, singleChar });
    }
    return days;
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
    const searchLower = searchQuery.toLowerCase().trim();
    let result = tasks;

    // Apply text search
    if (searchLower) {
      result = result.filter(t => 
        t.title.toLowerCase().includes(searchLower) || 
        (t.description && t.description.toLowerCase().includes(searchLower)) ||
        t.category.toLowerCase().includes(searchLower)
      );
    }

    if (filter === "pending") return result.filter(t => t.status === "pending");
    if (filter === "completed") return result.filter(t => t.status === "completed");
    if (filter === "ai") {
      // Sort tasks by momentumCategory priority: Critical first, then Important, then Malleable
      const categoryOrder = {
        "Critical: Do Now": 1,
        "Important: Next": 2,
        "Malleable: Squeeze In": 3,
        "undefined": 4
      };
      return [...result].sort((a, b) => {
        const orderA = categoryOrder[a.momentumCategory || "undefined"];
        const orderB = categoryOrder[b.momentumCategory || "undefined"];
        return orderA - orderB;
      });
    }
    return result;
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
      urgencyClass = "text-white bg-[#EF4444]";
      urgencyLabel = "OVERDUE";
    } else if (diffHours < 3) {
      urgencyClass = "text-white bg-[#F59E0B] animate-pulse";
      urgencyLabel = "DUE SOON";
    } else if (diffHours < 24) {
      urgencyClass = "text-[#111827] bg-[#F59E0B]/20 border border-[#F59E0B]/40";
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

  const handleCreateQuickHabit = async (name: string) => {
    try {
      const created = await dataService.createHabit(userId, name.trim());
      setHabits(prev => [...prev, created]);
      setActionSuccess(`Preset Habit "${name}" registered!`);
    } catch (err) {
      setActionError("Failed to record habit.");
    }
  };

  const dashboardBg = "bg-gradient-to-b from-[#FAF9FD] via-[#F3F0FA] to-[#FAF9FD] text-[#1F2937]";
  const cardBg = "bg-white/80 backdrop-blur-md border-[#ECECF5]/80 text-[#1F2937] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)]";
  const textPrimary = "text-[#1F2937]";
  const textSecondary = "text-[#5F6B7A]";
  const borderCol = "border-[#ECECF5]";

  return (
    <div className={`min-h-screen ${dashboardBg} flex font-sans relative transition-colors duration-200`}>
      
      {/* Onboarding walkthrough overlays */}
      {walkthroughStep !== null && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white p-7 max-w-sm rounded-2xl border border-gray-200 shadow-xl text-center relative animate-fade-in text-gray-800">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            
            {walkthroughStep === 1 && (
              <>
                <h3 className="font-outfit text-xl font-bold mb-2 text-[#111827]">1. Add your tasks</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-semibold mb-6">
                  Add high-stakes items with deadlines and estimated effort here. Our clean design lets you quickly catalog everything that's stressing you.
                </p>
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => setWalkthroughStep(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 font-bold"
                  >
                    Skip guide
                  </button>
                  <button 
                    onClick={() => setWalkthroughStep(2)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Next Step
                  </button>
                </div>
              </>
            )}

            {walkthroughStep === 2 && (
              <>
                <h3 className="font-outfit text-xl font-bold mb-2 text-[#111827]">2. Ask AI to prioritize</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-semibold mb-6">
                  Click 'AI Assist' in the top header or 'Curate AI Priorities' on your dashboard. Gemini will rank your tasks using a smart custom stress matrix.
                </p>
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => setWalkthroughStep(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 font-bold"
                  >
                    Skip guide
                  </button>
                  <button 
                    onClick={() => setWalkthroughStep(3)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Next Step
                  </button>
                </div>
              </>
            )}

            {walkthroughStep === 3 && (
              <>
                <h3 className="font-outfit text-xl font-bold mb-2 text-[#111827]">3. Generate focus plan</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-semibold mb-6">
                  Request a daily focus schedule with automated micro-advice, buffers, and study breaks to safeguard your mental energy.
                </p>
                <div className="flex justify-center">
                  <button 
                    onClick={() => setWalkthroughStep(null)}
                    className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Got it, let's start!
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Fixed, Collapsible Left Sidebar */}
      <Sidebar 
        activeView={activeView}
        setActiveView={setActiveView}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        pendingRescueCount={tasks.filter(t => t.status !== 'completed').length}
        isDarkTheme={isDarkTheme}
        onLogout={onLogout}
        onTriggerHelp={() => setWalkthroughStep(1)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 min-h-screen flex flex-col transition-all duration-500 ease-in-out ${isSidebarCollapsed ? "pl-20" : "pl-64"}`}>
        
        {/* Top Header */}
        <Header 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isDarkTheme={isDarkTheme}
          setIsDarkTheme={setIsDarkTheme}
          notifications={notifications}
          onTriggerPrioritize={handleAIPrioritisation}
          onTriggerGeneratePlan={handleAIGeneratePlan}
          aiPrioritizing={aiPrioritizing}
          aiPlanning={aiPlanning}
          userId={userId}
          userEmail={userEmail}
          onLogout={onLogout}
          onNavigate={onNavigate}
          onSelectView={setActiveView}
        />

        {/* Inner Content Workspace */}
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* Action Feedback Alerts */}
          {actionError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/35 rounded-2xl text-rose-500 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{actionError}</span>
              <button onClick={() => setActionError("")} className="ml-auto text-[10px] uppercase font-bold hover:opacity-85">Dismiss</button>
            </div>
          )}

          {actionSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/35 rounded-2xl text-emerald-500 text-xs font-bold flex items-center justify-between gap-3 animate-fade-in" id="dashboard-success-alert">
              <div className="flex items-center gap-2">
                <Check className="w-4.5 h-4.5 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {actionSuccessAction ? (
                  <button 
                    onClick={() => {
                      actionSuccessAction.onClick();
                      setActionSuccess("");
                    }} 
                    className="px-3.5 py-2 bg-[#22C55E] text-white hover:bg-[#16A34A] rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer select-none flex items-center gap-1"
                    id="success-action-btn"
                  >
                    {actionSuccessAction.label}
                  </button>
                ) : (
                  <button 
                    onClick={() => setActionSuccess("")} 
                    className="text-[10px] uppercase font-black tracking-wide text-emerald-600/70 hover:text-emerald-600 transition-colors cursor-pointer"
                    id="success-dismiss-btn"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Back Button for non-dashboard views */}
          {activeView !== "dashboard" && (
            <div className="flex items-center pb-2 animate-fade-in">
              <button 
                onClick={handleGoBack}
                className={`inline-flex items-center gap-2 px-4 py-2.5 ${
                  isDarkTheme 
                    ? 'bg-[#1E293B] border-slate-700 text-slate-200 hover:text-[#7C8CFF] hover:border-[#7C8CFF]/50' 
                    : 'bg-white border-[#ECECF5] text-gray-700 hover:text-[#5B6CFF] hover:border-[#5B6CFF]/30'
                } border text-xs font-bold rounded-xl shadow-xs transition-all hover:bg-[#5B6CFF]/5 active:scale-95 cursor-pointer select-none group`}
                id="back-to-previous-btn"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                <span>Back</span>
              </button>
            </div>
          )}

          {/* VIEW: 1. DASHBOARD OVERVIEW */}
          {activeView === "dashboard" && (
            <div className="space-y-6">
              
              {/* Premium Welcome Header Card */}
              <div className="p-8 rounded-[24px] border border-[#ECECF5] bg-gradient-to-br from-[#EEF2FF]/80 via-white to-[#FAF9FD] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
                <div className="space-y-3 relative z-10 max-w-xl text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2FF] text-[#5B6CFF] text-[11px] font-bold uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Focus State active</span>
                  </div>
                  
                  <h2 className="font-outfit text-4xl font-extrabold tracking-tight text-[#1F2937]">
                    Hello, <span className="text-[#5B6CFF]">{profileName || userEmail.split("@")[0]}</span>! 👋
                  </h2>
                  <p className="text-[15px] text-[#5F6B7A] font-medium leading-relaxed">
                    You have <span className="text-[#5B6CFF] font-bold">{tasks.filter(t => t.status !== 'completed').length} pending</span> items and <span className="text-[#10B981] font-bold">{habits.filter(isHabitDoneToday).length} habits</span> locked in today.
                  </p>
                  <p className="text-[15px] text-[#5F6B7A] font-medium leading-relaxed">
                    Use AI priorities to reduce anxiety.
                  </p>
                  
                  <div className="flex flex-wrap gap-2.5 pt-4 justify-center md:justify-start">
                    <button
                      disabled={aiPrioritizing}
                      onClick={handleAIPrioritisation}
                      className="px-5 py-3 bg-[#5B6CFF] hover:bg-[#4758E8] text-white text-[14px] font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all duration-250 hover:scale-[1.01] disabled:opacity-55 shadow-sm"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>{aiPrioritizing ? "Prioritizing..." : "Curate AI Priorities"}</span>
                    </button>
                    <button
                      disabled={aiPlanning}
                      onClick={handleAIGeneratePlan}
                      className="px-5 py-3 border border-[#ECECF5] bg-white hover:bg-[#FAF9FD] text-[#5F6B7A] text-[14px] font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all duration-250 hover:scale-[1.01] disabled:opacity-55 shadow-sm"
                    >
                      <Calendar className="w-4 h-4 text-[#5F6B7A]" />
                      <span>Focus Schedule</span>
                    </button>
                  </div>
                </div>

                {/* SVG Momentum Ring right side of header */}
                <div className="shrink-0 relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      stroke="#EEF0F8"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      stroke="#5B6CFF"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={2 * Math.PI * 54 * (1 - taskCompletionPercent / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="font-outfit text-[32px] font-extrabold text-[#1F2937] leading-none block">
                      {taskCompletionPercent}%
                    </span>
                    <span className="text-[10px] text-[#5F6B7A] font-bold uppercase tracking-wider block mt-1">
                      Momentum
                    </span>
                  </div>
                </div>
              </div>

              {/* Most Urgent Reminder Banner */}
              {mostUrgentTask && (
                <div className="p-6 rounded-[24px] border border-red-100 bg-[#FFF5F5] text-[#1F2937] flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
                  <div className="flex items-start gap-4 relative z-10 w-full md:w-auto">
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-[#FFEBEB] text-[#EF4444] flex items-center justify-center shadow-xs">
                      <AlertCircle className="w-6 h-6 stroke-[2.5] animate-pulse" />
                    </div>
                    <div className="space-y-1 w-full">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-500 uppercase tracking-widest bg-red-100/50 px-2.5 py-0.5 rounded-md">
                          🔥 Critical Target
                        </span>
                        <span className="text-xs text-[#5F6B7A] font-semibold">
                          Due: {formatDeadline(mostUrgentTask.deadline).formatted}
                        </span>
                      </div>
                      <h4 className="font-outfit text-[16px] font-extrabold text-[#1F2937] mt-1.5">
                        {mostUrgentTask.title}
                      </h4>
                      <p className="text-[13px] text-[#5F6B7A] italic font-medium leading-relaxed mt-1 flex items-center gap-1">
                        💡 {mostUrgentTask.aiTip || "Let's break this task into micro-steps. Just spend 5 minutes on it to build immediate momentum!"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleTaskStatus(mostUrgentTask.id)}
                    className="w-full md:w-auto px-6 py-3 bg-[#EF4444] hover:bg-[#DC2626] text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-250 hover:scale-[1.01] shrink-0 shadow-sm"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Defuse Target</span>
                  </button>
                </div>
              )}

              {/* Bento-Grid metrics */}
              {(() => {
                const totalTasksCount = tasks.length;
                const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
                const taskProgress = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

                const habitsCount = habits.length;
                const completedHabitsCount = habits.filter(isHabitDoneToday).length;
                const habitsProgress = habitsCount > 0 ? (completedHabitsCount / habitsCount) * 100 : 0;

                const overdueCount = tasks.filter(t => t.status !== 'completed' && new Date(t.deadline).getTime() < new Date().getTime()).length;
                const overdueProgress = overdueCount > 0 ? 100 : 0;

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Pending targets metric */}
                    <div className="bg-white/75 backdrop-blur-md p-6 border border-[#ECECF5] rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between hover:-translate-y-1 hover:border-[#5B6CFF] hover:shadow-[0_12px_30px_rgba(91,108,255,0.08)] transition-all duration-300 ease-in-out">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 bg-[#EEF2FF] text-[#5B6CFF] rounded-xl flex items-center justify-center shrink-0">
                            <Zap className="w-5 h-5 fill-current" />
                          </span>
                          <span className="text-[11px] font-extrabold text-[#5F6B7A] uppercase tracking-wider">Workload Target</span>
                        </div>
                        <h3 className="font-outfit text-4xl font-extrabold text-[#5B6CFF] mt-3 mb-1 tabular-nums">
                          {tasks.filter(t => t.status !== 'completed').length}
                        </h3>
                        <p className="text-[12px] font-semibold text-[#5F6B7A]">Pending registered tasks</p>
                      </div>
                      <div className="h-1 bg-[#ECECF5] rounded-full mt-4 w-full relative overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full bg-[#5B6CFF] rounded-full transition-all duration-500" 
                          style={{ width: `${taskProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Habits Streak Metric */}
                    <div className="bg-white/75 backdrop-blur-md p-6 border border-[#ECECF5] rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between hover:-translate-y-1 hover:border-[#10B981] hover:shadow-[0_12px_30px_rgba(16,185,129,0.08)] transition-all duration-300 ease-in-out">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 bg-[#E8FBF2] text-[#10B981] rounded-xl flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5" />
                          </span>
                          <span className="text-[11px] font-extrabold text-[#5F6B7A] uppercase tracking-wider">Energy Habits</span>
                        </div>
                        <h3 className="font-outfit text-4xl font-extrabold text-[#10B981] mt-3 mb-1 tabular-nums">
                          {habits.filter(isHabitDoneToday).length}/{habits.length}
                        </h3>
                        <p className="text-[12px] font-semibold text-[#5F6B7A]">Completed checks today</p>
                      </div>
                      <div className="h-1 bg-[#ECECF5] rounded-full mt-4 w-full relative overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full bg-[#10B981] rounded-full transition-all duration-500" 
                          style={{ width: `${habitsProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Overdue Items Alert */}
                    <div className="bg-white/75 backdrop-blur-md p-6 border border-[#ECECF5] rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between hover:-translate-y-1 hover:border-[#EF4444] hover:shadow-[0_12px_30px_rgba(239,68,68,0.08)] transition-all duration-300 ease-in-out">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 bg-[#FFF0F0] text-[#EF4444] rounded-xl flex items-center justify-center shrink-0">
                            <AlertCircle className="w-5 h-5" />
                          </span>
                          <span className="text-[11px] font-extrabold text-[#5F6B7A] uppercase tracking-wider">Overdue Danger</span>
                        </div>
                        <h3 className="font-outfit text-4xl font-extrabold text-[#EF4444] mt-3 mb-1 tabular-nums">
                          {tasks.filter(t => t.status !== 'completed' && new Date(t.deadline).getTime() < new Date().getTime()).length}
                        </h3>
                        <p className="text-[12px] font-semibold text-[#5F6B7A]">Critical rescue tasks</p>
                      </div>
                      <div className="h-1 bg-[#ECECF5] rounded-full mt-4 w-full relative overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full bg-[#EF4444] rounded-full transition-all duration-500" 
                          style={{ width: `${overdueProgress}%` }}
                        />
                      </div>
                    </div>

                  </div>
                );
              })()}

              {/* Next Up Quick Checklist */}
              <div className="bg-white/75 backdrop-blur-md p-6 border border-[#ECECF5] rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-4">
                <h4 className="font-outfit font-extrabold text-[15px] text-[#1F2937] flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Closest Rescue Targets</span>
                </h4>
                <div className="space-y-1">
                  {tasks.filter(t => t.status !== 'completed').slice(0, 3).length === 0 ? (
                    <p className="text-[14px] font-semibold text-[#5F6B7A] py-2">All tasks completed. Great job!</p>
                  ) : (
                    tasks.filter(t => t.status !== 'completed').slice(0, 3).map((t) => (
                      <div key={t.id} className="flex items-center justify-between border-b border-[#ECECF5]/60 py-3.5 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleToggleTaskStatus(t.id)} 
                            className="text-[#D1D5DB] hover:text-[#5B6CFF] cursor-pointer transition-colors"
                          >
                            <Circle className="w-5.5 h-5.5" />
                          </button>
                          <span className="text-[14px] font-semibold text-[#1F2937]">{t.title}</span>
                        </div>
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[#FFFBEB] text-[#D97706] uppercase tracking-wider shrink-0">
                          {formatDeadline(t.deadline).formatted.toUpperCase()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* VIEW: 2. PRODUCTIVITY HUB */}
          {activeView === "productivity" && (
            <ProductivityHub 
              productivitySubTab={productivitySubTab}
              setProductivitySubTab={setProductivitySubTab}
              tasks={tasks}
              habits={habits}
              currentPlan={currentPlan}
              recommendations={recommendations}
              planMantra={planMantra}
              filter={filter}
              setFilter={setFilter}
              showAddForm={showAddForm}
              setShowAddForm={setShowAddForm}
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              deadlineDate={deadlineDate}
              setDeadlineDate={setDeadlineDate}
              deadlineTime={deadlineTime}
              setDeadlineTime={setDeadlineTime}
              estimatedMinutes={estimatedMinutes}
              setEstimatedMinutes={setEstimatedMinutes}
              priority={priority}
              setPriority={setPriority}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              category={category}
              setCategory={setCategory}
              markAsHabitInForm={markAsHabitInForm}
              setMarkAsHabitInForm={setMarkAsHabitInForm}
              newHabitName={newHabitName}
              setNewHabitName={setNewHabitName}
              showHabitForm={showHabitForm}
              setShowHabitForm={setShowHabitForm}
              isListening={isListening}
              toggleListening={toggleListening}
              speechFeedback={speechFeedback}
              handleCreateTask={handleCreateTask}
              handleToggleTaskStatus={handleToggleTaskStatus}
              handleDeleteTask={handleDeleteTask}
              handleCreateHabit={handleCreateHabit}
              handleCreateQuickHabit={handleCreateQuickHabit}
              handleToggleHabitDay={(habit) => handleToggleHabit(habit.id)}
              handleDeleteHabit={handleDeleteHabit}
              handleAIGeneratePlan={handleAIGeneratePlan}
              aiPlanning={aiPlanning}
              isDarkTheme={isDarkTheme}
              searchQuery={searchQuery}
              formatDeadline={formatDeadline}
              onExplodeTask={handleExplodeTask}
              onToggleSubtask={handleToggleSubtask}
              onGenerateAcademicStrategy={handleGenerateAcademicStrategy}
              explodingTaskId={explodingTaskId}
              roadmappingTaskId={roadmappingTaskId}
            />
          )}

          {/* VIEW: 3. MOMENTUM ANALYTICS */}
          {activeView === "momentum" && (() => {
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.status === "completed").length;
            const pendingTasksCount = totalTasks - completedTasks;
            
            const highStakesCount = tasks.filter(t => t.priority === "high").length;
            const mediumStakesCount = tasks.filter(t => t.priority === "medium").length;
            const lowStakesCount = tasks.filter(t => t.priority === "low").length;
            
            const hardCount = tasks.filter(t => t.difficulty === "hard").length;
            const medDiffCount = tasks.filter(t => t.difficulty === "medium").length;
            const easyCount = tasks.filter(t => t.difficulty === "easy").length;
            
            const totalHabits = habits.length;
            const activeHabitStreaksMax = habits.length > 0 ? Math.max(...habits.map(h => h.streak), 0) : 0;
            const totalHabitCompletions = habits.reduce((acc, h) => acc + (h.completed_dates?.length || 0), 0);
            const pendingMinutesLeft = pendingTasks.reduce((acc, t) => acc + (t.estimated_minutes || 0), 0);
            
            return (
              <div className="space-y-8 animate-fade-in text-[#1F2937]">
                
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ECECF5] pb-5">
                  <div>
                    <h2 className="font-outfit font-extrabold text-2xl tracking-tight text-[#1F2937] flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-[#5B6CFF]" />
                      <span>Victory Momentum Hub</span>
                    </h2>
                    <p className="text-[13px] text-[#5F6B7A] font-semibold">Real-time consistency logs, burnout metrics, and cognitive capacity analysis</p>
                  </div>
                </div>

                {/* Main Split Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Progress Ring & Capacity Analysis */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Ring Card */}
                    <div className="bg-white/75 backdrop-blur-md border border-[#ECECF5] rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col items-center text-center relative overflow-hidden group hover:border-[#5B6CFF]/30 transition-all duration-300">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#5B6CFF] to-[#8B5CF6]" />
                      
                      <h3 className="font-outfit font-extrabold text-[15px] text-[#1F2937] mb-6 flex items-center gap-1.5">
                        <Activity className="w-4.5 h-4.5 text-[#5B6CFF]" />
                        <span>Consistency Flow Index</span>
                      </h3>
                      
                      <div className="relative w-44 h-44 flex items-center justify-center mb-6">
                        {/* Glow effect in background */}
                        <div className="absolute inset-4 rounded-full bg-[#5B6CFF]/5 blur-xl group-hover:bg-[#5B6CFF]/10 transition-all duration-300" />
                        
                        <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 192 192">
                          <circle
                            cx="96"
                            cy="96"
                            r="82"
                            stroke="#F1F3FA"
                            strokeWidth="11"
                            fill="transparent"
                          />
                          <circle
                            cx="96"
                            cy="96"
                            r="82"
                            stroke="url(#momentumGradient)"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 82}
                            strokeDashoffset={2 * Math.PI * 82 * (1 - taskCompletionPercent / 100)}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                          <defs>
                            <linearGradient id="momentumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#5B6CFF" />
                              <stop offset="100%" stopColor="#4F46E5" />
                            </linearGradient>
                          </defs>
                        </svg>
                        
                        <div className="absolute text-center z-20">
                          <span className="font-outfit text-4xl font-black text-[#5B6CFF] tracking-tight tabular-nums">
                            {taskCompletionPercent}%
                          </span>
                          <p className="text-[10px] text-[#5F6B7A] font-black uppercase tracking-widest mt-1">Flow Ratio</p>
                        </div>
                      </div>

                      <div className="space-y-3.5 max-w-xs">
                        <p className="text-xs font-bold text-[#5F6B7A] leading-relaxed">
                          {taskCompletionPercent === 100 
                            ? "Perfect absolute victory! Every registered deadline has been completed. You are legendary." 
                            : "Maintain continuous flow. Break big frozen chunks down to keep this ring burning."}
                        </p>
                        
                        {/* Progress mini indicator */}
                        <div className="flex items-center justify-center gap-1.5 text-[11px] font-black text-[#5B6CFF] bg-[#5B6CFF]/5 border border-[#5B6CFF]/10 py-1.5 px-3.5 rounded-xl">
                          <Flame className="w-3.5 h-3.5 text-orange-500 fill-current" />
                          <span>{completedTasks} / {totalTasks} Deadlines Cleared</span>
                        </div>
                      </div>
                    </div>

                    {/* Workload Profile Breakdown */}
                    <div className="bg-white/75 backdrop-blur-md border border-[#ECECF5] rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-4 hover:border-[#5B6CFF]/30 transition-all duration-300">
                      <h4 className="font-outfit font-extrabold text-[14px] text-[#1F2937] flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-[#5B6CFF]" />
                        <span>Workload Stress Profile</span>
                      </h4>
                      
                      <div className="space-y-4">
                        {/* Stakes Breakdown */}
                        <div>
                          <div className="flex justify-between text-[11px] font-bold text-[#5F6B7A] mb-1.5">
                            <span>Stakes Risk Distribution</span>
                            <span className="text-red-500 font-extrabold">{highStakesCount} Critical</span>
                          </div>
                          <div className="h-2.5 w-full bg-[#F1F3FA] rounded-full overflow-hidden flex">
                            <div 
                              style={{ width: `${totalTasks > 0 ? (highStakesCount / totalTasks) * 100 : 0}%` }} 
                              className="bg-red-500 transition-all duration-500" 
                              title="High Stakes"
                            />
                            <div 
                              style={{ width: `${totalTasks > 0 ? (mediumStakesCount / totalTasks) * 100 : 0}%` }} 
                              className="bg-amber-500 transition-all duration-500" 
                              title="Medium Stakes"
                            />
                            <div 
                              style={{ width: `${totalTasks > 0 ? (lowStakesCount / totalTasks) * 100 : 0}%` }} 
                              className="bg-[#5B6CFF] transition-all duration-500" 
                              title="Low Stakes"
                            />
                          </div>
                          <div className="flex gap-3 mt-1.5 text-[10px] font-black text-[#5F6B7A]">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> {highStakesCount} High</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> {mediumStakesCount} Med</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#5B6CFF] rounded-full" /> {lowStakesCount} Low</span>
                          </div>
                        </div>

                        {/* Difficulty Breakdown */}
                        <div>
                          <div className="flex justify-between text-[11px] font-bold text-[#5F6B7A] mb-1.5">
                            <span>Inherent Difficulty Curve</span>
                            <span className="text-indigo-600 font-extrabold">{hardCount} Hard Tasks</span>
                          </div>
                          <div className="h-2.5 w-full bg-[#F1F3FA] rounded-full overflow-hidden flex">
                            <div 
                              style={{ width: `${totalTasks > 0 ? (hardCount / totalTasks) * 100 : 0}%` }} 
                              className="bg-purple-600 transition-all duration-500" 
                              title="Hard"
                            />
                            <div 
                              style={{ width: `${totalTasks > 0 ? (medDiffCount / totalTasks) * 100 : 0}%` }} 
                              className="bg-blue-500 transition-all duration-500" 
                              title="Medium"
                            />
                            <div 
                              style={{ width: `${totalTasks > 0 ? (easyCount / totalTasks) * 100 : 0}%` }} 
                              className="bg-emerald-500 transition-all duration-500" 
                              title="Easy"
                            />
                          </div>
                          <div className="flex gap-3 mt-1.5 text-[10px] font-black text-[#5F6B7A]">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-purple-600 rounded-full" /> {hardCount} Hard</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> {medDiffCount} Medium</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> {easyCount} Easy</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Bento Stats Grid & Burnout Advisory */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Urgent Target Focus */}
                      <div className="bg-white/75 backdrop-blur-md border border-[#ECECF5] rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-3 hover:border-[#5B6CFF]/30 transition-all duration-300 flex flex-col justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                            <span>Urgent Target Focus</span>
                          </p>
                          {mostUrgentTask ? (
                            <div className="space-y-1 pt-1">
                              <h4 className="font-outfit font-extrabold text-[13.5px] text-[#1F2937] leading-snug line-clamp-2">
                                {mostUrgentTask.title}
                              </h4>
                              <p className="text-[11px] text-[#5F6B7A] font-semibold flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>Due: {new Date(mostUrgentTask.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-[#5F6B7A] font-semibold pt-1">No urgent deadlines pending. All caught up!</p>
                          )}
                        </div>
                        {mostUrgentTask && (
                          <div className="flex gap-1.5 pt-1">
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100 uppercase tracking-wide">
                              {mostUrgentTask.priority} Stakes
                            </span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#5B6CFF]/5 text-[#5B6CFF] border border-[#5B6CFF]/10 uppercase tracking-wide">
                              {mostUrgentTask.category}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Habits Consistency */}
                      <div className="bg-white/75 backdrop-blur-md border border-[#ECECF5] rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-3 hover:border-[#5B6CFF]/30 transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-black text-[#5B6CFF] uppercase tracking-widest flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5 text-amber-500" />
                            <span>Habit Streaks</span>
                          </p>
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <div>
                              <span className="text-xs font-bold text-[#5F6B7A] block">Max Streak</span>
                              <span className="text-lg font-black text-[#1F2937] font-mono flex items-center gap-1">
                                <Flame className="w-4.5 h-4.5 text-orange-500 fill-current" />
                                {activeHabitStreaksMax}d
                              </span>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-[#5F6B7A] block">Total Logs</span>
                              <span className="text-lg font-black text-[#1F2937] font-mono">
                                {totalHabitCompletions}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] font-semibold text-[#5F6B7A]">
                          Streaks from {totalHabits} configured habits
                        </p>
                      </div>

                      {/* Estimated Work Remaining */}
                      <div className="bg-white/75 backdrop-blur-md border border-[#ECECF5] rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-2 hover:border-[#5B6CFF]/30 transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-black text-[#5B6CFF] uppercase tracking-widest flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#5B6CFF]" />
                            <span>Pending Focus Block</span>
                          </p>
                          <div className="pt-1.5">
                            <span className="text-2xl font-black text-[#1F2937] font-mono">
                              {pendingMinutesLeft}
                            </span>
                            <span className="text-xs text-[#5F6B7A] font-bold ml-1">minutes</span>
                          </div>
                        </div>
                        <p className="text-[10px] font-semibold text-[#5F6B7A]">
                          Required focus for {pendingTasksCount} remaining targets
                        </p>
                      </div>

                      {/* Overall Efficiency Ratio */}
                      <div className="bg-white/75 backdrop-blur-md border border-[#ECECF5] rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-2 hover:border-[#5B6CFF]/30 transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-black text-[#5B6CFF] uppercase tracking-widest flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 text-[#5B6CFF]" />
                            <span>Sustained Routine Index</span>
                          </p>
                          <div className="pt-1.5">
                            <span className="text-2xl font-black text-[#1F2937] font-mono">
                              {totalHabits > 0 ? Math.round((habits.filter(h => h.streak > 0).length / totalHabits) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] font-semibold text-[#5F6B7A]">
                          Ratio of actively sustained habits in routine
                        </p>
                      </div>
                    </div>

                    {/* Stress Mitigation Advice Panel */}
                    <div className="bg-gradient-to-br from-[#EEF2FF] via-white/80 to-[#FAF9FD] border border-[#ECECF5] rounded-3xl p-6.5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-[0.03] select-none">
                        <Sparkles className="w-24 h-24 text-indigo-500" />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#5B6CFF]/10 text-[#5B6CFF] rounded-lg">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-outfit font-extrabold text-[15px] text-[#1F2937]">Gemini Anti-Burnout Suggestions</h4>
                          <p className="text-[11px] font-semibold text-[#5F6B7A]">Personalized stress-mitigation advice compiled from your targets</p>
                        </div>
                      </div>

                      {recommendations.length > 0 ? (
                        <ul className="space-y-3 relative z-10">
                          {recommendations.map((rec, i) => (
                            <li 
                              key={i} 
                              className="text-xs font-semibold text-[#1F2937] flex items-start gap-3 bg-white border border-slate-100 p-3.5 rounded-2xl hover:translate-x-1 transition-all duration-200 hover:shadow-xs"
                            >
                              <span className="text-[#5B6CFF] text-base select-none mt-0.5">•</span>
                              <span className="leading-relaxed">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="bg-white/60 border border-slate-100 p-5 rounded-2xl text-center">
                          <Sparkles className="w-8 h-8 text-[#5B6CFF]/30 mx-auto mb-2" />
                          <p className="text-xs font-bold text-[#1F2937]">No burnout risks detected!</p>
                          <p className="text-[11px] font-semibold text-[#5F6B7A] mt-1">Your workload parameters look perfectly safe. Maintain standard micro-breaks to preserve cognitive energy.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* VIEW: 4. RESCUE STATION */}
          {activeView === "rescue" && (
            <RescueStation 
              tasks={tasks}
              extensionDrafts={extensionDrafts}
              loadingDrafts={loadingDrafts}
              copiedDrafts={copiedDrafts}
              aiDraftError={aiDraftError}
              handleGenerateExtensionDraft={handleGenerateExtensionDraft}
              handleCopyDraft={handleCopyDraft}
              handleToggleTaskStatus={handleToggleTaskStatus}
              isDarkTheme={isDarkTheme}
            />
          )}

          {/* VIEW: 5. AI COACH CHAT */}
          {activeView === "coach" && (
            <AICoachChat 
              chatMessages={chatMessages}
              currentChatMessage={currentChatMessage}
              setCurrentChatMessage={setCurrentChatMessage}
              onSendChatMessage={handleSendChatMessage}
              coachChatLoading={coachChatLoading}
              isDarkTheme={isDarkTheme}
              selectedRole={coachRole}
              onRoleChange={setCoachRole}
              tasks={tasks}
              habits={habits}
              taskCompletionPercent={taskCompletionPercent}
            />
          )}

          {/* VIEW: 6. PROFILE TAB */}
          {activeView === "profile" && (
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in" id="profile-container">
              
              {/* Hero Profile Card & Momentum Score Side-by-Side */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="profile-top-panel">
                
                {/* Hero Profile Card (lg:col-span-8) */}
                <div className="lg:col-span-8 relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#FAE8FF] p-8 text-[#1F2937] border border-[#E2E8F0] shadow-xs flex flex-col justify-between min-h-[200px]">
                  {/* Soft floating sparkle/star decorations matching the reference image */}
                  <div className="absolute top-4 left-6 text-indigo-300 opacity-40 pointer-events-none">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="absolute top-1/2 right-6 text-purple-300 opacity-40 pointer-events-none">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="absolute bottom-4 left-1/3 text-pink-300 opacity-40 pointer-events-none">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 w-full">
                    {/* Large Circular Avatar with dual-ring design & green online dot */}
                    <div className="relative shrink-0">
                      <div className="w-24 h-24 rounded-full border border-indigo-100 flex items-center justify-center p-1 bg-gradient-to-tr from-[#C084FC] via-[#818CF8] to-[#60A5FA] bg-opacity-20 shadow-xs">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-1">
                          <div className="w-full h-full rounded-full bg-[#3B82F6] flex items-center justify-center font-outfit text-2xl font-black text-white uppercase tracking-tight shadow-md">
                            {profileName ? profileName.slice(0, 2) : userEmail.slice(0, 2)}
                          </div>
                        </div>
                      </div>
                      {/* Pulsing online indicator green dot */}
                      <div className="absolute bottom-1 right-2 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs z-20">
                        <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                      </div>
                    </div>
 
                    {/* Profile details */}
                    <div className="space-y-3.5 text-center sm:text-left flex-1 w-full">
                      <div className="space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-start gap-1.5">
                          <span className="text-[24px] text-[#1F2937] font-medium">Hello,</span>
                          <span className="text-[24px] text-[#1F2937] font-extrabold">{profileName || "Anonymous Saver"}</span>
                          <span className="text-[24px] animate-bounce">👋</span>
                        </div>
                        
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-[#5F6B7A] text-[14px] font-semibold mt-1">
                          <span>{userEmail}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(userEmail);
                              setEmailCopied(true);
                              setTimeout(() => setEmailCopied(false), 2000);
                            }}
                            className="p-1 rounded-md hover:bg-white text-[#3B82F6] hover:text-[#2563EB] transition-all cursor-pointer relative"
                            title="Copy email to clipboard"
                          >
                            {emailCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            {emailCopied && (
                              <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black text-white text-[10px] rounded shadow font-sans whitespace-nowrap z-30">
                                Copied!
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
 
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className="px-3 py-1 text-[10px] font-extrabold rounded-full bg-indigo-100 text-[#4F46E5] font-mono uppercase tracking-wider">
                          MITIGATION FORCE · {
                            tasks.filter(t => t.status === "completed").length >= 5 ? (
                              "LEVEL 3 (CRISIS MASTER)"
                            ) : tasks.filter(t => t.status === "completed").length >= 2 ? (
                              "LEVEL 2 (ACTIVE RESCUER)"
                            ) : (
                              "LEVEL 1 (ROOKIE DEFUSER)"
                            )
                          }
                        </span>
                      </div>
                      
                      <p className="text-[13px] text-[#5F6B7A] font-medium italic mt-4">
                        "{bio || "Small steps today, unstoppable tomorrow."}"
                      </p>
                    </div>
                  </div>
                </div>
 
                {/* Momentum Score Card (lg:col-span-4) */}
                <div className="lg:col-span-4 bg-white/75 backdrop-blur-md p-6 border border-[#ECECF5] rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[200px] hover:scale-[1.01] hover:border-[#5B6CFF]/30 hover:shadow-[0_8px_30px_rgba(91,108,255,0.04)] transition-all duration-250 ease-in-out">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider">Momentum Score</p>
                  </div>
 
                  {/* Circular progress and metrics */}
                  <div className="flex items-center gap-6 py-2">
                    {/* Animated Circular Progress Ring */}
                    <div className="relative shrink-0 flex items-center justify-center">
                      <svg className="w-20 h-20 transform -rotate-90">
                        {/* Track circle */}
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="#F3F4F6"
                          strokeWidth="6"
                          fill="transparent"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="#3B82F6"
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray="201.06"
                          strokeDashoffset={201.06 - (201.06 * taskCompletionPercent) / 100}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      {/* Inner text overlay */}
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="font-outfit text-xl font-black text-[#1F2937] leading-none">{taskCompletionPercent}%</span>
                      </div>
                    </div>
 
                    <div className="space-y-2">
                      <p className="text-[14px] text-[#1F2937] font-bold leading-snug">
                        Keep building your momentum! 🚀
                      </p>
                      
                      <button
                        type="button"
                        onClick={() => setActiveView("momentum")}
                        className="text-[12px] font-extrabold text-[#3B82F6] hover:text-[#2563EB] transition-all cursor-pointer flex items-center gap-1.5 bg-[#EFF6FF] hover:bg-[#EFF6FF]/80 px-4 py-2 rounded-xl"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>View Analytics</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-2" />
                </div>
              </div>

              {/* Secondary Layout: Forms, Stats & AI Coach */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Personal Information & Motto */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Customize Identity Card */}
                  <div className={`bg-white/75 backdrop-blur-md p-6 border border-[#ECECF5] rounded-[24px] space-y-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] relative`} id="profile-editor-card">
                    <div className="flex items-center justify-between pb-3 border-b border-[#ECECF5]">
                      <div>
                        <h3 className="font-outfit text-lg font-extrabold text-[#1F2937]">
                          Customize Identity
                        </h3>
                        <p className="text-[12px] text-[#5F6B7A] font-medium mt-0.5">Update your personal details and preferences</p>
                      </div>
                      
                      {!isEditingDetails && (
                        <button
                          onClick={() => {
                            setProfileEditName(profileName);
                            setEditPhone(phone);
                            setEditOccupation(occupation);
                            setEditFocusArea(focusArea);
                            setEditBio(bio);
                            setIsEditingDetails(true);
                          }}
                          className="px-3 py-1.5 border border-[#ECECF5] hover:border-[#5B6CFF] text-[12px] text-[#5B6CFF] bg-white hover:bg-[#EEF2FF] font-bold flex items-center gap-1.5 rounded-xl transition-all cursor-pointer"
                          id="profile-edit-trigger-btn"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                        </button>
                      )}
                    </div>

                    {/* Status feedback boxes */}
                    {detailsSuccessMessage && (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-[12px] font-semibold flex items-center gap-2 animate-fade-in">
                        <Check className="w-4 h-4 shrink-0" />
                        <span>{detailsSuccessMessage}</span>
                      </div>
                    )}
                    {detailsErrorMessage && (
                      <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-[12px] font-semibold flex items-center gap-2 animate-fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{detailsErrorMessage}</span>
                      </div>
                    )}

                    {isEditingDetails ? (
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const trimmedName = profileEditName.trim();
                        if (trimmedName) {
                          setProfileUpdateLoading(true);
                          try {
                            if (isSupabaseConfigured && supabase) {
                              await supabase.auth.updateUser({ data: { full_name: trimmedName } });
                            }
                            localStorage.setItem("lifesaver_user_full_name", trimmedName);
                            setProfileName(trimmedName);
                            window.dispatchEvent(
                              new CustomEvent("profile-updated", { detail: { fullName: trimmedName } })
                            );
                          } catch (err) {
                            console.error("Name save error:", err);
                          } finally {
                            setProfileUpdateLoading(false);
                          }
                        }
                        handleUpdateDetails(e);
                      }} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-[#3B82F6]" /> Full Name
                          </label>
                          <input
                            type="text"
                            value={profileEditName}
                            onChange={(e) => setProfileEditName(e.target.value)}
                            placeholder="Enter your name..."
                            className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#3B82F6] focus:bg-white outline-none text-[13px] rounded-xl transition-all font-semibold text-[#1F2937]"
                            id="profile-fullname-input"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5 text-[#3B82F6]" /> Occupation
                            </label>
                            <input
                              type="text"
                              value={editOccupation}
                              onChange={(e) => setEditOccupation(e.target.value)}
                              placeholder="E.g. Rescuer, Student"
                              className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#3B82F6] focus:bg-white outline-none text-[13px] rounded-xl transition-all font-semibold text-[#1F2937]"
                              id="details-occupation-input"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-[#3B82F6]" /> Phone Number
                            </label>
                            <input
                              type="text"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              placeholder="E.g. +1 (555) 000-0000"
                              className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#3B82F6] focus:bg-white outline-none text-[13px] rounded-xl transition-all font-semibold text-[#1F2937]"
                              id="details-phone-input"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 text-[#3B82F6]" /> Focus Area
                          </label>
                          <select
                            value={editFocusArea}
                            onChange={(e) => setEditFocusArea(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#3B82F6] focus:bg-white outline-none text-[13px] rounded-xl transition-all font-semibold text-[#1F2937]"
                            id="details-focus-input"
                          >
                            <option value="">Select Focus Area...</option>
                            <option value="Academic (Exams & Classes)">Academic (Exams & Classes)</option>
                            <option value="Professional (Work Deadlines)">Professional (Work Deadlines)</option>
                            <option value="Personal Goals & Habits">Personal Goals & Habits</option>
                            <option value="Mixed Tasks & Projects">Mixed Tasks & Projects</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-[#3B82F6]" /> Personal Motto / Bio
                          </label>
                          <textarea
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                            placeholder="Write a motto that keeps you going..."
                            rows={2}
                            className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#3B82F6] focus:bg-white outline-none text-[13px] rounded-xl transition-all font-semibold text-[#1F2937] resize-none"
                            id="details-bio-input"
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-2 border-t border-[#E5EAF5]">
                          <button
                            type="button"
                            onClick={() => setIsEditingDetails(false)}
                            className="px-4 py-2 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#5F6B7A] text-[12px] font-bold rounded-xl transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={detailsUpdateLoading || profileUpdateLoading}
                            className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[12px] font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          >
                            {detailsUpdateLoading || profileUpdateLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" /> Save Changes
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        {/* Display Profile Fields */}
                        <div className="flex items-center gap-4 pb-3 border-b border-[#F8FAFC] last:border-0 last:pb-0">
                          <div className="w-10 h-10 rounded-full bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-wider">Full Name</span>
                            <span className="block text-[14px] font-bold text-[#1F2937] truncate mt-0.5">
                              {profileName || "Anonymous Saver"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pb-3 border-b border-[#F8FAFC] last:border-0 last:pb-0">
                          <div className="w-10 h-10 rounded-full bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-wider">Occupation</span>
                            <span className="block text-[14px] font-bold text-[#1F2937] truncate mt-0.5">
                              {occupation || <span className="text-gray-400 italic font-normal">Not specified</span>}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pb-3 border-b border-[#F8FAFC] last:border-0 last:pb-0">
                          <div className="w-10 h-10 rounded-full bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0">
                            <Phone className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-wider">Phone Number</span>
                            <span className="block text-[14px] font-bold text-[#1F2937] truncate mt-0.5">
                              {phone || <span className="text-gray-400 italic font-normal">Not specified</span>}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pb-3 last:border-0">
                          <div className="w-10 h-10 rounded-full bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0">
                            <Target className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-wider">Focus Area</span>
                            <span className="block text-[14px] font-bold text-[#1F2937] truncate mt-0.5">
                              {focusArea || <span className="text-gray-400 italic font-normal">Not specified</span>}
                            </span>
                          </div>
                        </div>

                        {/* Motto Sub-card with soft purple gradient matching the screenshot */}
                        <div className="bg-gradient-to-r from-[#EEF2FF] to-[#E0E7FF] rounded-2xl p-5 border border-indigo-100/50 mt-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                <Target className="w-4 h-4" />
                              </div>
                              <div>
                                <h5 className="text-[13px] font-bold text-[#1F2937]">Your Motto</h5>
                                <p className="text-[10px] text-[#5F6B7A] font-medium">This is your personal battle cry. Keep it inspiring!</p>
                              </div>
                            </div>
                            {!isEditingDetails && (
                              <button
                                onClick={() => {
                                  setProfileEditName(profileName);
                                  setEditPhone(phone);
                                  setEditOccupation(occupation);
                                  setEditFocusArea(focusArea);
                                  setEditBio(bio);
                                  setIsEditingDetails(true);
                                }}
                                className="w-7 h-7 rounded-full bg-white text-indigo-600 flex items-center justify-center hover:shadow-xs transition-shadow cursor-pointer border border-indigo-50"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="text-center mt-4">
                            <p className="text-[15px] font-extrabold text-[#4F46E5] italic leading-relaxed flex items-center justify-center gap-1.5">
                              <span className="text-indigo-400">✦</span>
                              <span>"{bio || "Ready to crush the next tight deadline!"}"</span>
                              <span className="text-indigo-400">✦</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Mini Statistics Grid & Crisis Rescue Medals */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Achievement Cards (2x2 Grid) */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Card 1: Tasks Completed */}
                    <div className="group bg-white/75 backdrop-blur-md p-4.5 rounded-[20px] border border-[#ECECF5] shadow-[0_8px_30px_rgba(0,0,0,0.01)] hover:-translate-y-1 hover:border-[#5B6CFF]/30 hover:shadow-[0_8px_30px_rgba(91,108,255,0.04)] transition-all duration-250 ease-in-out flex flex-col justify-between h-[120px]">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-[#E8FBF2] text-[#10B981] rounded-xl flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        {/* Tiny decorative Sparkline SVG */}
                        <svg className="w-12 h-6 text-emerald-400 shrink-0" viewBox="0 0 40 20">
                          <path d="M0,15 Q10,5 20,15 T40,10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-outfit text-2xl font-black text-[#1F2937] leading-none block">
                          {tasks.filter(t => t.status === "completed").length}
                        </span>
                        <span className="text-[12px] font-extrabold text-[#1F2937] block mt-1">Tasks Conquered</span>
                        <span className="text-[10px] text-[#5F6B7A] font-medium block">Total completed</span>
                      </div>
                    </div>

                    {/* Card 2: Active Habits */}
                    <div className="group bg-white/75 backdrop-blur-md p-4.5 rounded-[20px] border border-[#ECECF5] shadow-[0_8px_30px_rgba(0,0,0,0.01)] hover:-translate-y-1 hover:border-[#5B6CFF]/30 hover:shadow-[0_8px_30px_rgba(91,108,255,0.04)] transition-all duration-250 ease-in-out flex flex-col justify-between h-[120px]">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-[#EEF2FF] text-[#3B82F6] rounded-xl flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        {/* Tiny decorative Sparkline SVG */}
                        <svg className="w-12 h-6 text-blue-400 shrink-0" viewBox="0 0 40 20">
                          <path d="M0,12 Q10,18 20,8 T40,12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-outfit text-2xl font-black text-[#1F2937] leading-none block">
                          {habits.length}
                        </span>
                        <span className="text-[12px] font-extrabold text-[#1F2937] block mt-1">Habits Active</span>
                        <span className="text-[10px] text-[#5F6B7A] font-medium block">Currently active</span>
                      </div>
                    </div>

                    {/* Card 3: Peak Momentum */}
                    <div className="group bg-white/75 backdrop-blur-md p-4.5 rounded-[20px] border border-[#ECECF5] shadow-[0_8px_30px_rgba(0,0,0,0.01)] hover:-translate-y-1 hover:border-[#5B6CFF]/30 hover:shadow-[0_8px_30px_rgba(91,108,255,0.04)] transition-all duration-250 ease-in-out flex flex-col justify-between h-[120px]">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-[#F5F3FF] text-[#8B5CF6] rounded-xl flex items-center justify-center shrink-0">
                          <Zap className="w-5 h-5" />
                        </div>
                        {/* Tiny decorative Sparkline SVG */}
                        <svg className="w-12 h-6 text-purple-400 shrink-0" viewBox="0 0 40 20">
                          <path d="M0,15 Q10,10 20,15 T40,5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-outfit text-2xl font-black text-[#1F2937] leading-none block">
                          {taskCompletionPercent}%
                        </span>
                        <span className="text-[12px] font-extrabold text-[#1F2937] block mt-1">Peak Momentum</span>
                        <span className="text-[10px] text-[#5F6B7A] font-medium block">Your best score</span>
                      </div>
                    </div>

                    {/* Card 4: Badges Earned */}
                    <div className="group bg-white/75 backdrop-blur-md p-4.5 rounded-[20px] border border-[#ECECF5] shadow-[0_8px_30px_rgba(0,0,0,0.01)] hover:-translate-y-1 hover:border-[#5B6CFF]/30 hover:shadow-[0_8px_30px_rgba(91,108,255,0.04)] transition-all duration-250 ease-in-out flex flex-col justify-between h-[120px]">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-[#FFFBEB] text-[#F59E0B] rounded-xl flex items-center justify-center shrink-0">
                          <Trophy className="w-5 h-5" />
                        </div>
                        {/* Tiny decorative Sparkline SVG */}
                        <svg className="w-12 h-6 text-amber-400 shrink-0" viewBox="0 0 40 20">
                          <path d="M0,18 Q10,14 20,16 T40,12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-outfit text-2xl font-black text-[#1F2937] leading-none block">
                          {
                            [
                              tasks.filter(t => t.status === 'completed').length > 0,
                              habits.length > 0,
                              chatMessages.length > 1,
                              tasks.length > 0 && tasks.filter(t => t.priority === 'urgent').length === 0,
                              habits.some(h => (h.streak || 0) >= 3),
                              taskCompletionPercent >= 80 && tasks.length > 0
                            ].filter(Boolean).length
                          } / 6
                        </span>
                        <span className="text-[12px] font-extrabold text-[#1F2937] block mt-1">Badges Earned</span>
                        <span className="text-[10px] text-[#5F6B7A] font-medium block">Keep going!</span>
                      </div>
                    </div>
                  </div>

                  {/* Medals & Achievements Collection Card */}
                  <div className="bg-white/75 backdrop-blur-md p-6 border border-[#ECECF5] rounded-[24px] space-y-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)]" id="profile-achievements-card">
                    <div className="flex items-center justify-between border-b border-[#ECECF5] pb-4">
                      <div>
                        <h3 className="font-outfit text-lg font-bold text-[#1F2937]">
                          Crisis Rescue Medals
                        </h3>
                        <p className="text-[12px] text-[#5F6B7A] font-medium mt-0.5">Achievements unlocked through your actions</p>
                      </div>
                      <span className="px-3 py-1 bg-[#FFFAF0] text-[#D97706] rounded-full text-[11px] font-black uppercase tracking-wider font-mono shrink-0 border border-[#FEE2E2]">
                        {
                          [
                            tasks.filter(t => t.status === 'completed').length > 0,
                            habits.length > 0,
                            chatMessages.length > 1,
                            tasks.length > 0 && tasks.filter(t => t.priority === 'urgent').length === 0,
                            habits.some(h => (h.streak || 0) >= 3),
                            taskCompletionPercent >= 80 && tasks.length > 0
                          ].filter(Boolean).length
                        } / 6 Unlocked
                      </span>
                    </div>

                    {/* Badges responsive grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="badges-grid-container">
                      
                      {/* Badge 1: Deadline Defuser */}
                      {(() => {
                        const isUnlocked = tasks.filter(t => t.status === 'completed').length > 0;
                        return (
                          <div className={`p-4 rounded-[16px] border flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                            isUnlocked 
                              ? 'bg-[#FFFDF5] border-amber-200 shadow-xs' 
                              : 'bg-gray-50/50 border-gray-100 opacity-55 grayscale'
                          }`}>
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isUnlocked ? 'bg-[#F59E0B] text-white shadow-xs' : 'bg-gray-200 text-gray-400'
                              }`}>
                                <Flame className={`w-5 h-5 ${isUnlocked ? 'animate-pulse' : ''}`} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-extrabold text-[#1F2937] truncate">Deadline Defuser</p>
                                {isUnlocked && (
                                  <span className="inline-block text-[9px] font-black bg-[#FEF3C7] text-[#D97706] px-1.5 py-0.5 rounded-full uppercase mt-1">
                                    ON
                                  </span>
                                )}
                                <p className="text-[11px] text-[#5F6B7A] leading-normal font-medium mt-1">Completed your first critical task.</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Badge 2: Routine Gladiator */}
                      {(() => {
                        const isUnlocked = habits.length > 0;
                        return (
                          <div className={`p-4 rounded-[16px] border flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                            isUnlocked 
                              ? 'bg-[#F9FAFB] border-blue-200 shadow-xs' 
                              : 'bg-gray-50/50 border-gray-100 opacity-55 grayscale'
                          }`}>
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isUnlocked ? 'bg-[#3B82F6] text-white shadow-xs' : 'bg-gray-200 text-gray-400'
                              }`}>
                                <Repeat className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-extrabold text-[#1F2937] truncate">Routine Gladiator</p>
                                {isUnlocked && (
                                  <span className="inline-block text-[9px] font-black bg-[#DBEAFE] text-[#1D4ED8] px-1.5 py-0.5 rounded-full uppercase mt-1">
                                    ON
                                  </span>
                                )}
                                <p className="text-[11px] text-[#5F6B7A] leading-normal font-medium mt-1">Built a daily routine.</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Badge 3: Streak Sovereign */}
                      {(() => {
                        const isUnlocked = habits.some(h => (h.streak || 0) >= 3);
                        return (
                          <div className={`p-4 rounded-[16px] border flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                            isUnlocked 
                              ? 'bg-[#FFF5F5] border-rose-200 shadow-xs' 
                              : 'bg-gray-50/50 border-gray-100 opacity-55 grayscale'
                          }`}>
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isUnlocked ? 'bg-[#EC4899] text-white shadow-xs' : 'bg-gray-200 text-gray-400'
                              }`}>
                                <Trophy className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-extrabold text-[#1F2937] truncate">Streak Sovereign</p>
                                {isUnlocked && (
                                  <span className="inline-block text-[9px] font-black bg-[#FCE7F3] text-[#BE185D] px-1.5 py-0.5 rounded-full uppercase mt-1">
                                    ON
                                  </span>
                                )}
                                <p className="text-[11px] text-[#5F6B7A] leading-normal font-medium mt-1">Maintained a 3-day streak.</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Badge 4: Gemini Specialist */}
                      {(() => {
                        const isUnlocked = chatMessages.length > 1;
                        return (
                          <div className={`p-4 rounded-[16px] border flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                            isUnlocked 
                              ? 'bg-cyan-50/30 border-cyan-200 shadow-xs' 
                              : 'bg-gray-50/50 border-gray-100 opacity-55 grayscale'
                          }`}>
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isUnlocked ? 'bg-cyan-500 text-white shadow-xs' : 'bg-[#F1F5F9] text-gray-400'
                              }`}>
                                <Sparkles className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-extrabold text-[#1F2937] truncate">Gemini Specialist</p>
                                {isUnlocked && (
                                  <span className="inline-block text-[9px] font-black bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded-full uppercase mt-1">
                                    ON
                                  </span>
                                )}
                                <p className="text-[11px] text-[#5F6B7A] leading-normal font-medium mt-1">Used AI coach during anxiety.</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Badge 5: Anxiety Tamer */}
                      {(() => {
                        const isUnlocked = tasks.length > 0 && tasks.filter(t => t.priority === 'urgent').length === 0;
                        return (
                          <div className={`p-4 rounded-[16px] border flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                            isUnlocked 
                              ? 'bg-emerald-50/30 border-emerald-200 shadow-xs' 
                              : 'bg-gray-50/50 border-gray-100 opacity-55 grayscale'
                          }`}>
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isUnlocked ? 'bg-emerald-500 text-white shadow-xs' : 'bg-[#F1F5F9] text-gray-400'
                              }`}>
                                <Shield className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-extrabold text-[#1F2937] truncate">Anxiety Tamer</p>
                                {isUnlocked && (
                                  <span className="inline-block text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase mt-1">
                                    ON
                                  </span>
                                )}
                                <p className="text-[11px] text-[#5F6B7A] leading-normal font-medium mt-1">Cleared high-urgent panic alerts.</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Badge 6: Peak Momentum */}
                      {(() => {
                        const isUnlocked = taskCompletionPercent >= 80 && tasks.length > 0;
                        return (
                          <div className={`p-4 rounded-[16px] border flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                            isUnlocked 
                              ? 'bg-violet-50/30 border-violet-200 shadow-xs' 
                              : 'bg-gray-50/50 border-gray-100 opacity-55 grayscale'
                          }`}>
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isUnlocked ? 'bg-violet-500 text-white shadow-xs' : 'bg-[#F1F5F9] text-gray-400'
                              }`}>
                                <Star className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-extrabold text-[#1F2937] truncate">Peak Momentum</p>
                                {isUnlocked && (
                                  <span className="inline-block text-[9px] font-black bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full uppercase mt-1">
                                    ON
                                  </span>
                                )}
                                <p className="text-[11px] text-[#5F6B7A] leading-normal font-medium mt-1">Reached 80% task efficiency.</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  </div>

                </div>

              </div>

              {/* Premium Duewell Assessment Banner (Full Width) */}
              <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#EFF6FF] via-[#EEF2FF] to-[#F5F3FF] border border-[#E2E8F0] p-7 shadow-xs group hover:shadow-sm transition-all duration-300">
                {/* Floating sparkles */}
                <div className="absolute top-2 right-12 w-2 h-2 bg-blue-300 rounded-full animate-ping opacity-40" />
                <div className="absolute bottom-4 left-1/3 w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce opacity-40" />
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white text-[#3B82F6] rounded-2xl shrink-0 shadow-xs relative">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-[#3B82F6] uppercase tracking-wider font-mono">Cognitive Strategist</span>
                      <h4 className="font-outfit text-lg font-extrabold text-[#1E1B4B]">AI Coach Assessment</h4>
                      <p className="text-[13px] text-[#4F46E5] font-semibold leading-relaxed max-w-2xl mt-1">
                        "Fantastic work, <span className="font-bold text-[#1F2937]">{profileName || "Saver"}</span>! Complete your pending deadlines in the Productivity Hub to increase your tactical survival score."
                      </p>
                      
                      <div className="text-[12px] text-[#5F6B7A] font-medium leading-normal p-2.5 bg-white/70 rounded-xl border border-indigo-100/40 inline-block mt-3">
                        {(() => {
                          const pendingTasksCount = tasks.filter(t => t.status !== "completed").length;
                          if (pendingTasksCount > 0) {
                            return `💡 Complete ${pendingTasksCount} more task${pendingTasksCount > 1 ? "s" : ""} today to increase your Momentum by ${(pendingTasksCount * 8).toFixed(0)}%!`;
                          } else {
                            return `🏆 Excellent job! All current tasks are fully resolved. You have hit Peak Momentum!`;
                          }
                        })()}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveView("productivity")}
                    className="w-full md:w-auto px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[12px] font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:translate-y-[-2px] shrink-0"
                  >
                    <span>Continue Productivity</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* VIEW: 7. SETTINGS */}
          {activeView === "settings" && (
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* App Settings Form Card */}
              <div className={`custom-card p-6 bg-white/75 backdrop-blur-md border border-[#ECECF5] rounded-[24px] space-y-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)]`} id="profile-settings-card">
                <div className="flex items-center pb-4 border-b border-[#ECECF5]">
                  <h3 className="font-outfit text-lg font-semibold text-[#1F2937] flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#5B6CFF]" /> App Settings & Rescue Preferences
                  </h3>
                </div>

                {settingsSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-[12px] text-[13px] font-medium">
                    {settingsSuccessMessage}
                  </div>
                )}
                {settingsErrorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-[12px] text-[13px] font-medium">
                    {settingsErrorMessage}
                  </div>
                )}

                <form onSubmit={handleUpdateSettings} className="space-y-5">
                   {/* Work Session Duration */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider">
                      Work Session Length (Pomodoro)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[15, 25, 45, 60].map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setWorkDuration(dur)}
                          className={`py-2 text-[13px] font-bold rounded-[10px] transition-all cursor-pointer border ${
                            workDuration === dur
                              ? "bg-[#5B6CFF] border-[#5B6CFF] text-white shadow-xs"
                              : "bg-white border-[#ECECF5] text-[#5F6B7A] hover:bg-[#EEF2FF] hover:text-[#5B6CFF]"
                          }`}
                        >
                          {dur} Min
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#5F6B7A]">
                      Preferred duration of consecutive deep work before entering a transition break.
                    </p>
                  </div>

                  {/* Break Session Duration */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider">
                      Transition Break Duration
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[5, 10, 15].map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setBreakDuration(dur)}
                          className={`py-2 text-[13px] font-bold rounded-[10px] transition-all cursor-pointer border ${
                            breakDuration === dur
                              ? "bg-[#5B6CFF] border-[#5B6CFF] text-white shadow-xs"
                              : "bg-white border-[#ECECF5] text-[#5F6B7A] hover:bg-[#EEF2FF] hover:text-[#5B6CFF]"
                          }`}
                        >
                          {dur} Min
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stress Buffer Level */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider">
                      Stress Buffer Level
                    </label>
                    <select
                      value={stressTolerance}
                      onChange={(e) => setStressTolerance(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#FAF9FD] border border-[#ECECF5] focus:border-[#5B6CFF] outline-none text-[15px] rounded-[12px] transition-colors font-medium text-[#1F2937]"
                      id="settings-stress-select"
                    >
                      <option value="Aggressive">Aggressive (Tighter intervals, high density)</option>
                      <option value="Balanced">Balanced (Standard AI buffer slots, steady pace)</option>
                      <option value="Relaxed">Relaxed (Generous transition breaks, low stress)</option>
                    </select>
                    <p className="text-[11px] text-[#5F6B7A]">
                      Toggles how the scheduler generates deadline buffers and priority ranks.
                    </p>
                  </div>

                  {/* Audio Effects & AI Tips */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {enableSound ? (
                          <Volume2 className="w-4.5 h-4.5 text-[#5B6CFF]" />
                        ) : (
                          <VolumeX className="w-4.5 h-4.5 text-gray-400" />
                        )}
                        <div>
                          <p className="text-[14px] font-semibold text-[#1F2937]">Sound & Soundtracks</p>
                          <p className="text-[11px] text-[#5F6B7A]">Play timer alarms and ambient sound effects</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableSound}
                          onChange={(e) => setEnableSound(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5B6CFF]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4.5 h-4.5 text-[#5B6CFF]" />
                        <div>
                          <p className="text-[14px] font-semibold text-[#1F2937]">Enable AI Tips & Coaching</p>
                          <p className="text-[11px] text-[#5F6B7A]">Receive custom tips on task lists and rescue station</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableAITips}
                          onChange={(e) => setEnableAITips(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5B6CFF]"></div>
                      </label>
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="pt-4 border-t border-[#ECECF5] flex justify-end">
                    <button
                      type="submit"
                      disabled={settingsLoading}
                      className="px-5 py-2.5 bg-[#5B6CFF] hover:bg-[#4758E8] text-white text-[14px] font-bold rounded-[12px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      id="settings-save-btn"
                    >
                      {settingsLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Save App Settings
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Workspace Parameters Cards */}
              <div className={`custom-card p-8 border ${cardBg} max-w-2xl mx-auto space-y-6`} id="settings-container">
                <h3 className="font-outfit font-semibold text-[22px] text-[#1F2937]">Workspace Parameters</h3>
                
                <div className="space-y-5 text-gray-500">
                  <div className="p-5 rounded-[16px] bg-[#FAF9FD] border border-[#ECECF5] space-y-2">
                    <h5 className="font-semibold text-[16px] text-[#1F2937] flex items-center gap-1.5">🎙️ Speech Parsing Guide</h5>
                    <p className="text-[13px] text-[#5F6B7A] font-medium leading-relaxed">Click 'Speak Task' in Productivity &rarr; Tasks Board and dictate clearly:</p>
                    <ul className="list-disc pl-5 space-y-1 text-[13px] text-[#5F6B7A] font-medium">
                      <li>"Submit history citations paper due tomorrow at 4 PM"</li>
                      <li>"Complete math assignment due Friday"</li>
                    </ul>
                  </div>

                  <div className="p-5 rounded-[16px] bg-[#FAF9FD] border border-[#ECECF5] space-y-2">
                    <h5 className="font-semibold text-[16px] text-[#1F2937] flex items-center gap-1.5">🔒 Row-Level Data Segregation</h5>
                    <p className="text-[13px] text-[#5F6B7A] font-medium leading-relaxed">All tasks, schedules, and consistency checks are limited strictly to user ID <code className="px-2 py-0.5 bg-[#EEF2FF] rounded text-[#5B6CFF] font-mono text-[13px]">{userId}</code> via authenticated filters.</p>
                  </div>

                  <div className="p-5 rounded-[16px] bg-[#FAF9FD] border border-[#ECECF5] space-y-2">
                    <h5 className="font-semibold text-[16px] text-[#1F2937] flex items-center gap-1.5">⚙️ Core Build Status</h5>
                    <p className="text-[13px] text-[#22C55E] flex items-center gap-2 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-ping"></span>
                      <span>Sandbox Database connected locally & synchronized perfectly</span>
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Satisfying Moment Toast */}
      {satisfyingLine && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#232323]/90 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-white/10 animate-slide-up max-w-md w-11/12">
          <div className="p-1 bg-emerald-500 text-white rounded-full flex-shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div className="text-sm font-semibold leading-snug">
            {satisfyingLine}
          </div>
        </div>
      )}

      {/* Celebration Milestones Popover */}
      <AnimatePresence>
        {celebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.8, y: -20, x: "-50%" }}
            transition={{ type: "spring", damping: 15 }}
            className="fixed bottom-10 left-1/2 z-50 bg-gradient-to-br from-[#111827] via-gray-900 to-[#1e1b4b] text-white p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center border-2 border-indigo-500/50 max-w-sm w-11/12"
          >
            <div className="w-14 h-14 bg-indigo-500/20 border border-indigo-500/40 rounded-full flex items-center justify-center text-3xl mb-3.5 animate-bounce">
              {celebration.days === 7 ? "🏆" : "🚀"}
            </div>
            
            <h4 className="font-outfit text-lg font-extrabold tracking-tight text-indigo-400">
              {celebration.days}-Day Streak Achieved!
            </h4>
            
            <p className="text-xs text-gray-300 mt-2 font-semibold">
              Your daily habit <span className="text-indigo-400 font-extrabold">"{celebration.habitName}"</span> is burning bright!
            </p>
            
            <p className="text-[11px] text-gray-400 font-medium mt-2 leading-relaxed">
              {celebration.days === 7 
                ? "Perfect Week! You've maintained complete consistency. You are a legendary master of momentum!" 
                : "3 days of consecutive victory! Momentum is officially building. Keep going!"
              }
            </p>
            
            <button
              onClick={() => setCelebration(null)}
              className="mt-4 px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-full transition-transform active:scale-95 cursor-pointer shadow-md"
            >
              Continue My Streak
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
