import React from "react";
import { 
  Zap, Plus, Calendar, Clock, CheckCircle2, Circle, Trash2, 
  Sparkles, AlertCircle, RefreshCw, Eye, Award, HelpCircle, 
  Mic, MicOff, ChevronRight, Sliders, Check, ListFilter, Play, Bookmark 
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
    <div className="space-y-8">
      
      {/* Sub-Tabs Switches */}
      <div className="flex border-b border-[#E5EAF5] pb-px">
        <div className="flex gap-4">
          {(["tasks", "habits", "schedule"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setProductivitySubTab(tab)}
              className={`px-6 py-3.5 text-[15px] font-semibold transition-all relative shrink-0 cursor-pointer ${
                productivitySubTab === tab 
                  ? "text-[#5B6CFF]" 
                  : "text-[#5F6B7A] hover:text-[#1F2937]"
              }`}
            >
              <span className="capitalize">{tab === "schedule" ? "Focus Agenda" : tab}</span>
              {productivitySubTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#5B6CFF] rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* RENDER TASKS MODULE */}
      {productivitySubTab === "tasks" && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className={`font-outfit font-semibold text-[22px] ${textColor}`}>Your Task Matrix</h3>
              <p className={`text-[15px] font-medium ${secondaryText}`}>Catalog your academic and professional targets</p>
            </div>

            {/* Form expansion trigger & filter filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="border border-[#E5EAF5] rounded-[14px] p-1.5 flex gap-1.5 bg-[#F7F8FC]">
                {(["all", "pending", "completed", "ai"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3.5 py-2 text-[13px] font-semibold rounded-[10px] cursor-pointer transition-all ${
                      filter === f 
                        ? (f === "ai" ? "bg-[#5B6CFF] text-white shadow-sm" : "bg-white text-[#1F2937] shadow-xs") 
                        : "text-[#5F6B7A] hover:text-[#1F2937]"
                    }`}
                  >
                    {f === "ai" ? "💡 AI Priors" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2.5 bg-[#5B6CFF] hover:bg-[#4758E8] text-white text-[15px] font-semibold rounded-[14px] hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer transition-all duration-250 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* New Task Form */}
          {showAddForm && (
            <div className={`custom-card p-6 border ${cardBg} space-y-4 animate-fade-in`}>
              <h4 className="font-outfit font-semibold text-[18px] text-[#5B6CFF]">Register a High-Stakes Deadline</h4>
              
              {speechFeedback && (
                <div className="text-[10px] font-bold px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-500 flex items-center gap-2 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                  <span>{speechFeedback}</span>
                </div>
              )}

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-2">Task Title</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Finish final thesis bibliography citations"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="flex-1 px-4.5 py-3 text-[15px] font-medium rounded-[14px] outline-none border bg-[#F7F8FC] border-[#E5EAF5] text-[#1F2937] focus:ring-4 focus:ring-[#5B6CFF]/12 focus:border-[#5B6CFF]"
                        required
                      />
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`px-4.5 py-3 rounded-[14px] border flex items-center justify-center transition-all cursor-pointer ${
                          isListening 
                            ? "bg-rose-50 border-rose-200 text-rose-600" 
                            : "bg-[#F7F8FC] border-[#E5EAF5] text-[#5F6B7A] hover:text-[#5B6CFF] hover:bg-[#EEF2FF]"
                        }`}
                        title="Voice Add Task"
                      >
                        {isListening ? <MicOff className="w-4 h-4 text-rose-500" /> : <Mic className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-2">Description (details for AI coach tip generation)</label>
                    <textarea
                      placeholder="List references or requirements..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4.5 py-3 text-[15px] font-medium rounded-[14px] outline-none border h-20 resize-none bg-[#F7F8FC] border-[#E5EAF5] text-[#1F2937] focus:ring-4 focus:ring-[#5B6CFF]/12 focus:border-[#5B6CFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-2">Due Date</label>
                    <input
                      type="date"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="w-full px-4.5 py-3 text-[15px] font-medium rounded-[14px] outline-none border bg-[#F7F8FC] border-[#E5EAF5] text-[#1F2937] focus:ring-4 focus:ring-[#5B6CFF]/12 focus:border-[#5B6CFF]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-2">Due Time</label>
                    <input
                      type="time"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      className="w-full px-4.5 py-3 text-[15px] font-medium rounded-[14px] outline-none border bg-[#F7F8FC] border-[#E5EAF5] text-[#1F2937] focus:ring-4 focus:ring-[#5B6CFF]/12 focus:border-[#5B6CFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4.5 py-3 text-[15px] font-medium rounded-[14px] border outline-none bg-[#F7F8FC] border-[#E5EAF5] text-[#1F2937] focus:ring-4 focus:ring-[#5B6CFF]/12 focus:border-[#5B6CFF]"
                    >
                      <option value="Academic">Academic</option>
                      <option value="Work">Work</option>
                      <option value="Personal">Personal</option>
                      <option value="Admin">Admin</option>
                      <option value="Health">Health</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-2">Effort Estimate (minutes)</label>
                    <select
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                      className="w-full px-4.5 py-3 text-[15px] font-medium rounded-[14px] border outline-none bg-[#F7F8FC] border-[#E5EAF5] text-[#1F2937] focus:ring-4 focus:ring-[#5B6CFF]/12 focus:border-[#5B6CFF]"
                    >
                      <option value={15}>15 mins (Quick Burst)</option>
                      <option value={30}>30 mins (Standard Block)</option>
                      <option value={45}>45 mins (Extended)</option>
                      <option value={60}>60 mins (Heavy Focus)</option>
                      <option value={120}>120 mins (Syllabus Chunk)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-2">Stakes Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as PriorityType)}
                      className="w-full px-4.5 py-3 text-[15px] font-medium rounded-[14px] border outline-none bg-[#F7F8FC] border-[#E5EAF5] text-[#1F2937] focus:ring-4 focus:ring-[#5B6CFF]/12 focus:border-[#5B6CFF]"
                    >
                      <option value="low">Low stakes (Malleable)</option>
                      <option value="medium">Medium stakes (Important)</option>
                      <option value="high">High stakes (Critical)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-2">Inherent Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as DifficultyType)}
                      className="w-full px-4.5 py-3 text-[15px] font-medium rounded-[14px] border outline-none bg-[#F7F8FC] border-[#E5EAF5] text-[#1F2937] focus:ring-4 focus:ring-[#5B6CFF]/12 focus:border-[#5B6CFF]"
                    >
                      <option value="easy">Easy (Routine tasks)</option>
                      <option value="medium">Medium (Requires focus)</option>
                      <option value="hard">Hard (Extreme anxiety)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-3">
                  <input
                    type="checkbox"
                    id="markAsHabitInForm"
                    checked={markAsHabitInForm}
                    onChange={(e) => setMarkAsHabitInForm(e.target.checked)}
                    className="w-4.5 h-4.5 rounded-[6px] border-[#E5EAF5] text-[#5B6CFF] focus:ring-[#5B6CFF]"
                  />
                  <label htmlFor="markAsHabitInForm" className="text-[13px] font-semibold text-[#5F6B7A] cursor-pointer">
                    Sync as a sustained Habit (Automatically log consistency checks)
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-5 py-3 border border-[#E5EAF5] bg-white hover:bg-[#F7F8FC] text-[#5F6B7A] text-[15px] font-semibold rounded-[14px] cursor-pointer transition-all duration-250 hover:scale-[1.02]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-[#5B6CFF] hover:bg-[#4758E8] text-white text-[15px] font-semibold rounded-[14px] cursor-pointer transition-all duration-250 hover:scale-[1.02] shadow-sm"
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
              <div className="col-span-2 custom-card p-10 text-center bg-white border border-[#E5EAF5] rounded-[20px]">
                <Check className="w-12 h-12 text-[#5B6CFF]/40 mx-auto mb-3" />
                <p className="text-[15px] text-[#5F6B7A] font-semibold">No tasks found. Relax or register a task above!</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const deadlineData = formatDeadline(task.deadline);
                const isDone = task.status === "completed";

                return (
                  <div 
                    key={task.id} 
                    className={`custom-card p-6 border relative transition-all duration-250 hover:scale-[1.02] ${cardBg} ${isDone ? 'opacity-65' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <button 
                          onClick={() => handleToggleTaskStatus(task.id)}
                          className={`mt-1 shrink-0 cursor-pointer ${isDone ? 'text-[#5B6CFF]' : 'text-[#5F6B7A]/40 hover:text-[#5B6CFF] transition-colors'}`}
                        >
                          {isDone ? <CheckCircle2 className="w-5.5 h-5.5 fill-current" /> : <Circle className="w-5.5 h-5.5" />}
                        </button>
                        
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getCategoryColor(task.category)}`}>
                              {task.category}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${task.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-100' : task.priority === 'medium' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>
                              {task.priority} stakes
                            </span>
                          </div>
                          
                          <h4 className={`font-outfit font-semibold text-[16px] leading-snug ${isDone ? 'line-through text-[#5F6B7A] font-medium' : 'text-[#1F2937]'}`}>
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-[13px] text-[#5F6B7A] font-medium leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            <Clock className="w-4 h-4 text-[#5F6B7A]" />
                            <span className="text-[13px] text-[#5F6B7A] font-semibold tabular-nums">
                              Estimate: {task.estimated_minutes}m
                            </span>
                            <span className="text-[#E5EAF5]">|</span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${deadlineData.urgencyClass}`}>
                              {deadlineData.urgencyLabel || deadlineData.formatted}
                            </span>
                          </div>

                          {task.aiTip && (
                            <div className="mt-3 p-3 rounded-[12px] text-[13px] italic font-medium border bg-[#F7F8FC] border-[#E5EAF5] text-[#1F2937]">
                              💡 {task.aiTip}
                            </div>
                          )}

                          {/* Interactive AI Actions */}
                          <div className="flex flex-wrap gap-2 pt-3">
                            <button
                              type="button"
                              disabled={explodingTaskId === task.id || isDone}
                              onClick={() => onExplodeTask(task.id)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                                explodingTaskId === task.id 
                                  ? "bg-indigo-50 border-indigo-200 text-[#5B6CFF]" 
                                  : "bg-[#F7F8FC] hover:bg-indigo-50/50 border-[#E5EAF5] text-[#5B6CFF] hover:border-indigo-200"
                              }`}
                            >
                              {explodingTaskId === task.id ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Exploding...</span>
                                </>
                              ) : (
                                <>
                                  <span>💥 Explode Steps</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={roadmappingTaskId === task.id || isDone}
                              onClick={() => onGenerateAcademicStrategy(task.id)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                                roadmappingTaskId === task.id 
                                  ? "bg-cyan-50 border-cyan-200 text-cyan-600" 
                                  : "bg-[#F7F8FC] hover:bg-cyan-50/50 border-[#E5EAF5] text-cyan-600 hover:border-cyan-200"
                              }`}
                            >
                              {roadmappingTaskId === task.id ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Strategizing...</span>
                                </>
                              ) : (
                                <>
                                  <span>🎓 Study Strategy</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Exploded Subtasks checklist */}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="mt-3.5 p-3.5 bg-indigo-50/30 border border-indigo-100/30 rounded-xl space-y-2.5" id={`task-subtasks-${task.id}`}>
                              <p className="text-[11px] font-bold text-[#5B6CFF] uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Exploded Micro-Steps</span>
                              </p>
                              <div className="space-y-2">
                                {task.subtasks.map((st) => (
                                  <label 
                                    key={st.id} 
                                    className="flex items-center gap-2.5 text-xs font-semibold text-[#1F2937] cursor-pointer"
                                  >
                                    <input 
                                      type="checkbox"
                                      disabled={isDone}
                                      checked={st.completed}
                                      onChange={() => onToggleSubtask(task.id, st.id)}
                                      className="w-4 h-4 rounded border-gray-300 text-[#5B6CFF] focus:ring-[#5B6CFF]"
                                    />
                                    <span className={st.completed ? "line-through text-gray-400" : ""}>{st.title}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Academic Roadmap Phases details list */}
                          {task.academicRoadmap && task.academicRoadmap.length > 0 && (
                            <div className="mt-3.5 p-3.5 bg-cyan-50/30 border border-cyan-100/30 rounded-xl space-y-3" id={`task-roadmap-${task.id}`}>
                              <p className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5 text-cyan-500" />
                                <span>Academic Prep Strategic Roadmap</span>
                              </p>
                              <div className="space-y-2.5 relative border-l border-cyan-200/50 pl-3.5 ml-1.5">
                                {task.academicRoadmap.map((p, idx) => (
                                  <div key={idx} className="relative">
                                    <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-white" />
                                    <p className="text-xs font-bold text-[#1F2937] leading-none">{p.phase} <span className="font-semibold text-cyan-600 font-mono text-[10px]">({p.hoursNeeded} hrs)</span></p>
                                    <p className="text-[11px] text-[#5F6B7A] font-medium mt-1 leading-normal">{p.details}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 text-[#5F6B7A]/60 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer shrink-0 transition-all duration-200"
                        title="Delete task"
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

      {/* RENDER HABITS MODULE */}
      {productivitySubTab === "habits" && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-outfit font-semibold text-[22px] ${textColor}`}>Sustained Habits</h3>
              <p className={`text-[15px] font-medium ${secondaryText}`}>Protect your physical and mental energy</p>
            </div>
            
            <button
              onClick={() => setShowHabitForm(!showHabitForm)}
              className="px-4 py-2.5 bg-[#5B6CFF] hover:bg-[#4758E8] text-white text-[15px] font-semibold rounded-[14px] hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer transition-all duration-250 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Habit</span>
            </button>
          </div>

          {/* Quick-add templates */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider block mb-2">🌿 Standard Mental-Recovery Presets</span>
            <div className="flex flex-wrap gap-2.5">
              {[
                { name: "💧 Drink 500ml Water", emoji: "💧" },
                { name: "🧘 3-Min Diaphragmatic Breath", emoji: "🧘" },
                { name: "🚶 10-Min Outdoor Air Loop", emoji: "🚶" },
                { name: "✍️ Write Down 3 Citations", emoji: "✍️" },
                { name: "🛑 Close Tabs for 5 Mins", emoji: "🛑" }
              ].map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => handleCreateQuickHabit(tpl.name)}
                  className="px-4 py-2.5 text-[13px] font-semibold rounded-[14px] border border-[#E5EAF5] bg-[#F7F8FC] text-[#5F6B7A] hover:text-[#5B6CFF] hover:border-[#5B6CFF] hover:bg-[#EEF2FF] cursor-pointer transition-all duration-250 hover:scale-[1.02] flex items-center gap-1.5"
                >
                  <span>{tpl.emoji}</span>
                  <span>{tpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Habit Form */}
          {showHabitForm && (
            <div className={`custom-card p-6 border ${cardBg} animate-fade-in`}>
              <form onSubmit={handleCreateHabit} className="flex gap-2.5">
                <input
                  type="text"
                  placeholder="e.g. Stretch neck and wrists"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="flex-1 px-4.5 py-3 text-[15px] font-medium rounded-[14px] outline-none border bg-[#F7F8FC] border-[#E5EAF5] text-[#1F2937] focus:ring-4 focus:ring-[#5B6CFF]/12 focus:border-[#5B6CFF]"
                  required
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-[#5B6CFF] hover:bg-[#4758E8] text-white text-[15px] font-semibold rounded-[14px] cursor-pointer transition-all duration-250 hover:scale-[1.02] shadow-sm"
                >
                  Create Habit
                </button>
              </form>
            </div>
          )}

          {/* Habits Check Matrix list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {habits.length === 0 ? (
              <div className="col-span-2 custom-card p-10 text-center bg-white border border-[#E5EAF5] rounded-[20px]">
                <Award className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-bounce" />
                <p className="text-[15px] text-[#5F6B7A] font-semibold">No active habits. Pick a mental-recovery preset above to start!</p>
              </div>
            ) : (
              habits.map((habit) => {
                const doneToday = isHabitDoneToday(habit);
                const currentStreak = habit.streak || 0;

                return (
                  <div 
                    key={habit.id} 
                    className={`custom-card p-6 border transition-all duration-250 hover:scale-[1.02] ${cardBg} ${doneToday ? 'border-emerald-500/25 shadow-emerald-500/5 bg-gradient-to-r from-emerald-50/20 to-teal-50/20' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <button
                          onClick={() => handleToggleHabitDay(habit)}
                          className={`p-2 rounded-[12px] border transition-all cursor-pointer ${
                            doneToday 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                              : 'border-[#E5EAF5] hover:border-emerald-500 text-[#5F6B7A]/40'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                        
                        <div>
                          <h4 className={`font-outfit font-semibold text-[16px] ${textColor}`}>
                            {habit.name}
                          </h4>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                              🔥 {currentStreak}-day streak
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1.5 text-[#5F6B7A]/60 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer shrink-0 transition-all duration-200"
                        title="Remove habit"
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
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className={`font-outfit font-semibold text-[22px] ${textColor}`}>Today's Focus Agenda</h3>
              <p className={`text-[15px] font-medium ${secondaryText}`}>Hourly timeline structured by Gemini to avoid burn-out</p>
            </div>
            
            <button
              onClick={handleAIGeneratePlan}
              disabled={aiPlanning}
              className="px-5 py-3 bg-[#5B6CFF] hover:bg-[#4758E8] text-white text-[15px] font-semibold rounded-[14px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all duration-250 hover:scale-[1.02] shadow-sm"
            >
              {aiPlanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Structuring Timeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Ask Gemini to Generate Plan</span>
                </>
              )}
            </button>
          </div>

          {/* Plan Encouragement Mantra */}
          {planMantra && (
            <div className="p-4.5 rounded-[16px] border text-[15px] font-medium italic flex gap-3 bg-indigo-50/40 border-indigo-100/60 text-[#5B6CFF]">
              <span className="text-base select-none">💬</span>
              <p>&ldquo;{planMantra}&rdquo;</p>
            </div>
          )}

          {/* Agenda slot lists */}
          {currentPlan.length === 0 ? (
            <div className={`custom-card p-10 text-center ${cardBg} flex flex-col items-center justify-center`}>
              <Calendar className="w-12 h-12 text-[#5B6CFF]/40 mx-auto mb-3" />
              <h5 className={`font-outfit font-semibold text-[18px] mb-1 ${textColor}`}>No Agenda Generated</h5>
              <p className="text-[15px] text-[#5F6B7A] max-w-sm mx-auto leading-relaxed mb-4">
                You have pending deadlines. Let Gemini evaluate your tasks and output an hourly timeline with dedicated rest breaks.
              </p>
              <button
                onClick={handleAIGeneratePlan}
                disabled={aiPlanning}
                className="px-5 py-3 bg-[#5B6CFF] hover:bg-[#4758E8] text-white text-[15px] font-semibold rounded-[14px] cursor-pointer inline-flex items-center gap-1.5 transition-all duration-250 hover:scale-[1.02] shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Build Schedule</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-6 before:w-0.5 before:bg-[#E5EAF5]">
              {currentPlan.map((slot, idx) => {
                const isRest = slot.type === 'break' || slot.type === 'buffer';
                
                return (
                  <div key={idx} className="flex gap-4 relative z-10">
                    {/* Circle Indicator on timeline bar */}
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 font-outfit text-[13px] font-bold ${
                      isRest 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'bg-[#5B6CFF] border-[#5B6CFF] text-white'
                    }`}>
                      {slot.startTime.split(" ")[0]}
                    </div>

                    <div className={`flex-1 custom-card p-5 border transition-all duration-250 hover:scale-[1.02] ${cardBg}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#5F6B7A] font-bold uppercase tracking-wider">{slot.startTime} - {slot.endTime}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                              isRest ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-[#EEF2FF] text-[#5B6CFF] border-[#5B6CFF]/20'
                            }`}>
                              {slot.type}
                            </span>
                          </div>
                          
                          <h5 className={`font-outfit font-semibold text-[16px] mt-1.5 ${textColor}`}>
                            {slot.label}
                          </h5>
                          
                          {slot.advice && (
                            <p className="text-[13px] text-[#5F6B7A] font-medium italic mt-1.5">
                              💡 &ldquo;{slot.advice}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* AI recommendations */}
          {recommendations.length > 0 && (
            <div className={`p-6 rounded-[20px] border ${cardBg} space-y-4`}>
              <h5 className={`font-outfit font-semibold text-[16px] flex items-center gap-1.5 ${textColor}`}>
                <Award className="w-5 h-5 text-[#5B6CFF]" />
                <span>Stress mitigation recommendations</span>
              </h5>
              <ul className="space-y-2">
                {recommendations.map((rec, i) => (
                  <li key={i} className="text-[15px] font-medium flex items-start gap-2.5 text-[#5F6B7A]">
                    <span className="text-[#5B6CFF] select-none text-base">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
