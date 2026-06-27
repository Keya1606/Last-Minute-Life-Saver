import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, Send, RefreshCw, Heart, Shield, Brain, Copy, Check, 
  ThumbsUp, ThumbsDown, ArrowUpRight, MessageSquare 
} from "lucide-react";

interface AICoachChatProps {
  chatMessages: Array<{ role: 'user' | 'assistant'; text: string }>;
  currentChatMessage: string;
  setCurrentChatMessage: (msg: string) => void;
  onSendChatMessage: (e?: React.FormEvent) => void;
  coachChatLoading: boolean;
  isDarkTheme: boolean;
  selectedRole: "comfort" | "sergeant" | "analyst";
  onRoleChange: (role: "comfort" | "sergeant" | "analyst") => void;
  tasks?: any[];
  habits?: any[];
  taskCompletionPercent?: number;
}

export default function AICoachChat({
  chatMessages,
  currentChatMessage,
  setCurrentChatMessage,
  onSendChatMessage,
  coachChatLoading,
  isDarkTheme,
  selectedRole,
  onRoleChange,
  tasks = [],
  habits = [],
  taskCompletionPercent = 0
}: AICoachChatProps) {
  
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [reactions, setReactions] = useState<Record<number, 'like' | 'dislike' | null>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages container
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, coachChatLoading]);

  // Suggested Prompts based on personalities (Matches original suggestion chips)
  const chips = selectedRole === "sergeant" ? [
    "Give me an aggressive kickstart sprint",
    "I'm procrastinating. Call me out!",
    "No-excuses task breakdown",
    "My focus is slipping. Order me back!"
  ] : selectedRole === "analyst" ? [
    "Create a study guide for my next test",
    "Design an exam spaced repetition prep schedule",
    "Active recall exercises for learning math",
    "Analyze syllabus and break down the difficulty"
  ] : [
    "I'm feeling frozen from procrastination",
    "How do I split an overwhelming syllabus?",
    "I have 2 hours before a high-stakes exam",
    "Review my stress levels & give a 5-minute break routine"
  ];

  const handleChipClick = (chipText: string) => {
    setCurrentChatMessage(chipText);
  };

  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleReaction = (idx: number, type: 'like' | 'dislike') => {
    setReactions(prev => ({
      ...prev,
      [idx]: prev[idx] === type ? null : type
    }));
  };

  const triggerRegenerate = () => {
    const userMessages = chatMessages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      const lastText = userMessages[userMessages.length - 1].text;
      setCurrentChatMessage(lastText);
      setTimeout(() => {
        onSendChatMessage();
      }, 50);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in text-left relative" id="ai-mission-control-wrapper">
      
      {/* Decorative premium radial glow & dotted texture background */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#EFF6FF]/35 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40 -z-20 pointer-events-none" />

      {/* 1. HERO HEADER SECTION */}
      <div className="text-center space-y-3 relative py-2" id="ai-mission-control-hero">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EFF6FF] text-[#3B82F6] rounded-full text-[11px] font-extrabold tracking-wider border border-blue-100 shadow-xs relative">
          <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          <span>Gemini 1.5 Flash Active</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
        </div>
        
        <h1 className="font-outfit text-3xl md:text-4.5xl font-black text-[#1F2937] tracking-tight">
          AI Mission Control
        </h1>
        <p className="text-[13.5px] text-[#5F6B7A] font-medium max-w-xl mx-auto leading-relaxed">
          Your personal productivity strategist powered by Gemini. Engage your tailored strategist to calibrate focus metrics and destroy outstanding deadlines.
        </p>
      </div>

      {/* 2. AI PERSONALITIES SELECTION CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black text-[#5F6B7A] uppercase tracking-wider flex items-center gap-1.5 font-mono">
            ● Strategic Advisers
          </span>
          <span className="text-[11px] font-bold text-gray-400">Tone adjustments update dynamically</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="coach-personality-grid">
          
          {/* Persona 1: Calm Counselor */}
          <div 
            onClick={() => !coachChatLoading && onRoleChange("comfort")}
            className={`group rounded-[18px] p-5 border transition-all duration-300 cursor-pointer relative flex flex-col justify-between min-h-[120px] ${
              selectedRole === "comfort"
                ? "bg-[#FFF8F8] border-rose-300 shadow-[0_4px_24px_rgba(244,63,94,0.06)] ring-1 ring-rose-300/30"
                : "bg-white border-[#E2E8F0] hover:border-rose-300 hover:-translate-y-1 hover:shadow-md"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                selectedRole === "comfort" ? "bg-rose-500 text-white" : "bg-[#FFF1F2] text-rose-500 group-hover:bg-rose-50"
              }`}>
                <Heart className="w-4.5 h-4.5" />
              </div>
              {selectedRole === "comfort" && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              )}
            </div>
            <div className="mt-3">
              <h4 className="text-[14px] font-black text-[#1F2937]">❤️ Calm Counselor</h4>
              <p className="text-[11.5px] text-[#5F6B7A] font-medium leading-tight mt-0.5">Empathetic alignment to dissolve panic patterns and restore calm.</p>
            </div>
          </div>

          {/* Persona 2: Tactical Strategist */}
          <div 
            onClick={() => !coachChatLoading && onRoleChange("sergeant")}
            className={`group rounded-[18px] p-5 border transition-all duration-300 cursor-pointer relative flex flex-col justify-between min-h-[120px] ${
              selectedRole === "sergeant"
                ? "bg-[#FCF9F2] border-amber-300 shadow-[0_4px_24px_rgba(245,158,11,0.06)] ring-1 ring-amber-400/20"
                : "bg-white border-[#E2E8F0] hover:border-amber-300 hover:-translate-y-1 hover:shadow-md"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                selectedRole === "sergeant" ? "bg-amber-500 text-white" : "bg-[#FEF3C7] text-amber-600 group-hover:bg-[#FFFDF5]"
              }`}>
                <Shield className="w-4.5 h-4.5" />
              </div>
              {selectedRole === "sergeant" && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              )}
            </div>
            <div className="mt-3">
              <h4 className="text-[14px] font-black text-[#1F2937]">🛡️ Tactical Strategist</h4>
              <p className="text-[11.5px] text-[#5F6B7A] font-medium leading-tight mt-0.5">Firm directive calibration. Breaks paralysis with immediate targets.</p>
            </div>
          </div>

          {/* Persona 3: Academic Analyst */}
          <div 
            onClick={() => !coachChatLoading && onRoleChange("analyst")}
            className={`group rounded-[18px] p-5 border transition-all duration-300 cursor-pointer relative flex flex-col justify-between min-h-[120px] ${
              selectedRole === "analyst"
                ? "bg-[#F3FAFC] border-cyan-300 shadow-[0_4px_24px_rgba(6,182,212,0.06)] ring-1 ring-cyan-300/30"
                : "bg-white border-[#E2E8F0] hover:border-cyan-300 hover:-translate-y-1 hover:shadow-md"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                selectedRole === "analyst" ? "bg-cyan-500 text-white" : "bg-[#ECFEFF] text-cyan-600 group-hover:bg-cyan-50"
              }`}>
                <Brain className="w-4.5 h-4.5" />
              </div>
              {selectedRole === "analyst" && (
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shrink-0" />
              )}
            </div>
            <div className="mt-3">
              <h4 className="text-[14px] font-black text-[#1F2937]">🎓 Academic Analyst</h4>
              <p className="text-[11.5px] text-[#5F6B7A] font-medium leading-tight mt-0.5">Highly logical structured breakdowns and adaptive study workflows.</p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. CORE CHAT WORKSPACE CONTAINER */}
      <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-6 shadow-xs flex flex-col h-[520px] relative transition-all duration-300" id="ai-chat-workspace-panel">
        
        {/* Workspace Top Bar Info */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F1F5F9] mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4.5 h-4.5 text-blue-500" />
            <span className="text-[12.5px] font-black text-[#1F2937] uppercase tracking-wider font-mono">Command Console</span>
          </div>
          
          <div className="flex items-center gap-3">
            {chatMessages.length > 0 && (
              <button 
                onClick={triggerRegenerate}
                disabled={coachChatLoading}
                className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-blue-500 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${coachChatLoading ? 'animate-spin' : ''}`} />
                <span>Regenerate Last response</span>
              </button>
            )}
            <span className="text-[11px] bg-slate-100 text-[#5F6B7A] font-extrabold px-2.5 py-0.5 rounded-full font-mono">
              {chatMessages.length} Messages
            </span>
          </div>
        </div>

        {/* Scrollable Conversations list */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4" id="chat-messages-container">
          {chatMessages.length === 0 ? (
            
            // Premium Centered Welcome Area
            <div className="h-full flex flex-col items-center justify-center text-center px-4" id="chat-empty-welcome">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shadow-xs border border-blue-100/60">
                <Sparkles className="w-6 h-6 animate-pulse text-blue-500" />
              </div>
              
              <h2 className="font-outfit text-xl lg:text-2xl font-black text-[#1F2937] mt-3.5">
                How can I help you today?
              </h2>
              <p className="text-[13px] text-[#5F6B7A] font-medium max-w-sm mt-1">
                Calibrate a schedule or solve productivity bottlenecks with your AI Strategist. Select a directive or enter a command.
              </p>
            </div>

          ) : (
            
            // Beautiful standard conversational messages
            <div className="space-y-4">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className="flex flex-col max-w-[85%] space-y-1">
                    
                    {/* Role Title Identifier */}
                    <div className={`flex items-center gap-1.5 px-1.5 text-[9.5px] font-black uppercase tracking-wider ${
                      msg.role === 'user' ? 'justify-end text-[#3B82F6]' : 'text-gray-400'
                    }`}>
                      {msg.role === 'user' ? (
                        <span>You</span>
                      ) : (
                        <span>AI Coach ({
                          selectedRole === "comfort" ? "Counselor" : selectedRole === "sergeant" ? "Sergeant" : "Analyst"
                        })</span>
                      )}
                    </div>

                    {/* Speech bubble */}
                    <div className={`relative px-4.5 py-3.5 text-[13.5px] font-semibold leading-relaxed shadow-xs transition-all border ${
                      msg.role === 'user' 
                        ? "bg-[#3B82F6] text-white rounded-[18px] rounded-tr-none border-[#2563EB]" 
                        : "bg-[#F8FAFC] text-[#1F2937] rounded-[18px] rounded-tl-none border-[#E2E8F0]"
                    }`}>
                      {msg.text.split("\n").map((para, pIdx) => (
                        <p key={pIdx} className={pIdx > 0 ? "mt-1.5" : ""}>
                          {para}
                        </p>
                      ))}

                      {/* Helper Reaction panel inside Speech Bubble */}
                      {msg.role === 'assistant' && (
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/50 text-[#5F6B7A]">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleReaction(idx, 'like')}
                              className={`p-1 rounded hover:bg-slate-200/50 transition-colors ${
                                reactions[idx] === 'like' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400'
                              }`}
                              title="Helpful"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleReaction(idx, 'dislike')}
                              className={`p-1 rounded hover:bg-slate-200/50 transition-colors ${
                                reactions[idx] === 'dislike' ? 'text-rose-600 bg-rose-50' : 'text-gray-400'
                              }`}
                              title="Not Helpful"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button 
                            onClick={() => handleCopyMessage(msg.text, idx)}
                            className="p-1 rounded hover:bg-slate-200/50 text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-[10px] font-bold"
                            title="Copy response text"
                          >
                            {copiedIdx === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-600 font-extrabold text-[9px]">Copied</span>
                              </>
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Loader bubble */}
          {coachChatLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="flex flex-col max-w-[85%] space-y-1">
                <div className="flex items-center gap-1.5 px-1.5 text-[9px] font-black uppercase tracking-wider text-gray-400">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-blue-500" />
                  <span>Calibrating strategist parameters...</span>
                </div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] px-4.5 py-3.5 text-[13px] font-semibold flex items-center gap-3 shadow-xs rounded-[18px] rounded-tl-none">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span className="text-gray-500">
                    {selectedRole === "sergeant" 
                      ? "Tactical Sergeant is deconstructing procrastination triggers..." 
                      : selectedRole === "analyst" 
                      ? "Academic Analyst is mapping optimal study intervals..." 
                      : "Calm Counselor is drafting emotional safety mitigations..."}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. REDESIGNED CLEAN MESSAGE INPUT */}
        <form onSubmit={onSendChatMessage} className="flex gap-2 pt-3 border-t border-[#F1F5F9] relative z-10">
          <input
            type="text"
            disabled={coachChatLoading}
            placeholder={
              selectedRole === "sergeant"
                ? "Report procrastination triggers or ask for a strict countdown..."
                : selectedRole === "analyst"
                ? "Ask to break down a syllabus, suggest recall questions, or analyze schedules..."
                : "Describe focus levels, describe testing anxiety, or ask for a warm pep talk..."
            }
            value={currentChatMessage}
            onChange={(e) => setCurrentChatMessage(e.target.value)}
            className="flex-1 px-4.5 py-3 text-[13.5px] font-bold rounded-xl border outline-none bg-[#F8FAFC] border-[#E2E8F0] text-[#1F2937] focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-gray-400 placeholder:font-medium shadow-xs"
          />

          <button
            type="submit"
            disabled={coachChatLoading || !currentChatMessage.trim()}
            className="px-5.5 py-3 bg-[#3B82F6] hover:bg-[#2563EB] hover:-translate-y-0.5 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:translate-y-0 shadow-xs shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="text-[13px] hidden sm:inline">Send</span>
          </button>
        </form>

      </div>

      {/* 5. SUGGESTED TACTICAL PROMPT CARDS (Rendered below chat box, simple grid) */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-1.5 px-1">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
          <h4 className="text-[11px] font-black uppercase text-[#5F6B7A] tracking-wider font-mono">
            Hot Directives ({selectedRole === "comfort" ? "Counselor" : selectedRole === "sergeant" ? "Sergeant" : "Analyst"})
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="tactical-chips-grid">
          {chips.map((chip, idx) => (
            <div 
              key={idx}
              onClick={() => !coachChatLoading && handleChipClick(chip)}
              className="group bg-white p-4 border border-[#E2E8F0] rounded-xl hover:-translate-y-1 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all duration-250 flex items-center justify-between"
            >
              <p className="text-[12.5px] font-extrabold text-[#1F2937] group-hover:text-blue-600 transition-colors leading-snug pr-3 truncate">
                {chip}
              </p>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
