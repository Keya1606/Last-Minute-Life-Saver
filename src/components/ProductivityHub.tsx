import React from "react";
import { 
  Zap, Plus, Calendar, Clock, CheckCircle2, Circle, Trash2, 
  Sparkles, AlertCircle, RefreshCw, Eye, Award, HelpCircle, 
  Mic, MicOff, ChevronRight, Sliders, Check, ListFilter, Play, Bookmark,
  ChevronDown
} from "lucide-react";
import { Task, Habit, TimelineSlot, PriorityType, DifficultyType } from "../types";

interface ProductivityHubProps {
  // Navigation & Sub-tab
  productivitySubTab: "tasks" | "habits" | "schedule";
  setProductivitySubTab: (tab: "tasks" | "habits" | "schedule") => void;

  // Data & Lists
  tasks: Task[];
  habits: Habit[];
  currentPlan: TimelineSlot[];
  recommendations: string[];
  planMantra: string;

  // Filter
  filter: "all" | "pending" | "completed" | "ai";
  setFilter: (f: "all" | "pending" | "completed" | "ai") => void;

  // Add Task Form
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
  title: string;
  setTitle: (t: string) => void;
  description: string;
  setDescription: (d: string) => void;
  deadlineDate: string;
  setDeadlineDate: (d: string) => void;
  deadlineTime: string;
  setDeadlineTime: (t: string) => void;
  estimatedMinutes: number;
  setEstimatedMinutes: (m: number) => void;
  priority: PriorityType;
  setPriority: (p: PriorityType) => void;
  difficulty: DifficultyType;
  setDifficulty: (d: DifficultyType) => void;
  category: string;
  setCategory: (c: string) => void;
  markAsHabitInForm: boolean;
  setMarkAsHabitInForm: (mark: boolean) => void;

  // Add Habit Form
  newHabitName: string;
  setNewHabitName: (name: string) => void;
  showHabitForm: boolean;
  setShowHabitForm: (show: boolean) => void;

  // Speech Recognition
  isListening: boolean;
  toggleListening: () => void;
  speechFeedback: string;

  // Action Handlers
  handleCreateTask: (e: React.FormEvent) => void;
  handleToggleTaskStatus: (taskId: string) => void;
  handleDeleteTask: (taskId: string) => void;
  handleCreateHabit: (e: React.FormEvent) => void;
  handleCreateQuickHabit: (name: string) => void;
  handleToggleHabitDay: (habit: Habit) => void;
  handleDeleteHabit: (habitId: string) => void;
  handleAIGeneratePlan: () => void;
  aiPlanning: boolean;

  // Styling & Theme
  isDarkTheme: boolean;
  searchQuery?: string;
  formatDeadline: (dateStr: string) => { formatted: string; urgencyClass: string; urgencyLabel: string; isOverdue: boolean };
  
  // AI premium additions
  onExplodeTask: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onGenerateAcademicStrategy: (taskId: string) => void;
  explodingTaskId: string | null;
  roadmappingTaskId: string | null;
}

export default function ProductivityHub({
  productivitySubTab,
  setProductivitySubTab,
  tasks,
  habits,
  currentPlan,
  recommendations,
  planMantra,
  filter,
  setFilter,
  showAddForm,
  setShowAddForm,
  title,
  setTitle,
  description,
  setDescription,
  deadlineDate,
  setDeadlineDate,
  deadlineTime,
  setDeadlineTime,
  estimatedMinutes,
  setEstimatedMinutes,
  priority,
  setPriority,
  difficulty,
  setDifficulty,
  category,
  setCategory,
  markAsHabitInForm,
  setMarkAsHabitInForm,
  newHabitName,
  setNewHabitName,
  showHabitForm,
  setShowHabitForm,
  isListening,
  toggleListening,
  speechFeedback,
  handleCreateTask,
  handleToggleTaskStatus,
  handleDeleteTask,
  handleCreateHabit,
  handleCreateQuickHabit,
  handleToggleHabitDay,
  handleDeleteHabit,
  handleAIGeneratePlan,
  aiPlanning,
  isDarkTheme,
  searchQuery = "",
  formatDeadline,
  onExplodeTask,
  onToggleSubtask,
  onGenerateAcademicStrategy,
  explodingTaskId,
  roadmappingTaskId
}: ProductivityHubProps) {

  // Collapse/Expand state for subtasks and roadmaps per task.
  // We want them collapsed by default, so we check if the value is !== false (undefined or true means collapsed).
  const [collapsedSubtasks, setCollapsedSubtasks] = React.useState<Record<string, boolean>>({});
  const [collapsedRoadmaps, setCollapsedRoadmaps] = React.useState<Record<string, boolean>>({});

  const toggleSubtasksCollapse = (taskId: string) => {
    setCollapsedSubtasks(prev => {
      const isCurrentlyCollapsed = prev[taskId] !== false;
      return { ...prev, [taskId]: !isCurrentlyCollapsed };
    });
  };

  const toggleRoadmapCollapse = (taskId: string) => {
    setCollapsedRoadmaps(prev => {
      const isCurrentlyCollapsed = prev[taskId] !== false;
      return { ...prev, [taskId]: !isCurrentlyCollapsed };
    });
  };

  // Category Colors helper
  const getCategoryColor = (cat: string) => {
    switch(cat?.toLowerCase()) {
      case "academic": return "text-cyan-500 bg-cyan-500/10 border-cyan-500/20";
      case "work": return "text-indigo-500 bg-indigo-500/10 border-indigo-500/20";
      case "personal": return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      case "admin": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      default: return "text-teal-500 bg-teal-500/10 border-teal-500/20";
    }
  };

  // Helper for checking if habit done today
  const isHabitDoneToday = (habit: Habit) => {
    const todayStr = new Date().toISOString().split("T")[0];
    return habit.completed_dates.includes(todayStr);
  };

  const cardBg = "bg-white border-[#E5EAF5] text-[#1F2937]";
  const textColor = "text-[#1F2937]";
  const secondaryText = "text-[#5F6B7A]";
  const innerCard = "bg-[#F7F8FC] border-[#E5EAF5]";

  // Filter tasks based on searchQuery & selected view filter
  const getFilteredTasksList = () => {
    let list = [...tasks];
    if (filter === "pending") list = list.filter(t => t.status === "pending");
    else if (filter === "completed") list = list.filter(t => t.status === "completed");
    else if (filter === "ai") {
      const categoryOrder = {
        "Critical: Do Now": 1,
        "Important: Next": 2,
        "Malleable: Squeeze In": 3,
        "undefined": 4
      };
      list = [...tasks].sort((a, b) => {
        const orderA = categoryOrder[a.momentumCategory || "undefined"];
        const orderB = categoryOrder[b.momentumCategory || "undefined"];
        return orderA - orderB;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.category.toLowerCase().includes(q) || 
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return list;
  };

  const filteredTasks = getFilteredTasksList();

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Redesigned Tab Bar & Suite Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5EAF5]/80 pb-5">
        <div>
          <h2 className="font-outfit font-extrabold text-2xl tracking-tight text-[#1F2937] flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#5B6CFF]" />
            <span>Productivity Suite</span>
          </h2>
          <p className="text-[13px] text-[#5F6B7A] font-semibold">Organize targets, establish sustained routines, and synthesize hourly flow timelines</p>
        </div>
        
        {/* Segmented control for switching sub-tabs */}
        <div className="bg-[#F1F3FA]/80 p-1.5 rounded-2xl flex gap-1 self-start md:self-auto border border-[#E5EAF5]">
          {[
            { id: "tasks", label: "Tasks Matrix", icon: ListFilter },
            { id: "habits", label: "Habit Tracker", icon: Award },
            { id: "schedule", label: "Focus Agenda", icon: Clock }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setProductivitySubTab(id as any)}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer select-none ${
                productivitySubTab === id
                  ? "bg-white text-[#5B6CFF] shadow-[0_4px_12px_rgba(91,108,255,0.06)] scale-[1.01]"
                  : "text-[#5F6B7A] hover:text-[#1F2937]"
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform ${productivitySubTab === id ? 'scale-110 text-[#5B6CFF]' : 'text-[#5F6B7A]'}`} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* RENDER TASKS MODULE */}
      {productivitySubTab === "tasks" && (
        <div className="space-y-6">
          
          {/* Header Action Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#E5EAF5]/90 p-5.5 rounded-3xl shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#5B6CFF]/10 text-[#5B6CFF] rounded-lg">
                  <ListFilter className="w-4.5 h-4.5" />
                </span>
                <h3 className="font-outfit font-extrabold text-lg text-[#1F2937]">Task Matrix</h3>
              </div>
              <p className="text-xs font-semibold text-[#5F6B7A]">
                Currently displaying <span className="text-[#5B6CFF] font-black">{filteredTasks.length}</span> targets in your workflow
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Sleek pills for filter selection */}
              <div className="bg-[#F7F8FC] border border-[#E5EAF5] rounded-xl p-1.5 flex gap-1">
                {[
                  { key: "all", label: "All Tasks" },
                  { key: "pending", label: "Pending" },
                  { key: "completed", label: "Completed" },
                  { key: "ai", label: "💡 AI Priors" }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key as any)}
                    className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                      filter === key
                        ? "bg-white text-[#5B6CFF] shadow-xs"
                        : "text-[#5F6B7A] hover:text-[#1F2937]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className={`px-4.5 py-2.5 bg-[#5B6CFF] hover:bg-[#4758E8] text-white text-xs font-black rounded-xl hover:scale-[1.02] flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 ${showAddForm ? 'ring-2 ring-[#5B6CFF]/30' : ''}`}
              >
                <Plus className="w-4 h-4" />
                <span>{showAddForm ? "Close Form" : "Create Task"}</span>
              </button>
            </div>
          </div>

          {/* New Task Form */}
          {showAddForm && (
            <div className="bg-white border-2 border-[#5B6CFF]/20 rounded-3xl p-6.5 shadow-md relative overflow-hidden animate-fade-in space-y-5">
              {/* Accent Gradient strip */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#5B6CFF] via-[#7C8CFF] to-indigo-500" />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-outfit font-extrabold text-[17px] text-[#1F2937]">Create New Goal / Deadline</h4>
                  <p className="text-xs text-[#5F6B7A] font-semibold mt-0.5">Define your targets for customized micro-steps and stress-free planning</p>
                </div>
                {isListening && (
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </div>

              {speechFeedback && (
                <div className="text-[12px] font-bold px-3.5 py-2.5 bg-red-500/5 border border-red-500/15 rounded-xl text-red-600 flex items-center gap-2 animate-pulse">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce delay-150"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce delay-300"></span>
                  </div>
                  <span className="font-medium text-red-700/90">{speechFeedback}</span>
                </div>
              )}

              <form onSubmit={handleCreateTask} className="space-y-4.5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-[10px] font-extrabold text-[#5F6B7A] uppercase tracking-wider mb-1.5">Task Description / Title</label>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="e.g. Finish final academic thesis methodology citations"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full px-4.5 py-3 text-[14px] font-semibold rounded-xl outline-none border bg-[#F8FAFC] border-[#E5EAF5] text-[#1F2937] focus:bg-white focus:ring-4 focus:ring-[#5B6CFF]/10 focus:border-[#5B6CFF] transition-all"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`px-4.5 py-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                          isListening 
                            ? "bg-red-50 border-red-200 text-red-600 shadow-inner" 
                            : "bg-[#F8FAFC] border-[#E5EAF5] text-[#5F6B7A] hover:text-[#5B6CFF] hover:bg-[#EEF2FF] hover:border-[#5B6CFF]"
                        }`}
                        title="Voice Dictate Task"
                      >
                        {isListening ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-[10px] font-extrabold text-[#5F6B7A] uppercase tracking-wider mb-1.5">Strategic Details (AI consults these for tips and roadmap generation)</label>
                    <textarea
                      placeholder="e.g. Review pages 45-70, address notes from the supervisor, draft 3 reference links..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4.5 py-3 text-[14px] font-medium rounded-xl outline-none border h-18 resize-none bg-[#F8FAFC] border-[#E5EAF5] text-[#1F2937] focus:bg-white focus:ring-4 focus:ring-[#5B6CFF]/10 focus:border-[#5B6CFF] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-[#5F6B7A] uppercase tracking-wider mb-1.5">Due Date</label>
                    <input
                      type="date"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="w-full px-4 py-3 text-[14px] font-semibold rounded-xl outline-none border bg-[#F8FAFC] border-[#E5EAF5] text-[#1F2937] focus:bg-white focus:ring-4 focus:ring-[#5B6CFF]/10 focus:border-[#5B6CFF] transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-[#5F6B7A] uppercase tracking-wider mb-1.5">Due Time</label>
                    <input
                      type="time"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      className="w-full px-4 py-3 text-[14px] font-semibold rounded-xl outline-none border bg-[#F8FAFC] border-[#E5EAF5] text-[#1F2937] focus:bg-white focus:ring-4 focus:ring-[#5B6CFF]/10 focus:border-[#5B6CFF] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-[#5F6B7A] uppercase tracking-wider mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 text-[14px] font-semibold rounded-xl border outline-none bg-[#F8FAFC] border-[#E5EAF5] text-[#1F2937] focus:bg-white focus:ring-4 focus:ring-[#5B6CFF]/10 focus:border-[#5B6CFF] transition-all"
                    >
                      <option value="Academic">🎓 Academic</option>
                      <option value="Work">💼 Work</option>
                      <option value="Personal">🌱 Personal</option>
                      <option value="Admin">⚡ Admin</option>
                      <option value="Health">❤️ Health</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-[#5F6B7A] uppercase tracking-wider mb-1.5">Effort Estimate</label>
                    <select
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                      className="w-full px-4 py-3 text-[14px] font-semibold rounded-xl border outline-none bg-[#F8FAFC] border-[#E5EAF5] text-[#1F2937] focus:bg-white focus:ring-4 focus:ring-[#5B6CFF]/10 focus:border-[#5B6CFF] transition-all"
                    >
                      <option value={15}>⏱️ 15 mins (Quick Burst)</option>
                      <option value={30}>⏱️ 30 mins (Standard Block)</option>
                      <option value={45}>⏱️ 45 mins (Extended block)</option>
                      <option value={60}>⏱️ 60 mins (Heavy Focus)</option>
                      <option value={120}>⏱️ 120 mins (Syllabus Chunk)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-[#5F6B7A] uppercase tracking-wider mb-1.5">Stakes Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as PriorityType)}
                      className="w-full px-4 py-3 text-[14px] font-semibold rounded-xl border outline-none bg-[#F8FAFC] border-[#E5EAF5] text-[#1F2937] focus:bg-white focus:ring-4 focus:ring-[#5B6CFF]/10 focus:border-[#5B6CFF] transition-all"
                    >
                      <option value="low">🟢 Low stakes (Malleable)</option>
                      <option value="medium">🟡 Medium stakes (Important)</option>
                      <option value="high">🔴 High stakes (Critical)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-[#5F6B7A] uppercase tracking-wider mb-1.5">Inherent Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as DifficultyType)}
                      className="w-full px-4 py-3 text-[14px] font-semibold rounded-xl border outline-none bg-[#F8FAFC] border-[#E5EAF5] text-[#1F2937] focus:bg-white focus:ring-4 focus:ring-[#5B6CFF]/10 focus:border-[#5B6CFF] transition-all"
                    >
                      <option value="easy">🧩 Easy (Routine flow)</option>
                      <option value="medium">⚡ Medium (Concentration flow)</option>
                      <option value="hard">🔥 Hard (Anxiety blocker)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-[#F1F3FA]/70 border border-[#E5EAF5] rounded-2xl">
                  <input
                    type="checkbox"
                    id="markAsHabitInForm"
                    checked={markAsHabitInForm}
                    onChange={(e) => setMarkAsHabitInForm(e.target.checked)}
                    className="w-4.5 h-4.5 rounded-[6px] border-[#E5EAF5] text-[#5B6CFF] focus:ring-[#5B6CFF] cursor-pointer"
                  />
                  <label htmlFor="markAsHabitInForm" className="text-xs font-bold text-[#5F6B7A] cursor-pointer select-none">
                    Sync as a sustained Habit (Automatically log consistency checks)
                  </label>
                </div>

                <div className="flex justify-end gap-3.5 pt-1.5 border-t border-[#E5EAF5]/60">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-5 py-2.5 border border-[#E5EAF5] bg-white hover:bg-[#F7F8FC] text-[#5F6B7A] text-xs font-black rounded-xl cursor-pointer transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#5B6CFF] hover:bg-[#4758E8] text-white text-xs font-black rounded-xl cursor-pointer transition-all shadow-sm active:scale-95"
                  >
                    Register Deadline
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Render tasks list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTasks.length === 0 ? (
              <div className="col-span-2 bg-white border border-[#E5EAF5] rounded-[24px] p-12 text-center shadow-xs">
                <Check className="w-12 h-12 text-[#5B6CFF]/30 mx-auto mb-3.5" />
                <h4 className="font-outfit font-extrabold text-[17px] text-[#1F2937] mb-1">Clear Horizon</h4>
                <p className="text-xs text-[#5F6B7A] font-semibold max-w-sm mx-auto">No pending items found matching this filter. Register a goal above to harness Gemini productivity powerups!</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const deadlineData = formatDeadline(task.deadline);
                const isDone = task.status === "completed";

                // Border color indicator representing Priority Stakes
                const leftAccentColor = 
                  task.priority === "high" 
                    ? "border-l-red-500/90" 
                    : task.priority === "medium" 
                      ? "border-l-amber-500/90" 
                      : "border-l-[#5B6CFF]/90";

                return (
                  <div 
                    key={task.id} 
                    className={`bg-white border-2 border-l-4 ${leftAccentColor} border-[#E5EAF5]/80 hover:border-[#7C8CFF]/60 rounded-2xl p-6 relative transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between ${isDone ? 'opacity-65' : ''}`}
                    id={`task-card-${task.id}`}
                  >
                    <div>
                      {/* Top Action / Meta row */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getCategoryColor(task.category)}`}>
                            {task.category}
                          </span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider ${task.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' : task.priority === 'medium' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                            {task.priority} Stakes
                          </span>
                          {task.difficulty && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-100 uppercase tracking-wider">
                              {task.difficulty}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 text-[#5F6B7A]/50 hover:text-red-500 hover:bg-red-50 rounded-xl cursor-pointer transition-all shrink-0"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Main Title & Checkbox */}
                      <div className="flex items-start gap-3">
                        <button 
                          onClick={() => handleToggleTaskStatus(task.id)}
                          className={`mt-0.5 shrink-0 cursor-pointer p-0.5 rounded-full transition-all hover:scale-110 active:scale-95 ${isDone ? 'text-[#5B6CFF]' : 'text-slate-300 hover:text-[#5B6CFF]'}`}
                          id={`task-toggle-btn-${task.id}`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5.5 h-5.5 fill-current text-[#5B6CFF]" />
                          ) : (
                            <Circle className="w-5.5 h-5.5 text-slate-300 hover:text-[#5B6CFF]" />
                          )}
                        </button>

                        <div className="space-y-1.5 flex-1">
                          <h4 className={`font-outfit font-extrabold text-[15px] leading-snug tracking-tight ${isDone ? 'line-through text-[#5F6B7A]/80 font-medium' : 'text-[#1F2937]'}`}>
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-[12px] text-[#5F6B7A] font-semibold leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Estimates & Deadlines */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-3.5 pb-2.5 text-[12px] text-[#5F6B7A] font-bold border-b border-slate-100">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Estimate: <span className="text-[#1F2937] tabular-nums">{task.estimated_minutes}m</span></span>
                        </div>
                        <span className="text-slate-300">|</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase ${deadlineData.urgencyClass}`}>
                            {deadlineData.urgencyLabel || deadlineData.formatted}
                          </span>
                        </div>
                      </div>

                      {/* AI Coaching Tips */}
                      {task.aiTip && (
                        <div className="mt-3.5 p-3.5 bg-[#F8FAFC] border border-slate-100 rounded-xl text-[12px] font-semibold text-[#1F2937] leading-relaxed relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-1.5 opacity-10">
                            <Sparkles className="w-10 h-10 text-[#5B6CFF]" />
                          </div>
                          <span className="text-[#5B6CFF] font-black mr-1">💡 Coach Tip:</span>
                          <span className="italic">{task.aiTip}</span>
                        </div>
                      )}

                      {/* Nested Exploded Subtasks */}
                      {task.subtasks && task.subtasks.length > 0 && (() => {
                        const isSubtasksCollapsed = collapsedSubtasks[task.id] !== false;
                        if (isSubtasksCollapsed) return null;
                        return (
                          <div className="mt-4 p-4 bg-indigo-50/20 border border-indigo-100/30 rounded-2xl space-y-3" id={`task-subtasks-${task.id}`}>
                            <div className="text-[10px] font-black text-[#5B6CFF] uppercase tracking-widest flex items-center justify-between gap-1.5 select-none">
                              <span className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                <span>Exploded Micro-Steps ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleSubtasksCollapse(task.id)}
                                className="p-1 hover:bg-[#5B6CFF]/10 rounded-lg transition-colors flex items-center justify-center cursor-pointer focus:outline-hidden"
                                title="Hide micro-steps"
                              >
                                <ChevronDown className="w-3.5 h-3.5 text-[#5B6CFF]" />
                              </button>
                            </div>
                            <div className="space-y-2.5 relative border-l-2 border-dashed border-[#5B6CFF]/20 pl-4.5 ml-1.5 animate-fade-in">
                              {task.subtasks.map((st) => (
                                <label 
                                  key={st.id} 
                                  className="flex items-center gap-3 text-xs font-bold text-[#1F2937] cursor-pointer group"
                                >
                                  <input 
                                    type="checkbox"
                                    disabled={isDone}
                                    checked={st.completed}
                                    onChange={() => onToggleSubtask(task.id, st.id)}
                                    className="w-4.5 h-4.5 rounded border-slate-300 text-[#5B6CFF] focus:ring-[#5B6CFF] cursor-pointer"
                                  />
                                  <span className={`transition-all group-hover:text-[#5B6CFF] ${st.completed ? "line-through text-slate-400" : ""}`}>
                                    {typeof st.title === "string"
                                      ? st.title
                                      : typeof st.title === "object" && st.title !== null
                                        ? `${(st.title as any).title || ""}${(st.title as any).estimated_minutes ? ` (${(st.title as any).estimated_minutes}m)` : ""}`
                                        : String(st.title || "")}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Study Strategy / Academic Roadmap */}
                      {task.academicRoadmap && task.academicRoadmap.length > 0 && (() => {
                        const isRoadmapCollapsed = collapsedRoadmaps[task.id] !== false;
                        if (isRoadmapCollapsed) return null;
                        return (
                          <div className="mt-4 p-4 bg-cyan-50/20 border border-cyan-100/30 rounded-2xl space-y-3" id={`task-roadmap-${task.id}`}>
                            <div className="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex items-center justify-between gap-1.5 select-none">
                              <span className="flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5 text-cyan-500" />
                                <span>Study strategic prep blueprint</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRoadmapCollapse(task.id)}
                                className="p-1 hover:bg-cyan-100/30 rounded-lg transition-colors flex items-center justify-center cursor-pointer focus:outline-hidden"
                                title="Hide strategy"
                              >
                                <ChevronDown className="w-3.5 h-3.5 text-cyan-500" />
                              </button>
                            </div>
                            <div className="space-y-3 relative border-l-2 border-cyan-200/50 pl-4 ml-1.5 animate-fade-in">
                              {task.academicRoadmap.map((p, idx) => (
                                <div key={idx} className="relative">
                                  <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-cyan-400 border-2 border-white ring-2 ring-cyan-100" />
                                  <p className="text-xs font-extrabold text-[#1F2937] leading-none">
                                    {p.phase} <span className="font-bold text-cyan-600 font-mono text-[9px] bg-cyan-50 border border-cyan-100 px-1.5 py-0.5 rounded-md">({p.hoursNeeded} hrs)</span>
                                  </p>
                                  <p className="text-[11px] text-[#5F6B7A] font-semibold mt-1.5 leading-normal">{p.details}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Footer AI Actions */}
                    <div className="flex flex-wrap gap-2.5 pt-4 mt-4 border-t border-slate-100">
                      {task.subtasks && task.subtasks.length > 0 ? (() => {
                        const isSubtasksCollapsed = collapsedSubtasks[task.id] !== false;
                        return (
                          <button
                            type="button"
                            onClick={() => toggleSubtasksCollapse(task.id)}
                            className="px-3 py-2 rounded-xl border text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 bg-indigo-50 border-indigo-100 text-[#5B6CFF] hover:bg-indigo-100/30"
                          >
                            <span>{isSubtasksCollapsed ? "👁️ Show Micro-Steps" : "🙈 Hide Micro-Steps"}</span>
                          </button>
                        );
                      })() : (
                        <button
                          type="button"
                          disabled={explodingTaskId === task.id || isDone}
                          onClick={() => {
                            setCollapsedSubtasks(prev => ({ ...prev, [task.id]: false }));
                            onExplodeTask(task.id);
                          }}
                          className={`px-3 py-2 rounded-xl border text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                            explodingTaskId === task.id 
                              ? "bg-indigo-50 border-indigo-200 text-[#5B6CFF]" 
                              : "bg-[#F8FAFC] hover:bg-indigo-50/50 border-[#E5EAF5] text-[#5B6CFF] hover:border-[#5B6CFF]/30"
                          }`}
                        >
                          {explodingTaskId === task.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Exploding...</span>
                            </>
                          ) : (
                            <>
                              <span>💥 Explode Steps</span>
                            </>
                          )}
                        </button>
                      )}

                      {task.academicRoadmap && task.academicRoadmap.length > 0 ? (() => {
                        const isRoadmapCollapsed = collapsedRoadmaps[task.id] !== false;
                        return (
                          <button
                            type="button"
                            onClick={() => toggleRoadmapCollapse(task.id)}
                            className="px-3 py-2 rounded-xl border text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 bg-cyan-50 border-cyan-100 text-cyan-600 hover:bg-cyan-100/30"
                          >
                            <span>{isRoadmapCollapsed ? "👁️ Show Study Strategy" : "🙈 Hide Study Strategy"}</span>
                          </button>
                        );
                      })() : (
                        <button
                          type="button"
                          disabled={roadmappingTaskId === task.id || isDone}
                          onClick={() => {
                            setCollapsedRoadmaps(prev => ({ ...prev, [task.id]: false }));
                            onGenerateAcademicStrategy(task.id);
                          }}
                          className={`px-3 py-2 rounded-xl border text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                            roadmappingTaskId === task.id 
                              ? "bg-cyan-50 border-cyan-200 text-cyan-600" 
                              : "bg-[#F8FAFC] hover:bg-cyan-50/50 border-[#E5EAF5] text-cyan-600 hover:border-cyan-200/50"
                          }`}
                        >
                          {roadmappingTaskId === task.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Strategizing...</span>
                            </>
                          ) : (
                            <>
                              <span>🎓 Study Strategy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* RENDER HABITS MODULE */}
      {productivitySubTab === "habits" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white border border-[#E5EAF5] p-5.5 rounded-3xl shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#5B6CFF]/10 text-[#5B6CFF] rounded-lg">
                  <Award className="w-4.5 h-4.5" />
                </span>
                <h3 className="font-outfit font-extrabold text-lg text-[#1F2937]">Sustained Habits</h3>
              </div>
              <p className="text-xs font-semibold text-[#5F6B7A]">Maintain streaks and build continuous muscle memory</p>
            </div>
            
            <button
              onClick={() => setShowHabitForm(!showHabitForm)}
              className="px-4.5 py-2.5 bg-[#5B6CFF] hover:bg-[#4758E8] text-white text-xs font-black rounded-xl hover:scale-[1.02] flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{showHabitForm ? "Hide Form" : "Create Habit"}</span>
            </button>
          </div>

          {/* Quick-add templates with nice tag badges */}
          <div className="bg-white border border-[#E5EAF5] rounded-3xl p-5.5 space-y-3 shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🌿</span>
              <span className="text-[10px] font-black text-[#5F6B7A] uppercase tracking-wider block">Standard Mental-Recovery Presets</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {[
                { name: "Drink 500ml Water", emoji: "💧" },
                { name: "3-Min Breath loop", emoji: "🧘" },
                { name: "10-Min Walk Loop", emoji: "🚶" },
                { name: "Write 3 Citations", emoji: "✍️" },
                { name: "Close Tabs for 5m", emoji: "🛑" }
              ].map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => handleCreateQuickHabit(tpl.name)}
                  className="px-3.5 py-2.5 text-xs font-black rounded-xl border border-[#E5EAF5] bg-[#F7F8FC] text-[#5F6B7A] hover:text-[#5B6CFF] hover:border-[#5B6CFF]/40 hover:bg-[#EEF2FF] cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-1.5 active:scale-95"
                >
                  <span className="text-sm">{tpl.emoji}</span>
                  <span>{tpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Habit Form */}
          {showHabitForm && (
            <div className="bg-white border-2 border-[#5B6CFF]/20 rounded-2xl p-5 shadow-sm animate-fade-in">
              <form onSubmit={handleCreateHabit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="e.g. Stretch neck and wrists every hour"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="flex-1 px-4.5 py-3 text-[14px] font-semibold rounded-xl outline-none border bg-[#F8FAFC] border-[#E5EAF5] text-[#1F2937] focus:bg-white focus:ring-4 focus:ring-[#5B6CFF]/10 focus:border-[#5B6CFF] transition-all"
                  required
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-[#5B6CFF] hover:bg-[#4758E8] text-white text-xs font-black rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
                >
                  Create Habit
                </button>
              </form>
            </div>
          )}

          {/* Habits grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {habits.length === 0 ? (
              <div className="col-span-2 bg-white border border-[#E5EAF5] rounded-[24px] p-12 text-center shadow-xs">
                <Award className="w-12 h-12 text-[#5B6CFF]/30 mx-auto mb-3.5" />
                <h4 className="font-outfit font-extrabold text-[17px] text-[#1F2937] mb-1">Establish Routines</h4>
                <p className="text-xs text-[#5F6B7A] font-semibold max-w-sm mx-auto">No custom habits recorded yet. Adopt a standard preset above to kick off your consistency logs!</p>
              </div>
            ) : (
              habits.map((habit) => {
                const doneToday = isHabitDoneToday(habit);
                const currentStreak = habit.streak || 0;

                return (
                  <div 
                    key={habit.id} 
                    className={`bg-white border-2 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm ${
                      doneToday 
                        ? 'border-emerald-500/20 bg-gradient-to-r from-emerald-50/10 to-teal-50/10 shadow-emerald-500/2' 
                        : 'border-[#E5EAF5]/80 hover:border-[#7C8CFF]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <button
                          onClick={() => handleToggleHabitDay(habit)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer active:scale-90 ${
                            doneToday 
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' 
                              : 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-300 hover:text-emerald-500'
                          }`}
                          id={`habit-toggle-btn-${habit.id}`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                        
                        <div>
                          <h4 className={`font-outfit font-extrabold text-[15px] leading-tight ${doneToday ? 'text-slate-700 font-bold' : 'text-[#1F2937]'}`}>
                            {habit.name}
                          </h4>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 flex items-center gap-1 shadow-2xs">
                              <span>🔥</span>
                              <span>{currentStreak} Day streak</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-2 text-[#5F6B7A]/50 hover:text-red-500 hover:bg-red-50 rounded-xl cursor-pointer transition-all shrink-0"
                        title="Remove habit"
                        id={`habit-delete-btn-${habit.id}`}
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* RENDER HOURLY AGENDA MODULE */}
      {productivitySubTab === "schedule" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E5EAF5] p-5.5 rounded-3xl shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#5B6CFF]/10 text-[#5B6CFF] rounded-lg">
                  <Clock className="w-4.5 h-4.5" />
                </span>
                <h3 className="font-outfit font-extrabold text-lg text-[#1F2937]">Today's Focus Agenda</h3>
              </div>
              <p className="text-xs font-semibold text-[#5F6B7A]">Hourly timeline customized dynamically to balance focus and breaks</p>
            </div>
            
            <button
              onClick={handleAIGeneratePlan}
              disabled={aiPlanning}
              className="px-4.5 py-2.5 bg-[#5B6CFF] hover:bg-[#4758E8] text-white text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-md active:scale-95"
              id="generate-timeline-btn"
            >
              {aiPlanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Structuring Timeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>Generate Focus Schedule</span>
                </>
              )}
            </button>
          </div>

          {/* Encouragement Mantra */}
          {planMantra && (
            <div className="p-4.5 rounded-[18px] border text-xs font-extrabold italic flex gap-3 bg-gradient-to-r from-indigo-500/5 to-[#5B6CFF]/5 border-[#5B6CFF]/15 text-[#5B6CFF] relative overflow-hidden shadow-2xs">
              <span className="text-lg select-none">💬</span>
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-widest text-[#5B6CFF]/70 font-black block">Gemini Focus Mantra</span>
                <p className="leading-relaxed">&ldquo;{planMantra}&rdquo;</p>
              </div>
            </div>
          )}

          {/* Agenda slot lists */}
          {currentPlan.length === 0 ? (
            <div className="bg-white border border-[#E5EAF5] rounded-[24px] p-12 text-center shadow-sm flex flex-col items-center justify-center">
              <Calendar className="w-12 h-12 text-[#5B6CFF]/30 mx-auto mb-3.5" />
              <h4 className="font-outfit font-extrabold text-[17px] text-[#1F2937] mb-1">Timeline Unscheduled</h4>
              <p className="text-xs text-[#5F6B7A] font-semibold max-w-sm mx-auto mb-5 leading-relaxed">
                Connect your targets together. Let Gemini generate an hourly workflow timeline with buffer zones and cognitive recovery slots.
              </p>
              <button
                onClick={handleAIGeneratePlan}
                disabled={aiPlanning}
                className="px-5 py-3 bg-[#5B6CFF] hover:bg-[#4758E8] text-white text-xs font-black rounded-xl cursor-pointer inline-flex items-center gap-2 transition-all active:scale-95 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Build Schedule</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4.5 relative before:absolute before:inset-y-0 before:left-6.5 before:w-[3px] before:bg-slate-100 pl-1">
              {currentPlan.map((slot, idx) => {
                const isRest = slot.type === 'break' || slot.type === 'buffer';
                
                return (
                  <div key={idx} className="flex gap-4 relative z-10 animate-fade-in">
                    {/* Circle time indicator */}
                    <div className={`w-13 h-13 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 font-outfit text-center shadow-xs transition-transform hover:scale-105 ${
                      isRest 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'bg-[#5B6CFF] border-[#5B6CFF] text-white'
                    }`}>
                      <span className="text-[10px] font-black leading-none uppercase">{slot.startTime.split(" ")[1] || ""}</span>
                      <span className="text-xs font-extrabold leading-tight mt-0.5">{slot.startTime.split(" ")[0]}</span>
                    </div>

                    <div className="flex-1 bg-white border border-[#E5EAF5] rounded-2xl p-5 hover:border-[#7C8CFF]/50 transition-all hover:shadow-xs">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] text-[#5F6B7A] font-black uppercase tracking-wider">{slot.startTime} - {slot.endTime}</span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                            isRest ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-[#EEF2FF] text-[#5B6CFF] border-[#5B6CFF]/15'
                          }`}>
                            {slot.type}
                          </span>
                        </div>
                        
                        <h5 className="font-outfit font-extrabold text-[15px] mt-2 text-[#1F2937]">
                          {slot.label}
                        </h5>
                        
                        {slot.advice && (
                          <div className="text-xs text-[#5F6B7A] font-semibold italic mt-2.5 flex items-start gap-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                            <span className="text-[#5B6CFF] text-xs">💡</span>
                            <span className="leading-relaxed">&ldquo;{slot.advice}&rdquo;</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* AI recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-white border border-[#E5EAF5] rounded-3xl p-6.5 space-y-4 shadow-xs animate-fade-in">
              <h5 className="font-outfit font-extrabold text-[15px] flex items-center gap-2 text-[#1F2937]">
                <Award className="w-5 h-5 text-[#5B6CFF]" />
                <span>Stress Mitigation Recommendations</span>
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {recommendations.map((rec, i) => (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-[#5F6B7A] flex items-start gap-3 leading-relaxed">
                    <span className="text-[#5B6CFF] select-none text-sm leading-none">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
