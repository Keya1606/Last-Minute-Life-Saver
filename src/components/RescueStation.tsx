import React from "react";
import { 
  ShieldAlert, Mail, Copy, Check, RefreshCw, 
  AlertTriangle, CheckCircle2, Circle, Clock, Info
} from "lucide-react";
import { Task } from "../types";

interface RescueStationProps {
  tasks: Task[];
  extensionDrafts: Record<string, string>;
  loadingDrafts: Record<string, boolean>;
  copiedDrafts: Record<string, boolean>;
  aiDraftError: Record<string, boolean>;
  handleGenerateExtensionDraft: (task: Task) => void;
  handleCopyDraft: (taskId: string, text: string) => void;
  handleToggleTaskStatus: (taskId: string) => void;
  isDarkTheme: boolean;
}

export default function RescueStation({
  tasks,
  extensionDrafts,
  loadingDrafts,
  copiedDrafts,
  aiDraftError,
  handleGenerateExtensionDraft,
  handleCopyDraft,
  handleToggleTaskStatus,
  isDarkTheme
}: RescueStationProps) {
  const pending = tasks.filter(t => t.status !== 'completed');
  
  // Sort pending by deadline; overdue first
  const sortedRescue = [...pending].sort((a, b) => {
    const diffA = new Date(a.deadline).getTime() - new Date().getTime();
    const diffB = new Date(b.deadline).getTime() - new Date().getTime();
    return diffA - diffB;
  });

  const cardBg = "bg-white border-[#E5EAF5] text-[#1F2937]";
  const innerCard = "bg-[#F7F8FC] border-[#E5EAF5]";

  return (
    <div className="space-y-8">
      
      {/* Intro Rescue Shield */}
      <div className="p-6 rounded-[24px] border flex flex-col md:flex-row items-center gap-6 bg-gradient-to-r from-rose-50/60 to-indigo-50/40 border-rose-100/60 text-[#1F2937]">
        <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl shrink-0">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 text-center md:text-left">
          <h3 className="font-outfit font-semibold text-[22px] tracking-tight">Active Rescue Zone</h3>
          <p className="text-[15px] text-[#5F6B7A] max-w-2xl leading-relaxed font-medium">
            When deadlines freeze you, action is your shield. Here, you can isolate high-risk targets and draft incredibly polite, AI-curated extension requests to buy yourself critical breathing room.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: List of High Stakes items */}
        <div className="lg:col-span-6 space-y-4">
          <h4 className="font-outfit font-semibold text-[15px] tracking-wider text-[#5F6B7A] uppercase">
            🚨 Immediate Targets ({sortedRescue.length})
          </h4>
          
          {sortedRescue.length === 0 ? (
            <div className={`custom-card p-8 text-center ${cardBg}`}>
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-[15px] text-[#5F6B7A] font-semibold">No critical deadlines detected! You are completely safe.</p>
            </div>
          ) : (
            sortedRescue.map((task) => {
              const diffHours = (new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60);
              const isOverdue = diffHours < 0;
              const hasDraft = extensionDrafts[task.id];
              const isLoadingDraft = loadingDrafts[task.id];

              return (
                <div 
                  key={task.id} 
                  className={`custom-card p-6 border transition-all ${cardBg} ${isOverdue ? 'border-rose-500/25 shadow-rose-500/5' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <button 
                        onClick={() => handleToggleTaskStatus(task.id)}
                        className="mt-1 shrink-0 cursor-pointer text-[#5F6B7A]/60 hover:text-emerald-500 transition-colors"
                      >
                        <Circle className="w-5 h-5 stroke-[2]" />
                      </button>
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${isOverdue ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                            {isOverdue ? 'OVERDUE' : diffHours < 5 ? 'DUE SOON' : 'CRITICAL'}
                          </span>
                          <span className="text-[13px] text-[#5F6B7A] font-semibold tabular-nums">
                            Estimate: {task.estimated_minutes}m
                          </span>
                        </div>
                        <h5 className="font-outfit font-semibold text-[16px] text-[#1F2937]">
                          {task.title}
                        </h5>
                        <p className="text-[13px] text-[#5F6B7A] font-medium italic">
                          💡 {task.aiTip || "Break it down into three 15-minute segments."}
                        </p>
                      </div>
                    </div>

                    {/* Generate Extension trigger */}
                    <button
                      disabled={isLoadingDraft}
                      onClick={() => handleGenerateExtensionDraft(task)}
                      className={`px-3.5 py-2 text-[13px] font-semibold rounded-[14px] border shrink-0 cursor-pointer transition-all duration-250 hover:scale-[1.02] flex items-center gap-1.5 ${
                        hasDraft 
                          ? 'border-[#5B6CFF]/40 bg-[#EEF2FF] text-[#5B6CFF]' 
                          : 'border-[#E5EAF5] bg-[#F7F8FC] text-[#5F6B7A] hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'
                      }`}
                    >
                      {isLoadingDraft ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Mail className="w-3.5 h-3.5" />
                      )}
                      <span>{hasDraft ? 'Draft Ready' : 'Draft Extension'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Draft Viewer */}
        <div className="lg:col-span-6 space-y-4">
          <h4 className="font-outfit font-semibold text-[15px] tracking-wider text-[#5F6B7A] uppercase">
            ✉️ Polite Request Workspace
          </h4>
          
          {Object.keys(extensionDrafts).length === 0 ? (
            <div className={`custom-card p-10 text-center ${cardBg} h-[340px] flex flex-col items-center justify-center`}>
              <Mail className="w-12 h-12 text-[#5B6CFF]/40 mb-3" />
              <h5 className="font-outfit font-semibold text-[18px] mb-1 text-[#1F2937]">No Extension Draft Generated Yet</h5>
              <p className="text-[15px] text-[#5F6B7A] max-w-[260px] leading-relaxed font-medium">
                Click "Draft Extension" on any critical target to generate an extremely polite request.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(extensionDrafts).map(([taskId, draftText]) => {
                const associatedTask = tasks.find(t => t.id === taskId);
                const isCopied = copiedDrafts[taskId];

                return (
                  <div key={taskId} className={`custom-card p-6 border ${cardBg} space-y-4`}>
                    <div className="flex items-center justify-between border-b border-[#E5EAF5] pb-3">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider">Active Draft</span>
                        <h6 className="font-outfit font-semibold text-[15px] text-[#5B6CFF]">
                          For: {associatedTask?.title || "Target Task"}
                        </h6>
                      </div>

                      <button
                        onClick={() => handleCopyDraft(taskId, draftText)}
                        className={`px-3.5 py-2 text-[13px] font-semibold rounded-[14px] border transition-all duration-250 hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer ${
                          isCopied 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                            : 'bg-white text-[#5F6B7A] border-[#E5EAF5] hover:bg-[#F7F8FC]'
                        }`}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <pre className={`text-[13px] leading-relaxed font-mono whitespace-pre-wrap p-4.5 rounded-[14px] border ${innerCard}`}>
                      {draftText}
                    </pre>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
