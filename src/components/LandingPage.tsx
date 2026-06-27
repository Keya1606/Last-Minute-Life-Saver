import React, { useState, useEffect } from "react";
import { RouteType } from "../types";
import { 
  Zap, 
  Clock, 
  Activity, 
  ArrowRight, 
  ShieldCheck, 
  Heart, 
  Sliders, 
  ChevronDown, 
  Sparkles, 
  Quote,
  CheckCircle2,
  Calendar,
  Mic,
  Plus,
  Play,
  TrendingUp,
  FileText,
  AlertCircle
} from "lucide-react";

interface LandingPageProps {
  onNavigate: (route: RouteType) => void;
  isAuthenticated: boolean;
  onLogout?: () => void;
  userEmail?: string;
}

export default function LandingPage({ onNavigate, isAuthenticated, onLogout, userEmail }: LandingPageProps) {
  const [fullName, setFullName] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  useEffect(() => {
    const localName = localStorage.getItem("lifesaver_user_full_name") || "";
    setFullName(localName);
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
    return "AD";
  };

  const getUsername = () => {
    if (fullName && fullName.trim()) {
      return fullName.trim();
    }
    if (userEmail) {
      return userEmail.split("@")[0];
    }
    return "admin12";
  };

  const faqs = [
    {
      q: "How does Duewell differ from other calendar or task apps?",
      a: "Traditional tools are passive lists that guilt-trip you as deadlines approach. Duewell is action-centric: we don't just store tasks, we use Google Gemini AI to analyze your cognitive bandwidth, automatically order priorities into immediate quick wins, and generate a dynamic hour-by-hour calendar integrating essential breaks and recovery habits."
    },
    {
      q: "I have high anxiety about my tasks. Will this overwhelm me?",
      a: "Absolutely not. In fact, Duewell is engineered specifically for deadline paralysis. Features like the 'Rescue Station' let you isolate high-stress targets and draft professional extension requests instantly to buy breathing room, while the 'Momentum Ring' celebrates small, low-friction habits to build momentum step-by-step."
    },
    {
      q: "Does it integrate with other platforms?",
      a: "Duewell supports robust offline local caching, optional Supabase database synchronization, and speech recognition. Full live bidirectional synchronization with external calendars is actively in our pipeline!"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9FD] text-[#1F2937] flex flex-col font-sans relative overflow-x-hidden selection:bg-[#5B6CFF]/10 selection:text-[#5B6CFF]">
      
      {/* 3D Soft Lighting Canvas Overlays */}
      <div className="absolute inset-0 pointer-events-none -z-10 select-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-[#5B6CFF]/5 to-[#818CF8]/3 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-10 w-[500px] h-[500px] bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF]/20 rounded-full blur-[120px]" />
        
        {/* Subtle dot-pattern element configured with extremely high transparency to prevent clutter */}
        <div 
          className="absolute inset-0 opacity-[0.015]" 
          style={{
            backgroundImage: `radial-gradient(#5B6CFF 1.5px, transparent 1.5px)`,
            backgroundSize: `24px 24px`,
          }}
        />

        {/* Ultra-fine canvas grain */}
        <div 
          className="absolute inset-0 opacity-[0.012]" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        />
      </div>

      {/* 1. NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-[#ECECF7]/60 shadow-[0_2px_20px_rgba(20,20,43,0.02)]">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <div 
            className="flex items-center gap-2.5 cursor-pointer group" 
            onClick={() => onNavigate("/")}
            id="logo-container"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5B6CFF] to-[#4F46E5] flex items-center justify-center text-white transition-all duration-300">
              <Zap className="w-4.5 h-4.5 fill-white stroke-none" />
            </div>
            <span className="font-display text-[26px] font-extrabold tracking-tight bg-gradient-to-r from-[#1F2937] to-[#4B5563] bg-clip-text text-transparent">Duewell</span>
          </div>

          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-[13px] text-[#5F6B7A] font-semibold hidden sm:inline-block">
                  Welcome back, <span className="font-bold text-[#5B6CFF]">{getUsername()}</span>
                </span>
                <button
                  onClick={() => onNavigate("/app")}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5B6CFF] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white flex items-center justify-center font-sans font-bold text-xs shadow-[0_4px_12px_rgba(91,108,255,0.2)] hover:-translate-y-[2px] transition-all duration-200 focus:outline-none cursor-pointer"
                  title="Go to Dashboard"
                  id="landing-profile-avatar"
                >
                  {getInitials()}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => onNavigate("/signin")}
                  className="px-4 py-2 text-[14px] font-semibold text-[#5F6B7A] hover:text-[#5B6CFF] transition-all duration-200 cursor-pointer"
                  id="header-signin"
                >
                  Sign in
                </button>
                <button 
                  onClick={() => onNavigate("/signup")}
                  className="px-5 py-2.5 bg-[#5B6CFF] hover:bg-[#4758E8] text-white font-extrabold text-[14px] rounded-xl shadow-[0_4px_15px_rgba(91,108,255,0.15)] hover:shadow-[0_8px_25px_rgba(91,108,255,0.25)] hover:-translate-y-[2px] transition-all duration-250 cursor-pointer"
                  id="header-signup"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN MAIN CONTENT */}
      <main className="flex-grow">
        
        {/* 2. HERO SECTION */}
        <section className="relative w-full max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-16 text-center flex flex-col items-center">
          
          {/* Soft, faint radial glow backdrop specifically behind the heading */}
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(circle,rgba(91,108,255,0.08)_0%,rgba(139,92,246,0.04)_40%,transparent_70%)] pointer-events-none -z-10 select-none blur-[60px]" />

          {/* Animated Centered Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#EEF0FF] border border-[#D9DFFF] rounded-full text-[11px] font-bold text-[#5B6CFF] mb-8 uppercase tracking-wider select-none shadow-[0_4px_12px_rgba(91,108,255,0.04)] hover:bg-[#E4E8FF] transition-all duration-300">
            <Sparkles className="w-3.5 h-3.5 text-[#5B6CFF]" />
            MEET THE ANTIDOTE TO DEADLINE PARALYSIS
          </div>
          
          {/* Main Display Typography Headline with high contrast */}
          <h1 className="font-display text-4.5xl md:text-[72px] font-black tracking-tight text-[#1F2937] mb-8 leading-[1.05] max-w-4xl">
            Stop missing deadlines.<br />
            <span className="bg-gradient-to-r from-[#5B6CFF] via-[#7C3AED] to-[#4F46E5] bg-clip-text text-transparent">Start conquering them.</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-[16px] md:text-[20px] text-[#5F6B7A] max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Duewell is a beautifully engineered, momentum-driven companion that turns task backlogs into intelligent, hour-by-hour action roadmaps. 
          </p>

          {/* Call-to-actions */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full sm:w-auto mb-16">
            <button
              onClick={() => onNavigate(isAuthenticated ? "/app" : "/signup")}
              className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#5B6CFF] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white font-extrabold text-[15px] rounded-xl shadow-[0_10px_30px_rgba(91,108,255,0.2)] hover:shadow-[0_15px_40px_rgba(91,108,255,0.35)] hover:-translate-y-[3px] transition-all duration-250 flex items-center justify-center gap-2 cursor-pointer"
              id="hero-cta"
            >
              {isAuthenticated ? "Enter Workspace" : "Get Started Free"} 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("how-it-works");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-[#FAF9FD] border border-[#E2E8F0] text-[#475569] font-extrabold text-[15px] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:-translate-y-[3px] transition-all duration-250 cursor-pointer"
              id="hero-secondary"
            >
              See how it works
            </button>
          </div>
        </section>

        {/* 4. HOW IT WORKS SECTION */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 md:px-12 py-24 relative">
          
          <div className="text-center mb-20 space-y-4">
            <span className="text-[11px] font-black tracking-widest text-[#5B6CFF] bg-[#EEF0FF] px-3 py-1 rounded-full uppercase">Simple 3-Step Flow</span>
            <h2 className="font-display text-4xl md:text-[48px] font-black tracking-tight text-[#1F2937]">
              Engineered to bypass anxiety
            </h2>
            <p className="text-[#5F6B7A] text-[16px] md:text-[18px] font-medium max-w-2xl mx-auto">
              No complex databases, metadata screens, or empty setup guides. Just realistic action.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Step 1 */}
            <div className="p-8 bg-white border border-[#EBEBF5] rounded-[28px] shadow-[0_4px_25px_rgba(20,20,43,0.02)] hover:shadow-[0_15px_45px_rgba(91,108,255,0.08)] hover:-translate-y-2 hover:border-[#5B6CFF]/40 transition-all duration-300 flex flex-col justify-between min-h-[280px] group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#5B6CFF]/5 to-transparent rounded-bl-full pointer-events-none" />
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#EEF0FF] flex items-center justify-center text-[#5B6CFF] mb-8 group-hover:scale-110 group-hover:bg-[#5B6CFF] group-hover:text-white transition-all duration-350 shadow-[0_4px_12px_rgba(91,108,255,0.08)]">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-black text-[#1F2937] mb-3">1. Dump the Backlog</h3>
                <p className="text-[#5F6B7A] text-[13.5px] font-medium leading-relaxed">
                  List high-stakes tasks, estimate effort, and flag their target deadlines. Speak to it directly via speech recognition if hands are full.
                </p>
              </div>
              <div className="text-[rgba(91,108,255,0.05)] font-display text-6xl font-black mt-6 text-right select-none group-hover:text-[#5B6CFF]/12 transition-colors duration-300">01</div>
            </div>

            {/* Step 2 */}
            <div className="p-8 bg-white border border-[#EBEBF5] rounded-[28px] shadow-[0_4px_25px_rgba(20,20,43,0.02)] hover:shadow-[0_15px_45px_rgba(139,92,246,0.08)] hover:-translate-y-2 hover:border-[#8B5CF6]/40 transition-all duration-300 flex flex-col justify-between min-h-[280px] group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#8B5CF6]/5 to-transparent rounded-bl-full pointer-events-none" />
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] flex items-center justify-center text-[#8B5CF6] mb-8 group-hover:scale-110 group-hover:bg-[#8B5CF6] group-hover:text-white transition-all duration-350 shadow-[0_4px_12px_rgba(139,92,246,0.08)]">
                  <Zap className="w-6 h-6 fill-current stroke-none" />
                </div>
                <h3 className="font-display text-xl font-black text-[#1F2937] mb-3">2. Let Gemini Order Chaos</h3>
                <p className="text-[#5F6B7A] text-[13.5px] font-medium leading-relaxed">
                  One tap triggers our custom Gemini prompt. It prioritizes everything into 'Critical', 'Important', or 'Malleable' zones dynamically.
                </p>
              </div>
              <div className="text-[rgba(139,92,246,0.05)] font-display text-6xl font-black mt-6 text-right select-none group-hover:text-[#8B5CF6]/12 transition-colors duration-300">02</div>
            </div>

            {/* Step 3 */}
            <div className="p-8 bg-white border border-[#EBEBF5] rounded-[28px] shadow-[0_4px_25px_rgba(20,20,43,0.02)] hover:shadow-[0_15px_45px_rgba(59,130,246,0.08)] hover:-translate-y-2 hover:border-[#3B82F6]/40 transition-all duration-300 flex flex-col justify-between min-h-[280px] group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#3B82F6]/5 to-transparent rounded-bl-full pointer-events-none" />
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6] mb-8 group-hover:scale-110 group-hover:bg-[#3B82F6] group-hover:text-white transition-all duration-350 shadow-[0_4px_12px_rgba(59,130,246,0.08)]">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-black text-[#1F2937] mb-3">3. Run the Hour-by-Hour</h3>
                <p className="text-[#5F6B7A] text-[13.5px] font-medium leading-relaxed">
                  Check off tasks, track hydration habits, and use the 'Rescue Station' to auto-draft extension requests for overdue targets.
                </p>
              </div>
              <div className="text-[rgba(59,130,246,0.05)] font-display text-6xl font-black mt-6 text-right select-none group-hover:text-[#3B82F6]/12 transition-colors duration-300">03</div>
            </div>

          </div>
        </section>

        {/* 5. FEATURES BENTO GRID */}
        <section className="bg-transparent py-24 relative">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            
            <div className="max-w-3xl mx-auto text-center mb-20 space-y-4">
              <span className="text-[11px] font-black tracking-widest text-[#8B5CF6] bg-[#F5F3FF] px-3 py-1 rounded-full uppercase">Feature Deep Dive</span>
              <h2 className="font-display text-4xl md:text-[48px] font-black tracking-tight text-[#1F2937]">
                Crafted for healthy velocity
              </h2>
              <p className="text-[#5F6B7A] text-[16px] md:text-[18px] font-medium max-w-xl mx-auto">
                No telemetry charts, console pings, or artificial logs. Just pure utility.
              </p>
            </div>

            {/* Bento Grid Styling */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Card 1: Intelligent Prioritization */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-[#EBEBF5] shadow-[0_4px_30px_rgba(20,20,43,0.015)] hover:shadow-[0_20px_50px_rgba(20,20,43,0.06)] hover:-translate-y-1.5 hover:border-[#5B6CFF]/35 transition-all duration-350 flex flex-col justify-between min-h-[340px] group relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-7 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#5B6CFF]/15 to-[#818CF8]/10 text-[#5B6CFF] flex items-center justify-center shadow-xs">
                      <Zap className="w-5.5 h-5.5 fill-current stroke-none" />
                    </div>
                    <h4 className="font-display text-2xl font-black text-[#1F2937]">Smart Prioritization</h4>
                    <p className="text-[13.5px] text-[#5F6B7A] font-medium leading-relaxed">
                      Using our customized Gemini Prompting Engine, Duewell intelligently scores deadline urgency, task weight, and user energy curves to structure your daily roadmap.
                    </p>
                  </div>
                  
                  {/* Decorative visual mockup inside bento */}
                  <div className="md:col-span-5 bg-[#FAF9FD] p-4 rounded-2xl border border-[#ECECF7] space-y-2.5">
                    <span className="text-[9px] font-black text-[#94A3B8] uppercase block tracking-wider">Urgency Matrix</span>
                    <div className="space-y-2">
                      <div className="bg-white p-2.5 rounded-lg border border-[#ECECF7] flex items-center justify-between text-[11px] shadow-xs">
                        <span className="font-bold text-[#1F2937]">Economics Paper Draft</span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded">Critical</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-[#ECECF7] flex items-center justify-between text-[11px] shadow-xs">
                        <span className="font-bold text-[#1F2937]">Chemistry Lab Report</span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-indigo-50 text-[#5B6CFF] rounded">Important</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-[#ECECF7] flex items-center justify-between text-[11px] shadow-xs opacity-60">
                        <span className="font-bold text-[#1F2937]">Clean study desk</span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-slate-50 text-[#5F6B7A] rounded">Malleable</span>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black text-[#5B6CFF] mt-6 flex items-center gap-1.5 transition-all group-hover:translate-x-1">
                  Try it on your dashboard <ArrowRight className="w-4 h-4" />
                </span>
              </div>

              {/* Card 2: Momentum Tracker */}
              <div className="bg-white p-8 rounded-[32px] border border-[#EBEBF5] shadow-[0_4px_30px_rgba(20,20,43,0.015)] hover:shadow-[0_20px_50px_rgba(20,20,43,0.06)] hover:-translate-y-1.5 hover:border-[#5B6CFF]/35 transition-all duration-350 flex flex-col justify-between min-h-[340px] group relative overflow-hidden">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shadow-xs">
                    <Activity className="w-5.5 h-5.5" />
                  </div>
                  <h4 className="font-display text-xl font-black text-[#1F2937]">The Momentum Ring</h4>
                  <p className="text-xs text-[#5F6B7A] font-medium leading-relaxed">
                    Watch our circular SVG track dynamic, real-time power levels as you complete milestones, drink water, and conquer mental blocks.
                  </p>
                  
                  {/* Mock circular momentum SVG illustration inside card */}
                  <div className="pt-2 flex justify-center">
                    <div className="relative w-24 h-24 flex items-center justify-center bg-[#FAF9FD] rounded-full border border-[#ECECF5]">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="24" className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="transparent" />
                        <circle cx="32" cy="32" r="24" className="text-[#5B6CFF]" strokeWidth="4" strokeDasharray="150.8" strokeDashoffset="24" strokeLinecap="round" stroke="currentColor" fill="transparent" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xs font-black text-[#1F2937]">84%</span>
                        <span className="text-[7px] text-[#94A3B8] font-bold uppercase tracking-wider">Flow</span>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black text-[#3B82F6] mt-4 flex items-center gap-1.5 transition-all group-hover:translate-x-1">
                  Interactive widget <ArrowRight className="w-4 h-4" />
                </span>
              </div>

              {/* Card 3: Extension Requests */}
              <div className="bg-white p-8 rounded-[32px] border border-[#EBEBF5] shadow-[0_4px_30px_rgba(20,20,43,0.015)] hover:shadow-[0_20px_50px_rgba(20,20,43,0.06)] hover:-translate-y-1.5 hover:border-[#5B6CFF]/35 transition-all duration-350 flex flex-col justify-between min-h-[360px] group relative overflow-hidden">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FAF1F5] text-[#D946EF] flex items-center justify-center shadow-xs">
                    <Sliders className="w-5.5 h-5.5" />
                  </div>
                  <h4 className="font-display text-xl font-black text-[#1F2937]">The Rescue Station</h4>
                  <p className="text-xs text-[#5F6B7A] font-medium leading-relaxed">
                    Overwhelmed by a high-stakes paper or task? Isolate it and instantly draft exceptionally polite, customized extension requests using AI.
                  </p>

                  {/* Mail mockup panel */}
                  <div className="bg-[#FAF9FD] border border-[#ECECF7] p-3 rounded-xl space-y-1.5 text-[9px] font-sans">
                    <div className="border-b border-[#ECECF7] pb-1 font-bold text-[#5F6B7A]">To: econ_prof@university.edu</div>
                    <div className="font-semibold text-[#1F2937] leading-normal italic">
                      "Dear Professor, I am writing to respectfully request a short 24-hour extension on the Economics paper draft..."
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Voice & Habit boards */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-[#EBEBF5] shadow-[0_4px_30px_rgba(20,20,43,0.015)] hover:shadow-[0_20px_50px_rgba(20,20,43,0.06)] hover:-translate-y-1.5 hover:border-[#5B6CFF]/35 transition-all duration-350 flex flex-col justify-between min-h-[360px] group relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-7 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-[#EEF0FF] text-[#5B6CFF] flex items-center justify-center shadow-xs">
                      <ShieldCheck className="w-5.5 h-5.5" />
                    </div>
                    <h4 className="font-display text-2xl font-black text-[#1F2937]">Speech Inputs & Habit Stacking</h4>
                    <p className="text-[13.5px] text-[#5F6B7A] font-medium leading-relaxed">
                      Duewell features native Web Speech Recognition to add tasks dictating hands-free, combined with healthy, proactive posture, hydration, and stretching alerts.
                    </p>
                  </div>

                  {/* Speech waveform and alert mockup */}
                  <div className="md:col-span-5 bg-[#EFF6FF] border border-[#DBEAFE] p-4 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Mic className="w-3.5 h-3.5 text-[#5B6CFF] animate-pulse" />
                      <span className="text-[10px] font-bold text-[#1E3A8A]">Listening...</span>
                    </div>
                    {/* Simulated Voice wave lines */}
                    <div className="flex items-center gap-1.5 py-1.5">
                      <span className="w-1 h-6 bg-[#5B6CFF] rounded-full animate-pulse" />
                      <span className="w-1 h-3 bg-[#5B6CFF] rounded-full" />
                      <span className="w-1 h-8 bg-[#5B6CFF] rounded-full animate-pulse" />
                      <span className="w-1 h-5 bg-[#5B6CFF] rounded-full" />
                      <span className="w-1 h-7 bg-[#5B6CFF] rounded-full animate-pulse" />
                      <span className="w-1 h-4 bg-[#5B6CFF] rounded-full" />
                    </div>
                    <div className="bg-white px-2 py-1.5 rounded-lg text-[9px] font-semibold text-[#2563EB] border border-[#BFDBFE]">
                      "Add reminder to finish reading Chapter 4 in 1 hour"
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 6. TESTIMONIALS SECTION */}
        <section className="max-w-7xl mx-auto px-6 md:px-12 py-20">
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-[#1E1B4B] text-white rounded-[40px] p-8 md:p-16 relative overflow-hidden shadow-2xl border border-white/5">
            {/* Background glowing ambient lights */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#5B6CFF]/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
              
              <div className="lg:col-span-5 space-y-5">
                <span className="text-[11px] font-black text-[#818CF8] uppercase tracking-widest bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md">VIBE2SHIP PICK</span>
                <h3 className="font-display text-4xl md:text-5xl font-black leading-[1.1] tracking-tight">
                  Why users prefer Duewell
                </h3>
                <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
                  Real workflow feedback from students and professionals recovering from severe deadline procrastination.
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Quote 1 */}
                <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-8 space-y-6 hover:border-white/25 transition-all duration-300 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Quote className="w-8 h-8 text-[#818CF8]/50" />
                      <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider">STUDENT</span>
                    </div>
                    <p className="text-xs md:text-[13px] text-slate-200 leading-relaxed italic font-medium">
                      "The Rescue Station feature is a literal lifesaver. I was paralyzed by an economics paper draft. Duewell let me isolate the anxiety, build daily focus sprints, and draft an extension request that bought me 24 critical hours."
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-slate-900 font-extrabold text-xs">
                      AR
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Ananya R.</p>
                      <p className="text-[10px] text-slate-400 font-medium">Engineering Undergrad</p>
                    </div>
                  </div>
                </div>

                {/* Quote 2 */}
                <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-8 space-y-6 hover:border-white/25 transition-all duration-300 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Quote className="w-8 h-8 text-[#818CF8]/50" />
                      <span className="text-[9px] font-black text-blue-400 bg-blue-500/15 border border-blue-500/20 px-3 py-1 rounded-full uppercase tracking-wider">DESIGNER</span>
                    </div>
                    <p className="text-xs md:text-[13px] text-slate-200 leading-relaxed italic font-medium">
                      "I used to feel exhausted opening calendar apps full of empty colored blocks. Duewell's Momentum Ring makes action feel tactile. Starting with the AI-suggested 'quick wins' has completely cured my morning dread."
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-slate-900 font-extrabold text-xs">
                      KD
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Kabir D.</p>
                      <p className="text-[10px] text-slate-400 font-medium">Freelance UX Architect</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* 7. FAQ ACCORDION SECTION */}
        <section className="max-w-4xl mx-auto px-6 py-24">
          <div className="text-center mb-16 space-y-3">
            <span className="text-[11px] font-black tracking-widest text-[#5B6CFF] bg-[#EEF0FF] px-3 py-1 rounded-full uppercase">Common Questions</span>
            <h3 className="font-display text-3xl md:text-[40px] font-black text-[#1F2937]">Frequently Asked Questions</h3>
            <p className="text-[#5F6B7A] text-[15px] font-semibold">Everything you need to know about starting your focus journey.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index}
                  className={`bg-white border transition-all duration-300 rounded-2xl overflow-hidden shadow-xs ${isOpen ? "border-[#5B6CFF] ring-4 ring-[#5B6CFF]/5" : "border-[#EBEBF5] hover:border-slate-300"}`}
                >
                  <button 
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-black text-[15px] md:text-base text-[#1F2937] hover:bg-[#FAF9FD] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isOpen ? "bg-[#EEF0FF] text-[#5B6CFF]" : "bg-slate-50 text-[#5F6B7A]"}`}>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "transform rotate-180" : ""}`} />
                    </span>
                  </button>
                  
                  <div 
                    className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-[300px] opacity-100 border-t border-[#FAF9FD]" : "max-h-0 opacity-0 pointer-events-none"}`}
                  >
                    <p className="text-[13.5px] text-[#5F6B7A] leading-relaxed p-6 bg-[#FAF9FD]/30 font-medium">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 8. FINAL BOTTOM CALL-TO-ACTION */}
        <section className="relative text-center max-w-4xl mx-auto px-6 pb-28 pt-10">
          <div className="bg-gradient-to-tr from-[#EEF2FF] via-[#FAF9FD] to-[#E0E7FF]/30 rounded-[40px] p-10 md:p-16 border border-[#E2E8F0] relative overflow-hidden shadow-lg group/cta">
            {/* Glowing background circles */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#5B6CFF]/10 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="font-display text-3xl md:text-5xl font-black text-[#1F2937] mb-5 leading-tight">
              Ready to tame your deadline stress?
            </h2>
            <p className="text-[#5F6B7A] text-[15px] md:text-[17px] max-w-xl mx-auto mb-10 leading-relaxed font-semibold">
              Join students and creators using Duewell to break planning paralysis and rebuild healthy daily momentum.
            </p>
            <button
              onClick={() => onNavigate(isAuthenticated ? "/app" : "/signup")}
              className="px-10 py-4.5 bg-gradient-to-r from-[#5B6CFF] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white font-extrabold text-[15.5px] rounded-2xl shadow-[0_10px_25px_rgba(91,108,255,0.2)] hover:shadow-[0_15px_35px_rgba(91,108,255,0.35)] hover:-translate-y-1 transition-all duration-250 cursor-pointer"
            >
              {isAuthenticated ? "Enter Workspace" : "Get Started Free"}
            </button>
          </div>
        </section>

      </main>

      {/* 9. FOOTER */}
      <footer className="w-full bg-[#FAF9FD] pt-16 pb-12 px-6 md:px-12 border-t border-[#ECECF5]/60">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-[13px] text-[#5F6B7A] font-medium">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#5B6CFF] to-[#4F46E5] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(91,108,255,0.15)]">
              <Zap className="w-3.5 h-3.5 fill-white stroke-none" />
            </div>
            <span className="font-display font-black text-[#1F2937] tracking-tight">Duewell</span>
          </div>
          
          <div className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 mx-1" /> for zero-stress productivity.
          </div>

          <div>
            &copy; 2026 Duewell. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
