import React, { useState, useEffect } from "react";
import { RouteType, Task, Habit, TimelineSlot, PriorityType, DifficultyType } from "../types";
import { dataService } from "../lib/dataService";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { 
  Zap, LogOut, Plus, Calendar, Clock, CheckCircle2, Circle, Trash2, 
  Sparkles, ListFilter, AlertTriangle, Check, RefreshCw, Eye, Award, HelpCircle,
  AlertCircle, TrendingUp, Repeat, Mic, MicOff, Mail, Copy, X,
  LayoutDashboard, User, Settings, Search, Bell, Moon, Sun, ChevronRight, ChevronDown, Sliders, Activity, PanelLeftClose, PanelLeft,
  Phone, Briefcase, Target, BookOpen, Volume2, VolumeX, Save, Edit2, Loader2
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
  const [productivitySubTab, setProductivitySubTab] = useState<"tasks" | "habits" | "schedule">("tasks");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string; type: 'alert' | 'success' | 'info' }>>([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: "Hello! I am Gemini, your Last-Minute Life Saver productivity coach. I know deadlines can feel terrifying, but together we can break through the paralysis. What is currently stressing you out the most today?" }
  ]);
  const [currentChatMessage, setCurrentChatMessage] = useState("");
  const [coachChatLoading, setCoachChatLoading] = useState(false);
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
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setCurrentChatMessage("");
    setCoachChatLoading(true);
    try {
      const res = await fetch("/api/ai-coach-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
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
      console.error(err);
      setInitialLoadError(true);
      setActionError("We had a small hiccup connecting to our database server. You can retry anytime.");
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

  const dashboardBg = "bg-[#F7F8FC] text-[#1F2937]";
  const cardBg = "bg-white border-[#E5EAF5] text-[#1F2937] rounded-[20px]";
  const textPrimary = "text-[#1F2937]";
  const textSecondary = "text-[#5F6B7A]";
  const borderCol = "border-[#E5EAF5]";

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
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/35 rounded-2xl text-emerald-500 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <Check className="w-4.5 h-4.5 shrink-0" />
              <span>{actionSuccess}</span>
              <button onClick={() => setActionSuccess("")} className="ml-auto text-[10px] uppercase font-bold hover:opacity-85">Dismiss</button>
            </div>
          )}

          {/* VIEW: 1. DASHBOARD OVERVIEW */}
          {activeView === "dashboard" && (
            <div className="space-y-6">
              
              {/* Premium Welcome Header Card */}
              <div className="p-8 rounded-[24px] border border-[#E5EAF5] bg-gradient-to-br from-[#EEF2FF] via-white to-[#F7F8FC] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm">
                <div className="space-y-3.5 relative z-10 max-w-xl text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5B6CFF]/10 text-[#5B6CFF] text-[11px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Focus State active</span>
                  </div>
                  
                  <h2 className="font-outfit text-[32px] font-semibold tracking-tight text-[#1F2937]">
                    Hello, <span className="text-[#5B6CFF]">{profileName || userEmail.split("@")[0]}</span>!
                  </h2>
                  <p className="text-[15px] text-[#5F6B7A] leading-relaxed font-medium">
                    You have <span className="text-[#5B6CFF] font-semibold">{tasks.filter(t => t.status !== 'completed').length} pending</span> items and <span className="text-[#22C55E] font-semibold">{habits.filter(isHabitDoneToday).length} habits</span> locked in today. Use AI priorities to reduce anxiety.
                  </p>
                  
                  <div className="flex flex-wrap gap-2.5 pt-2 justify-center md:justify-start">
                    <button
                      disabled={aiPrioritizing}
                      onClick={handleAIPrioritisation}
                      className="px-5 py-3 bg-[#5B6CFF] hover:bg-[#4758E8] text-white text-[15px] font-semibold rounded-[14px] flex items-center gap-2 cursor-pointer shadow-sm transition-all duration-250 hover:scale-[1.02] disabled:opacity-55"
                    >
                      <Zap className="w-4 h-4" />
                      <span>{aiPrioritizing ? "Prioritizing..." : "Curate AI Priorities"}</span>
                    </button>
                    <button
                      disabled={aiPlanning}
                      onClick={handleAIGeneratePlan}
                      className="px-5 py-3 border border-[#E5EAF5] bg-white hover:bg-[#F7F8FC] text-[#5F6B7A] text-[15px] font-semibold rounded-[14px] flex items-center gap-2 cursor-pointer transition-all duration-250 hover:scale-[1.02] shadow-sm disabled:opacity-55"
                    >
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <span>Focus Schedule</span>
                    </button>
                  </div>
                </div>

                {/* SVG Momentum Ring right side of header */}
                <div className="shrink-0 relative w-36 h-36 flex items-center justify-center bg-white rounded-full p-4 border border-[#E5EAF5] shadow-xs">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      stroke="#E5EAF5"
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
                    <span className="font-outfit text-3xl font-semibold text-[#5B6CFF] tabular-nums">
                      {taskCompletionPercent}%
                    </span>
                    <p className="text-[11px] text-[#5F6B7A] font-bold uppercase tracking-wider">Momentum</p>
                  </div>
                </div>
              </div>

              {/* Most Urgent Reminder Banner */}
              {mostUrgentTask && (
                <div className="p-6 rounded-[20px] border border-rose-100/60 bg-gradient-to-r from-rose-50/60 to-orange-50/40 text-[#1F2937] flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
                  <div className="flex items-start gap-3.5 relative z-10">
                    <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-[12px] mt-0.5">
                      <AlertCircle className="w-5.5 h-5.5 animate-pulse" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest bg-rose-100/60 px-2.5 py-0.5 rounded-full">
                          🔥 Critical Target
                        </span>
                        <span className="text-[11px] text-[#5F6B7A] font-semibold">
                          Due: {formatDeadline(mostUrgentTask.deadline).formatted}
                        </span>
                      </div>
                      <h4 className="font-outfit text-[16px] font-semibold text-[#1F2937]">
                        {mostUrgentTask.title}
                      </h4>
                      <p className="text-[13px] text-[#5F6B7A] italic leading-relaxed">
                        💡 {mostUrgentTask.aiTip || "Relax. Let's break this syllabus into three parts and focus on Part 1 for 15 minutes."}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleTaskStatus(mostUrgentTask.id)}
                    className="w-full md:w-auto px-5 py-3 bg-[#5B6CFF] hover:bg-[#4758E8] text-white text-[15px] font-semibold rounded-[14px] flex items-center justify-center gap-2 cursor-pointer transition-all duration-250 hover:scale-[1.02] shadow-sm"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Defuse Target</span>
                  </button>
                </div>
              )}

              {/* Bento-Grid metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Pending targets metric */}
                <div className={`custom-card p-6 border ${cardBg} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider">Workload Target</span>
                    <span className="p-2 bg-[#5B6CFF]/10 text-[#5B6CFF] rounded-[12px]"><Zap className="w-4 h-4" /></span>
                  </div>
                  <h3 className="font-outfit text-4xl font-semibold text-[#5B6CFF] tabular-nums">
                    {tasks.filter(t => t.status !== 'completed').length}
                  </h3>
                  <p className="text-[13px] font-medium text-[#5F6B7A]">Pending registered tasks</p>
                </div>

                {/* Habits Streak Metric */}
                <div className={`custom-card p-6 border ${cardBg} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider">Energy Habits</span>
                    <span className="p-2 bg-emerald-50 text-emerald-600 rounded-[12px]"><Award className="w-4 h-4" /></span>
                  </div>
                  <h3 className="font-outfit text-4xl font-semibold text-[#22C55E] tabular-nums">
                    {habits.filter(isHabitDoneToday).length} / {habits.length}
                  </h3>
                  <p className="text-[13px] font-medium text-[#5F6B7A]">Completed checks today</p>
                </div>

                {/* Overdue Items Alert */}
                <div className={`custom-card p-6 border ${cardBg} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider">Overdue Danger</span>
                    <span className="p-2 bg-rose-50 text-rose-600 rounded-[12px]"><AlertCircle className="w-4 h-4" /></span>
                  </div>
                  <h3 className="font-outfit text-4xl font-semibold text-[#EF4444] tabular-nums">
                    {tasks.filter(t => t.status !== 'completed' && new Date(t.deadline).getTime() < new Date().getTime()).length}
                  </h3>
                  <p className="text-[13px] font-medium text-[#5F6B7A]">Critical rescue tasks</p>
                </div>

              </div>

              {/* Next Up Quick Checklist */}
              <div className={`custom-card p-6 border ${cardBg} space-y-4`}>
                <h4 className="font-outfit font-semibold text-[18px] tracking-tight">⚡ Closest Rescue Targets</h4>
                <div className="space-y-3.5">
                  {tasks.filter(t => t.status !== 'completed').slice(0, 3).length === 0 ? (
                    <p className="text-[15px] font-medium text-[#5F6B7A]">All tasks completed. Great job!</p>
                  ) : (
                    tasks.filter(t => t.status !== 'completed').slice(0, 3).map((t) => (
                      <div key={t.id} className="flex items-center justify-between border-b border-[#E5EAF5] pb-3.5 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2.5">
                          <button onClick={() => handleToggleTaskStatus(t.id)} className="text-[#5F6B7A]/40 hover:text-[#5B6CFF] cursor-pointer transition-colors">
                            <Circle className="w-4.5 h-4.5" />
                          </button>
                          <span className="text-[15px] font-semibold text-[#1F2937]">{t.title}</span>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100/60 uppercase">
                          {formatDeadline(t.deadline).formatted}
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
            />
          )}

          {/* VIEW: 3. MOMENTUM ANALYTICS */}
          {activeView === "momentum" && (
            <div className="space-y-6 text-center">
              
              {/* Huge Ring Container */}
              <div className={`custom-card p-10 border ${cardBg} flex flex-col items-center justify-center max-w-xl mx-auto space-y-5`}>
                <h3 className="font-outfit font-semibold text-[22px] text-[#1F2937]">Your Current Victory Momentum</h3>
                
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
                    <circle
                      cx="96"
                      cy="96"
                      r="84"
                      stroke="#E5EAF5"
                      strokeWidth="12"
                      fill="transparent"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="84"
                      stroke="#5B6CFF"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 84}
                      strokeDashoffset={2 * Math.PI * 84 * (1 - taskCompletionPercent / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="font-outfit text-5xl font-semibold text-[#5B6CFF] tabular-nums">
                      {taskCompletionPercent}%
                    </span>
                    <p className="text-[13px] text-[#5F6B7A] font-bold uppercase tracking-wider mt-1.5">Consistency Flow</p>
                  </div>
                </div>

                <p className="text-[15px] text-[#5F6B7A] font-medium max-w-sm">
                  {taskCompletionPercent === 100 
                    ? "Perfect absolute victory! Every registered deadline has been completed. You are legendary." 
                    : "Maintain continuous flow. Break big frozen chunks down to keep this ring burning."}
                </p>
              </div>

              {/* Stress mitigation advice block */}
              {recommendations.length > 0 && (
                <div className={`custom-card p-6 border ${cardBg} text-left max-w-xl mx-auto space-y-4`}>
                  <h4 className="font-outfit font-semibold text-[18px] text-[#1F2937] flex items-center gap-1.5">
                    <Award className="w-5 h-5 text-[#5B6CFF]" />
                    <span>Gemini Anti-Burnout Suggestions</span>
                  </h4>
                  <ul className="space-y-2.5">
                    {recommendations.map((rec, i) => (
                      <li key={i} className="text-[15px] text-[#5F6B7A] font-medium flex items-start gap-2.5">
                        <span className="text-[#5B6CFF] text-base select-none">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

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
            />
          )}

          {/* VIEW: 6. PROFILE TAB */}
          {activeView === "profile" && (
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* Profile Card */}
              <div className={`custom-card p-8 border ${cardBg} space-y-6`} id="profile-container">
                <div className="flex items-center gap-4 pb-5 border-b border-[#E5EAF5]">
                  <div className="w-16 h-16 rounded-[16px] bg-[#5B6CFF] flex items-center justify-center font-outfit text-2xl font-black text-white shrink-0 uppercase shadow-sm">
                    {profileName ? profileName.slice(0, 2) : userEmail.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-outfit font-semibold text-[18px] text-[#1F2937]">{profileName || "Anonymous Saver"}</h3>
                    <p className="text-[15px] text-[#5F6B7A] font-medium">{userEmail}</p>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfileName} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-2">Configure Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter your name..."
                      value={profileEditName}
                      onChange={(e) => setProfileEditName(e.target.value)}
                      className="w-full px-4.5 py-3 text-[15px] font-medium rounded-[14px] border border-[#E5EAF5] bg-[#F7F8FC] text-[#1F2937] outline-none focus:ring-4 focus:ring-[#5B6CFF]/12 focus:border-[#5B6CFF]"
                      id="profile-fullname-input"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={profileUpdateLoading}
                      className="px-5 py-3 bg-[#5B6CFF] hover:bg-[#4758E8] text-white font-semibold text-[15px] rounded-[14px] transition-all duration-250 hover:scale-[1.02] cursor-pointer disabled:opacity-40 shadow-sm"
                    >
                      {profileUpdateLoading ? "Updating..." : "Save Full Name"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Basic User Details Card */}
              <div className={`custom-card p-6 bg-white border border-[#E5EAF5] rounded-[20px] space-y-6`} id="profile-basic-details-card">
                <div className="flex items-center justify-between pb-4 border-b border-[#E5EAF5]">
                  <h3 className="font-outfit text-lg font-semibold text-[#1F2937] flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#5B6CFF]" /> Professional & Personal Details
                  </h3>
                  {!isEditingDetails && (
                    <button
                      onClick={() => {
                        setEditPhone(phone);
                        setEditOccupation(occupation);
                        setEditFocusArea(focusArea);
                        setEditBio(bio);
                        setIsEditingDetails(true);
                      }}
                      className="text-[13px] text-[#5B6CFF] hover:text-[#4758E8] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                      id="profile-edit-details-btn"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit details
                    </button>
                  )}
                </div>

                {detailsSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-[12px] text-[13px] font-medium">
                    {detailsSuccessMessage}
                  </div>
                )}
                {detailsErrorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-[12px] text-[13px] font-medium">
                    {detailsErrorMessage}
                  </div>
                )}

                {isEditingDetails ? (
                  <form onSubmit={handleUpdateDetails} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-[#5B6CFF]" /> Role / Occupation
                      </label>
                      <input
                        type="text"
                        value={editOccupation}
                        onChange={(e) => setEditOccupation(e.target.value)}
                        placeholder="E.g. Student, Software Developer, Freelancer"
                        className="w-full px-4 py-2.5 bg-[#F7F8FC] border border-[#E5EAF5] focus:border-[#5B6CFF] outline-none text-[15px] rounded-[12px] transition-colors font-medium text-[#1F2937]"
                        id="details-occupation-input"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#5B6CFF]" /> Phone Number
                      </label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="E.g. +1 (555) 000-0000"
                        className="w-full px-4 py-2.5 bg-[#F7F8FC] border border-[#E5EAF5] focus:border-[#5B6CFF] outline-none text-[15px] rounded-[12px] transition-colors font-medium text-[#1F2937]"
                        id="details-phone-input"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-[#5B6CFF]" /> Primary Focus Area
                      </label>
                      <select
                        value={editFocusArea}
                        onChange={(e) => setEditFocusArea(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#F7F8FC] border border-[#E5EAF5] focus:border-[#5B6CFF] outline-none text-[15px] rounded-[12px] transition-colors font-medium text-[#1F2937]"
                        id="details-focus-input"
                      >
                        <option value="">Select Focus Area...</option>
                        <option value="Academic (Exams & Classes)">Academic (Exams & Classes)</option>
                        <option value="Professional (Work Deadlines)">Professional (Work Deadlines)</option>
                        <option value="Personal Goals & Habits">Personal Goals & Habits</option>
                        <option value="Mixed Tasks & Projects">Mixed Tasks & Projects</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-[#5B6CFF]" /> Rescuer Motto / Bio
                      </label>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Write a brief motto or description..."
                        rows={3}
                        className="w-full px-4 py-2.5 bg-[#F7F8FC] border border-[#E5EAF5] focus:border-[#5B6CFF] outline-none text-[15px] rounded-[12px] transition-colors font-medium text-[#1F2937] resize-none"
                        id="details-bio-input"
                      />
                    </div>

                    <div className="flex gap-2.5 justify-end pt-2">
                      <button
                        type="submit"
                        disabled={detailsUpdateLoading}
                        className="px-4 py-2.5 bg-[#5B6CFF] hover:bg-[#4758E8] text-white text-[13px] font-bold rounded-[12px] flex items-center gap-1.5 transition-all cursor-pointer"
                        id="details-save-btn"
                      >
                        {detailsUpdateLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" /> Save Details
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingDetails(false)}
                        className="px-4 py-2.5 border border-[#E5EAF5] hover:bg-[#F7F8FC] text-[#5F6B7A] text-[13px] font-bold rounded-[12px] transition-all cursor-pointer"
                        id="details-cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider">Occupation</span>
                        <p className="text-[14px] font-medium text-[#1F2937]">
                          {occupation || <span className="text-gray-400 italic font-light">Not specified</span>}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider">Phone Number</span>
                        <p className="text-[14px] font-medium text-[#1F2937]">
                          {phone || <span className="text-gray-400 italic font-light">Not specified</span>}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider">Primary Focus Area</span>
                      <p className="text-[14px] font-medium text-[#1F2937]">
                        {focusArea || <span className="text-gray-400 italic font-light">Not specified</span>}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider">Rescuer Bio / Motto</span>
                      <p className="text-[14px] italic text-gray-600 bg-[#F7F8FC] p-3 rounded-[12px] border border-[#E5EAF5] leading-relaxed">
                        "{bio || "Ready to crush the next tight deadline!"}"
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* VIEW: 7. SETTINGS */}
          {activeView === "settings" && (
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* App Settings Form Card */}
              <div className={`custom-card p-6 bg-white border border-[#E5EAF5] rounded-[20px] space-y-6`} id="profile-settings-card">
                <div className="flex items-center pb-4 border-b border-[#E5EAF5]">
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
                              : "bg-white border-[#E5EAF5] text-[#5F6B7A] hover:bg-[#EEF2FF] hover:text-[#5B6CFF]"
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
                              : "bg-white border-[#E5EAF5] text-[#5F6B7A] hover:bg-[#EEF2FF] hover:text-[#5B6CFF]"
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
                      className="w-full px-4 py-2.5 bg-[#F7F8FC] border border-[#E5EAF5] focus:border-[#5B6CFF] outline-none text-[15px] rounded-[12px] transition-colors font-medium text-[#1F2937]"
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
                  <div className="pt-4 border-t border-[#E5EAF5] flex justify-end">
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
                  <div className="p-5 rounded-[16px] bg-[#F7F8FC] border border-[#E5EAF5] space-y-2">
                    <h5 className="font-semibold text-[16px] text-[#1F2937] flex items-center gap-1.5">🎙️ Speech Parsing Guide</h5>
                    <p className="text-[13px] text-[#5F6B7A] font-medium leading-relaxed">Click 'Speak Task' in Productivity &rarr; Tasks Board and dictate clearly:</p>
                    <ul className="list-disc pl-5 space-y-1 text-[13px] text-[#5F6B7A] font-medium">
                      <li>"Submit history citations paper due tomorrow at 4 PM"</li>
                      <li>"Complete math assignment due Friday"</li>
                    </ul>
                  </div>

                  <div className="p-5 rounded-[16px] bg-[#F7F8FC] border border-[#E5EAF5] space-y-2">
                    <h5 className="font-semibold text-[16px] text-[#1F2937] flex items-center gap-1.5">🔒 Row-Level Data Segregation</h5>
                    <p className="text-[13px] text-[#5F6B7A] font-medium leading-relaxed">All tasks, schedules, and consistency checks are limited strictly to user ID <code className="px-2 py-0.5 bg-[#EEF2FF] rounded text-[#5B6CFF] font-mono text-[13px]">{userId}</code> via authenticated filters.</p>
                  </div>

                  <div className="p-5 rounded-[16px] bg-[#F7F8FC] border border-[#E5EAF5] space-y-2">
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
