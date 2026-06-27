import React from "react";
import { 
  LayoutDashboard, Sliders, ShieldAlert, Activity, 
  MessageSquareCode, User, Settings, HelpCircle, LogOut, 
  PanelLeftClose, PanelLeft, Zap
} from "lucide-react";

interface SidebarProps {
  activeView: string;
  setActiveView: (view: any) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  pendingRescueCount: number;
  isDarkTheme: boolean;
  onLogout: () => void;
  onTriggerHelp: () => void;
}

export default function Sidebar({
  activeView,
  setActiveView,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  pendingRescueCount,
  isDarkTheme,
  onLogout,
  onTriggerHelp
}: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "productivity", label: "Productivity", icon: Sliders },
    { id: "momentum", label: "Momentum", icon: Activity },
    { 
      id: "rescue", 
      label: "Rescue Station", 
      icon: ShieldAlert,
      badge: pendingRescueCount > 0 ? pendingRescueCount : undefined 
    },
    { id: "coach", label: "AI Coach", icon: MessageSquareCode },
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  const sidebarBg = "bg-[#EEF2FF] border-[#E5EAF5]";

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen ${isSidebarCollapsed ? "w-20" : "w-64"} ${sidebarBg} text-[#1F2937] flex flex-col justify-between border-r z-40 transition-all duration-500 ease-in-out`}
    >
      {/* Top Header / Branding */}
      <div>
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#E5EAF5] overflow-hidden relative">
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo Box */}
            <button 
              onClick={() => isSidebarCollapsed && setIsSidebarCollapsed(false)}
              className="w-10 h-10 rounded-xl bg-[#5B6CFF] flex items-center justify-center text-white shrink-0 cursor-pointer"
              title={isSidebarCollapsed ? "Expand Sidebar" : undefined}
              disabled={!isSidebarCollapsed}
            >
              <Zap className="w-5 h-5 fill-current" />
            </button>
            
            {/* Brand Text */}
            <div className={`flex flex-col leading-tight select-none transition-all duration-500 ease-in-out origin-left ${isSidebarCollapsed ? "opacity-0 max-w-0 translate-x-2 pointer-events-none" : "opacity-100 max-w-[120px] translate-x-0"}`}>
              <span className="font-outfit font-extrabold text-[16px] tracking-tight text-[#1F2937] whitespace-nowrap">
                Duewell
              </span>
            </div>
          </div>
          
          {/* Collapse Trigger */}
          <button 
            onClick={() => setIsSidebarCollapsed(true)}
            className={`p-1.5 rounded-lg hover:bg-[#DCE5FF] text-[#5F6B7A] hover:text-[#1F2937] transition-all duration-500 cursor-pointer shrink-0 ${isSidebarCollapsed ? "opacity-0 scale-50 pointer-events-none w-0 p-0" : "opacity-100 scale-100"}`}
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-3 space-y-1.5">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center transition-colors duration-200 cursor-pointer relative group ${
                  isSidebarCollapsed 
                    ? "w-12 h-12 rounded-[14px] mx-auto justify-center" 
                    : "w-full gap-3.5 px-3.5 py-3 rounded-[14px] text-[15px] font-semibold tracking-wide hover:translate-x-0.5"
                } ${
                  isActive 
                    ? "bg-[#5B6CFF] text-white shadow-md shadow-[#5B6CFF]/20" 
                    : "hover:bg-[#DCE5FF] text-[#5F6B7A] hover:text-[#1F2937]"
                }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <IconComponent className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-[#5F6B7A] group-hover:text-[#1F2937] transition-colors duration-200"}`} />
                {!isSidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                
                {/* Pending Tasks badge count */}
                {item.badge !== undefined && (
                  <span className={`absolute ${
                    isSidebarCollapsed ? "top-1.5 right-1.5 scale-90" : "right-3"
                  } flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-bold text-white shadow-sm`}>
                    {item.badge}
                  </span>
                )}
                
                {/* Collapsed Tooltip */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-[#1F2937] text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap shadow-xl border border-[#E5EAF5] translate-x-1 group-hover:translate-x-0">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Action */}
      <div className="p-3 border-t border-[#E5EAF5] space-y-1.5">
        <button
          onClick={onTriggerHelp}
          className={`flex items-center transition-colors duration-200 cursor-pointer group ${
            isSidebarCollapsed 
              ? "w-12 h-12 rounded-[14px] mx-auto justify-center" 
              : "w-full gap-3.5 px-3.5 py-2.5 rounded-[14px] text-[15px] font-semibold hover:translate-x-0.5"
          } text-[#5F6B7A] hover:text-[#1F2937] hover:bg-[#DCE5FF]`}
          title={isSidebarCollapsed ? "Onboarding Guide" : undefined}
        >
          <HelpCircle className="w-5 h-5 shrink-0 text-[#5F6B7A] group-hover:text-[#1F2937] transition-colors duration-200" />
          {!isSidebarCollapsed && (
            <span className="truncate">Help & Support</span>
          )}
          
          {/* Collapsed Tooltip for Help */}
          {isSidebarCollapsed && (
            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-[#1F2937] text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap shadow-xl border border-[#E5EAF5] translate-x-1 group-hover:translate-x-0">
              Help & Support
            </div>
          )}
        </button>

        <button
          onClick={onLogout}
          className={`flex items-center transition-colors duration-200 cursor-pointer group ${
            isSidebarCollapsed 
              ? "w-12 h-12 rounded-[14px] mx-auto justify-center" 
              : "w-full gap-3.5 px-3.5 py-2.5 rounded-[14px] text-[15px] font-semibold hover:translate-x-0.5"
          } text-rose-500 hover:text-white hover:bg-[#EF4444]`}
          title={isSidebarCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0 text-rose-500 group-hover:text-white transition-colors duration-200" />
          {!isSidebarCollapsed && (
            <span className="truncate">Sign Out</span>
          )}

          {/* Collapsed Tooltip for Sign Out */}
          {isSidebarCollapsed && (
            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-[#1F2937] text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap shadow-xl border border-[#E5EAF5] translate-x-1 group-hover:translate-x-0">
              Sign Out
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
