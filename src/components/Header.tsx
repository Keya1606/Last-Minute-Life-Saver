import React, { useState } from "react";
import { 
  Search, Bell, Sparkles, Sun, Moon, Calendar, 
  AlertCircle, Check, Zap, HelpCircle, Activity 
} from "lucide-react";
import { RouteType } from "../types";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDarkTheme: boolean;
  setIsDarkTheme: (dark: boolean) => void;
  notifications: Array<{ id: string; text: string; time: string; type: 'alert' | 'success' | 'info' }>;
  onTriggerPrioritize: () => void;
  onTriggerGeneratePlan: () => void;
  aiPrioritizing: boolean;
  aiPlanning: boolean;
  userId: string;
  userEmail: string;
  onLogout: () => void;
  onNavigate: (route: RouteType) => void;
  onSelectView: (view: any) => void;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  isDarkTheme,
  setIsDarkTheme,
  notifications,
  onTriggerPrioritize,
  onTriggerGeneratePlan,
  aiPrioritizing,
  aiPlanning,
  userId,
  userEmail,
  onLogout,
  onNavigate,
  onSelectView
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [fullName, setFullName] = useState("");

  React.useEffect(() => {
    const localName = localStorage.getItem("lifesaver_user_full_name") || "";
    setFullName(localName);

    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.fullName) {
        setFullName(customEvent.detail.fullName);
      }
    };
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, []);

  const getInitials = () => {
    if (fullName && fullName.trim()) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    if (userEmail) {
      const emailPart = userEmail.split("@")[0];
      return emailPart.substring(0, Math.min(2, emailPart.length)).toUpperCase();
    }
    return "US";
  };

  const headerBg = "bg-white/95 border-[#E5EAF5]";
  const textColor = "text-[#1F2937]";
  const inputBg = "bg-[#F7F8FC]";

  return (
    <header className={`sticky top-0 z-30 h-16 flex items-center justify-between px-8 border-b ${headerBg} backdrop-blur-md`}>
      {/* Left: Dynamic Search Bar */}
      <div className="relative w-80">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#5F6B7A]">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search deadlines, categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full h-[52px] input-with-icon pr-12 text-[15px] font-medium rounded-[14px] outline-none focus:ring-4 focus:ring-[#5B6CFF]/12 border transition-all ${inputBg} text-[#1F2937] placeholder-[#5F6B7A]/60 border-[#E5EAF5] focus:border-[#5B6CFF]`}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-3.5 flex items-center text-[13px] font-semibold text-[#5F6B7A] hover:text-[#5B6CFF] transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4">

        {/* AI Quick Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowQuickActions(!showQuickActions);
              setShowNotifications(false);
            }}
            className="px-4 py-2.5 text-[15px] font-semibold rounded-[14px] border border-[#E5EAF5] bg-[#EEF2FF] text-[#5B6CFF] hover:bg-[#DCE5FF] hover:scale-[1.02] transition-all duration-250 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Assist</span>
          </button>

          {showQuickActions && (
            <div className="absolute right-0 mt-3 w-64 rounded-[24px] border border-[#E5EAF5] bg-white shadow-xl p-3 animate-fade-in">
              <div className="px-3 py-1.5 mb-1 border-b border-[#E5EAF5]">
                <span className="text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider">Rapid Interventions</span>
              </div>
              <button
                disabled={aiPrioritizing}
                onClick={() => {
                  setShowQuickActions(false);
                  onTriggerPrioritize();
                }}
                className="w-full text-left px-3 py-2.5 text-[15px] font-semibold rounded-[14px] flex items-center gap-2.5 cursor-pointer text-[#1F2937] hover:bg-[#EEF2FF] hover:text-[#5B6CFF] transition-all duration-250"
              >
                <Zap className="w-4.5 h-4.5 text-[#5B6CFF]" />
                <span>{aiPrioritizing ? "Prioritizing..." : "Curate AI Priorities"}</span>
              </button>
              <button
                disabled={aiPlanning}
                onClick={() => {
                  setShowQuickActions(false);
                  onTriggerGeneratePlan();
                }}
                className="w-full text-left px-3 py-2.5 text-[15px] font-semibold rounded-[14px] flex items-center gap-2.5 cursor-pointer text-[#1F2937] hover:bg-[#EEF2FF] hover:text-[#5B6CFF] transition-all duration-250"
              >
                <Calendar className="w-4.5 h-4.5 text-[#22C55E]" />
                <span>{aiPlanning ? "Structuring..." : "Generate Focus Schedule"}</span>
              </button>
              <button
                onClick={() => {
                  setShowQuickActions(false);
                  onSelectView("coach");
                }}
                className="w-full text-left px-3 py-2.5 text-[15px] font-semibold rounded-[14px] flex items-center gap-2.5 cursor-pointer text-[#1F2937] hover:bg-[#EEF2FF] hover:text-[#5B6CFF] transition-all duration-250"
              >
                <Activity className="w-4.5 h-4.5 text-rose-500" />
                <span>Consult Live AI Coach</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Stress Alerts / Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowQuickActions(false);
            }}
            className="p-2.5 rounded-[14px] border border-[#E5EAF5] text-[#5F6B7A] hover:bg-[#EEF2FF] hover:text-[#5B6CFF] hover:scale-[1.02] transition-all duration-250 cursor-pointer relative"
          >
            <Bell className="w-4.5 h-4.5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-[#EF4444] animate-ping"></span>
            )}
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-[#EF4444]"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-[24px] border border-[#E5EAF5] bg-white shadow-xl p-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5EAF5]">
                <span className="text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider">Active Stress Warnings</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-600">
                  {notifications.length} Warns
                </span>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-4">
                    <Check className="w-6 h-6 text-[#22C55E] mx-auto mb-1" />
                    <p className="text-[13px] text-[#5F6B7A]">All green! No critical issues detected.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-2.5 rounded-[14px] text-[13px] flex gap-2 border ${
                        notif.type === 'alert' 
                          ? "bg-rose-50 border-rose-100 text-rose-700" 
                          : notif.type === 'success' 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                          : "bg-indigo-50 border-indigo-100 text-[#5B6CFF]"
                      }`}
                    >
                      <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-semibold text-[#1F2937]">{notif.text}</p>
                        <span className="text-[11px] text-[#5F6B7A] font-medium">{notif.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Circle shortcut */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-[#E5EAF5] h-6">
          <button
            onClick={() => onSelectView("profile")}
            className="w-9 h-9 rounded-full bg-[#5B6CFF] hover:bg-[#4758E8] text-white flex items-center justify-center font-outfit font-bold text-sm shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95 focus:outline-none"
            title={fullName || userEmail}
            id="profile-avatar-btn"
          >
            {getInitials()}
          </button>
        </div>
      </div>
    </header>
  );
}
