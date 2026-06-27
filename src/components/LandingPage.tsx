import React from "react";
import { RouteType } from "../types";
import { Zap, Clock, Activity, ArrowRight, ShieldCheck, Heart, Sliders } from "lucide-react";

interface LandingPageProps {
  onNavigate: (route: RouteType) => void;
  isAuthenticated: boolean;
  onLogout?: () => void;
  userEmail?: string;
}

export default function LandingPage({ onNavigate, isAuthenticated, onLogout, userEmail }: LandingPageProps) {
  const [fullName, setFullName] = React.useState("");

  React.useEffect(() => {
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

  return (
    <div className="min-h-screen bg-[#FAF9FD] text-[#1F2937] flex flex-col font-sans relative overflow-x-hidden selection:bg-[#5B6CFF]/10 selection:text-[#5B6CFF]">
      
      {/* ONE continuous premium background canvas texture with faint radial lighting and ultra-fine grain */}
      <div className="absolute inset-0 pointer-events-none -z-10 select-none overflow-hidden">
        {/* Soft, extremely faint radial lighting / low-opacity mist (opacity below 3%) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(91,108,255,0.025),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(91,108,255,0.015),transparent_75%)]" />
        
        {/* Ultra-fine paper grain & soft noise texture (opacity < 1.5% for extreme subtlety) */}
        <div 
          className="absolute inset-0 opacity-[0.012]" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        />
      </div>

      {/* 1. VISIBLY DEFINED PREMIUM NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full bg-white/75 backdrop-blur-xl border-b border-[rgba(94,107,255,0.05)] shadow-[0_8px_30px_rgba(20,20,43,0.015)]">
        <div className="w-full max-w-7xl mx-auto px-8 py-4.5 flex items-center justify-between">
          <div 
            className="flex items-center gap-2.5 cursor-pointer group" 
            onClick={() => onNavigate("/")}
            id="logo-container"
          >
            <div className="w-9 h-9 rounded-full bg-[#5B6CFF] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(91,108,255,0.12)] group-hover:scale-105 transition-all duration-250 ease-in-out">
              <Zap className="w-4.5 h-4.5 fill-white stroke-none" />
            </div>
            <span className="font-display text-[18px] font-extrabold tracking-tight text-[#1F2937]">Duewell</span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-[#5F6B7A] font-semibold hidden sm:inline-block">
                  Welcome, <span className="font-extrabold text-[#5B6CFF]">{getUsername()}</span>
                </span>
                <button
                  onClick={() => onNavigate("/app")}
                  className="w-9 h-9 rounded-full bg-[#5B6CFF] hover:bg-[#4758E8] text-white flex items-center justify-center font-sans font-bold text-xs shadow-[0_4px_12px_rgba(91,108,255,0.12)] hover:-translate-y-[2px] transition-all duration-250 ease-in-out focus:outline-none cursor-pointer"
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
                  className="px-4 py-2 text-[14px] font-semibold text-[#5F6B7A] hover:text-[#5B6CFF] transition-all duration-250 ease-in-out cursor-pointer"
                  id="header-signin"
                >
                  Sign in
                </button>
                <button 
                  onClick={() => onNavigate("/signup")}
                  className="px-5 py-2.5 bg-[#5B6CFF] hover:bg-[#4758E8] text-white font-bold text-[14px] rounded-xl shadow-[0_4px_12px_rgba(91,108,255,0.1)] hover:shadow-[0_8px_20px_rgba(91,108,255,0.15)] hover:-translate-y-[2px] transition-all duration-250 ease-in-out cursor-pointer"
                  id="header-signup"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <main className="flex-grow">
        <section className="relative w-full max-w-7xl mx-auto px-8 pt-24 pb-28 text-center flex flex-col items-center">
          
          {/* Centered Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#EEF0FF] border border-[rgba(94,107,255,0.15)] rounded-full text-[11px] font-extrabold text-[#5B6CFF] mb-8 uppercase tracking-wider select-none shadow-[0_2px_8px_rgba(91,108,255,0.03)]">
            <Zap className="w-3.5 h-3.5 fill-[#5B6CFF] stroke-none" />
            The antidote to deadline panic
          </div>
          
          {/* Main Display Typography Headline */}
          <h1 className="font-display text-4.5xl md:text-[68px] font-black tracking-tight text-[#1F2937] mb-8 leading-[1.08]">
            Stop missing deadlines.<br />
            <span className="text-[#5B6CFF]">Start finishing tasks.</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-[16px] md:text-[19px] text-[#5F6B7A] max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            The friendly, momentum-driven productivity companion that helps you plan, prioritize, and check off high-stakes tasks without the stress.
          </p>

          {/* Call-to-actions */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-5 w-full sm:w-auto">
            <button
              onClick={() => onNavigate(isAuthenticated ? "/app" : "/signup")}
              className="group w-full sm:w-auto px-8 py-4 bg-[#5B6CFF] hover:bg-[#4758E8] text-white font-extrabold text-[15px] rounded-xl shadow-[0_10px_30px_rgba(20,20,43,0.05)] hover:shadow-[0_18px_45px_rgba(20,20,43,0.10)] hover:-translate-y-[3px] transition-all duration-250 ease-in-out flex items-center justify-center gap-2 cursor-pointer"
              id="hero-cta"
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Started Free"} 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-250 ease-in-out" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("how-it-works");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full sm:w-auto px-8 py-4 bg-white/60 backdrop-blur-md border border-[rgba(94,107,255,0.12)] hover:border-[rgba(94,107,255,0.25)] text-[#475569] font-extrabold text-[15px] rounded-xl shadow-[0_10px_30px_rgba(20,20,43,0.02)] hover:shadow-[0_18px_45px_rgba(20,20,43,0.05)] hover:bg-[#5B6CFF]/5 hover:-translate-y-[3px] transition-all duration-250 ease-in-out cursor-pointer"
              id="hero-secondary"
            >
              See how it works
            </button>
          </div>
        </section>

        {/* 3. HOW IT WORKS SECTION */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-8 py-24 relative">
          
          <div className="text-center mb-16 space-y-3">
            <h2 className="font-display text-3xl md:text-[38px] font-black tracking-tight text-[#1F2937]">
              How Duewell Works
            </h2>
            <p className="text-[#5F6B7A] text-[15px] font-semibold max-w-xl mx-auto">
              Simple, human-centered steps to tackle your mounting list.
            </p>
          </div>

          {/* Interactive Steps with Directional Connector Arrows */}
          <div className="flex flex-col md:flex-row items-stretch justify-between gap-6 lg:gap-3">
            
            {/* Step 1 */}
            <div 
              className="flex-1 p-8 bg-white border border-[#ECECF7] rounded-[24px] shadow-[0_10px_30px_rgba(20,20,43,0.05)] hover:shadow-[0_18px_45px_rgba(20,20,43,0.10)] hover:-translate-y-2 hover:border-[#5B6CFF] transition-all duration-250 ease-in-out flex flex-col justify-between min-h-[250px] group cursor-default" 
              id="step-card-1"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#5B6CFF]/5 border border-[rgba(94,107,255,0.05)] flex items-center justify-center text-[#5B6CFF] mb-6 group-hover:bg-[#5B6CFF]/10 transition-all duration-250 ease-in-out">
                  <Clock className="w-5.5 h-5.5" />
                </div>
                <h3 className="font-display text-[17px] font-extrabold text-[#1F2937] mb-2.5">1. Add Your Deadlines</h3>
                <p className="text-[#5F6B7A] text-[13.5px] font-medium leading-relaxed">
                  List what needs to get done, when it's due, and how long you think it'll take. No complex tagging or setup required.
                </p>
              </div>
              <div className="text-[rgba(91,108,255,0.05)] font-display text-5xl font-black mt-6 text-right select-none group-hover:text-[rgba(91,108,255,0.12)] transition-colors duration-250 ease-in-out">01</div>
            </div>

            {/* Subtle elegant connector 1 */}
            <div className="hidden md:flex items-center justify-center px-2">
              <div className="w-12 h-[2px] bg-[rgba(94,107,255,0.06)] relative flex items-center justify-center">
                <div className="absolute w-6 h-6 rounded-full bg-white border border-[#ECECF7] shadow-[0_2px_8px_rgba(20,20,43,0.02)] flex items-center justify-center text-[#5B6CFF]">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div 
              className="flex-grow flex-1 p-8 bg-white border border-[#ECECF7] rounded-[24px] shadow-[0_10px_30px_rgba(20,20,43,0.05)] hover:shadow-[0_18px_45px_rgba(20,20,43,0.10)] hover:-translate-y-2 hover:border-[#5B6CFF] transition-all duration-250 ease-in-out flex flex-col justify-between min-h-[250px] group cursor-default" 
              id="step-card-2"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#5B6CFF]/5 border border-[rgba(94,107,255,0.05)] flex items-center justify-center text-[#5B6CFF] mb-6 group-hover:bg-[#5B6CFF]/10 transition-all duration-250 ease-in-out">
                  <Zap className="w-5.5 h-5.5" />
                </div>
                <h3 className="font-display text-[17px] font-extrabold text-[#1F2937] mb-2.5">2. Auto-Prioritize with AI</h3>
                <p className="text-[#5F6B7A] text-[13.5px] font-medium leading-relaxed">
                  One tap lets Gemini reorganize your chaos. Identify quick wins, critical tasks, and dynamic tips to manage anxiety.
                </p>
              </div>
              <div className="text-[rgba(91,108,255,0.05)] font-display text-5xl font-black mt-6 text-right select-none group-hover:text-[rgba(91,108,255,0.12)] transition-colors duration-250 ease-in-out">02</div>
            </div>

            {/* Subtle elegant connector 2 */}
            <div className="hidden md:flex items-center justify-center px-2">
              <div className="w-12 h-[2px] bg-[rgba(94,107,255,0.06)] relative flex items-center justify-center">
                <div className="absolute w-6 h-6 rounded-full bg-white border border-[#ECECF7] shadow-[0_2px_8px_rgba(20,20,43,0.02)] flex items-center justify-center text-[#5B6CFF]">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div 
              className="flex-1 p-8 bg-white border border-[#ECECF7] rounded-[24px] shadow-[0_10px_30px_rgba(20,20,43,0.05)] hover:shadow-[0_18px_45px_rgba(20,20,43,0.10)] hover:-translate-y-2 hover:border-[#5B6CFF] transition-all duration-250 ease-in-out flex flex-col justify-between min-h-[250px] group cursor-default" 
              id="step-card-3"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#5B6CFF]/5 border border-[rgba(94,107,255,0.05)] flex items-center justify-center text-[#5B6CFF] mb-6 group-hover:bg-[#5B6CFF]/10 transition-all duration-250 ease-in-out">
                  <Activity className="w-5.5 h-5.5" />
                </div>
                <h3 className="font-display text-[17px] font-extrabold text-[#1F2937] mb-2.5">3. Generate Daily Schedule</h3>
                <p className="text-[#5F6B7A] text-[13.5px] font-medium leading-relaxed">
                  Generate an hourly, realistic roadmap integrating work intervals, habits, and rest. Build your daily Momentum Ring!
                </p>
              </div>
              <div className="text-[rgba(91,108,255,0.05)] font-display text-5xl font-black mt-6 text-right select-none group-hover:text-[rgba(91,108,255,0.12)] transition-colors duration-250 ease-in-out">03</div>
            </div>

          </div>
        </section>

        {/* 4. "CRAFTED FOR HEALTHY MOMENTUM" FEATURES GRID */}
        <section className="bg-transparent py-24 relative">
          <div className="max-w-7xl mx-auto px-8">
            
            <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
              <h2 className="font-display text-3xl md:text-[38px] font-black tracking-tight text-[#1F2937]">
                Crafted for Healthy Momentum
              </h2>
              <p className="text-[#5F6B7A] text-[15px] font-semibold max-w-xl mx-auto">
                Features designed to make finishing your tasks feel deeply rewarding, not stressful.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Smart Prioritization */}
              <div 
                className="bg-white p-7 rounded-[24px] border border-[rgba(94,107,255,0.08)] shadow-[0_10px_30px_rgba(20,20,43,0.05)] hover:shadow-[0_18px_45px_rgba(20,20,43,0.10)] hover:-translate-y-2 hover:border-[#5B6CFF] transition-all duration-250 ease-in-out flex flex-col justify-between min-h-[220px] relative overflow-hidden group cursor-default" 
                id="feature-1"
              >
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-[#5B6CFF]/5 text-[#5B6CFF] flex items-center justify-center mb-6 group-hover:bg-[#5B6CFF]/10 transition-all duration-250 ease-in-out">
                    <Zap className="w-5 h-5 fill-[#5B6CFF] stroke-none" />
                  </div>
                  <h4 className="font-display text-[15.5px] font-extrabold text-[#1F2937] mb-2.5">Smart Prioritization</h4>
                  <p className="text-[13px] text-[#5F6B7A] font-medium leading-relaxed">
                    Gemini sorts tasks into clear action zones: Critical, Important, or Malleable.
                  </p>
                </div>
              </div>

              {/* Card 2: Realistic Planning */}
              <div 
                className="bg-white p-7 rounded-[24px] border border-[rgba(94,107,255,0.08)] shadow-[0_10px_30px_rgba(20,20,43,0.05)] hover:shadow-[0_18px_45px_rgba(20,20,43,0.10)] hover:-translate-y-2 hover:border-[#5B6CFF] transition-all duration-250 ease-in-out flex flex-col justify-between min-h-[220px] relative overflow-hidden group cursor-default" 
                id="feature-2"
              >
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-[#5B6CFF]/5 text-[#5B6CFF] flex items-center justify-center mb-6 group-hover:bg-[#5B6CFF]/10 transition-all duration-250 ease-in-out">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <h4 className="font-display text-[15.5px] font-extrabold text-[#1F2937] mb-2.5">Realistic Planning</h4>
                  <p className="text-[13px] text-[#5F6B7A] font-medium leading-relaxed">
                    Automatically blends deadlines, time estimates, and breaks into an achievable schedule.
                  </p>
                </div>
              </div>

              {/* Card 3: Momentum Tracker */}
              <div 
                className="bg-white p-7 rounded-[24px] border border-[rgba(94,107,255,0.08)] shadow-[0_10px_30px_rgba(20,20,43,0.05)] hover:shadow-[0_18px_45px_rgba(20,20,43,0.10)] hover:-translate-y-2 hover:border-[#5B6CFF] transition-all duration-250 ease-in-out flex flex-col justify-between min-h-[220px] relative overflow-hidden group cursor-default" 
                id="feature-3"
              >
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-[#5B6CFF]/5 text-[#5B6CFF] flex items-center justify-center mb-6 group-hover:bg-[#5B6CFF]/10 transition-all duration-250 ease-in-out">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h4 className="font-display text-[15.5px] font-extrabold text-[#1F2937] mb-2.5">Momentum Tracker</h4>
                  <p className="text-[13px] text-[#5F6B7A] font-medium leading-relaxed">
                    Watch your circular ring fill with warm energy as you stack small wins during the day.
                  </p>
                </div>
              </div>

              {/* Card 4: Habit Integration */}
              <div 
                className="bg-white p-7 rounded-[24px] border border-[rgba(94,107,255,0.08)] shadow-[0_10px_30px_rgba(20,20,43,0.05)] hover:shadow-[0_18px_45px_rgba(20,20,43,0.10)] hover:-translate-y-2 hover:border-[#5B6CFF] transition-all duration-250 ease-in-out flex flex-col justify-between min-h-[220px] relative overflow-hidden group cursor-default" 
                id="feature-4"
              >
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-[#5B6CFF]/5 text-[#5B6CFF] flex items-center justify-center mb-6 group-hover:bg-[#5B6CFF]/10 transition-all duration-250 ease-in-out">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="font-display text-[15.5px] font-extrabold text-[#1F2937] mb-2.5">Habit Integration</h4>
                  <p className="text-[13px] text-[#5F6B7A] font-medium leading-relaxed">
                    Proactively stack regular stretch, hydration, or mindfulness habits with task sprints.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* 5. FOOTER */}
      <footer className="w-full bg-transparent pt-24 pb-16 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-[13px] text-[#5F6B7A] font-medium">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#5B6CFF] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(91,108,255,0.15)]">
              <Zap className="w-3.5 h-3.5 fill-white stroke-none" />
            </div>
            <span className="font-display font-extrabold text-[#1F2937] tracking-tight">Duewell</span>
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
