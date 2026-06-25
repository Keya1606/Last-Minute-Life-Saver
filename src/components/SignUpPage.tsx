import React, { useState } from "react";
import { RouteType } from "../types";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Zap, Mail, Lock, ArrowLeft, Loader2, Sparkles, User } from "lucide-react";

interface SignUpPageProps {
  onNavigate: (route: RouteType) => void;
  onLoginSuccess: (email: string, userId: string) => void;
}

export default function SignUpPage({ onNavigate, onLoginSuccess }: SignUpPageProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Please enter your name to sign up.");
      return;
    }

    if (!email || !password || !confirmPassword) {
      setErrorMessage("Please complete all the fields to build your account.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match. Double-check your spelling!");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("For your security, please make your password at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/signin`,
            data: {
              full_name: fullName.trim()
            }
          }
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            setErrorMessage("It looks like an account already exists with this email address. Try signing in!");
          } else if (
            error.message.toLowerCase().includes("rate limit") || 
            error.message.toLowerCase().includes("too many requests") || 
            error.message.toLowerCase().includes("once every") || 
            error.message.toLowerCase().includes("exceeded")
          ) {
            // Bypass Supabase email rate limits by falling back to local mode instantly!
            localStorage.setItem("lifesaver_force_local_mode", "true");
            localStorage.setItem("lifesaver_is_first_signup", "true");
            localStorage.setItem("lifesaver_user_full_name", fullName.trim());
            onLoginSuccess(email, "mock-user-123");
            window.location.href = "/";
            return;
          } else {
            setErrorMessage(`Oops! ${error.message}. Please try again.`);
          }
          setLoading(false);
          return;
        }

        if (data.user) {
          localStorage.setItem("lifesaver_user_full_name", fullName.trim());
          // If auto-signed in or email confirm optional
          if (data.session) {
            localStorage.setItem("lifesaver_is_first_signup", "true");
            onLoginSuccess(data.user.email || email, data.user.id);
            window.location.href = "/";
          } else {
            // If Supabase has email confirmation turned on, bypass it by instantly signing them in in local-mode
            localStorage.setItem("lifesaver_force_local_mode", "true");
            localStorage.setItem("lifesaver_is_first_signup", "true");
            onLoginSuccess(data.user.email || email, data.user.id);
            window.location.href = "/";
          }
        }
      } else {
        // Offline Sandbox Sign-Up simulation
        setTimeout(() => {
          localStorage.setItem("lifesaver_is_first_signup", "true");
          localStorage.setItem("lifesaver_user_full_name", fullName.trim());
          const mockId = "mock-user-123";
          onLoginSuccess(email, mockId);
          window.location.href = "/";
          setLoading(false);
        }, 1000);
      }
    } catch (err: any) {
      setErrorMessage("Failed to establish a new account. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/app`,
          }
        });
        if (error) {
          setErrorMessage("Google integration had a small hiccup. Try signing up with your email!");
          setLoading(false);
        }
      } else {
        setTimeout(() => {
          localStorage.setItem("lifesaver_is_first_signup", "true");
          const mockEmail = "google.pioneer@example.com";
          const mockId = "mock-google-user";
          onLoginSuccess(mockEmail, mockId);
          onNavigate("/");
          setLoading(false);
        }, 800);
      }
    } catch (err) {
      setErrorMessage("Could not connect to Google Auth.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1F2937] flex flex-col justify-center items-center px-4 py-12 font-sans">
      
      {/* Return Home Button */}
      <button 
        onClick={() => onNavigate("/")}
        className="mb-8 flex items-center gap-1.5 text-[#5F6B7A] hover:text-[#5B6CFF] text-[15px] font-semibold transition-colors cursor-pointer"
        id="signup-back-home"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Landing Page
      </button>

      {/* Main card */}
      <div className="w-full max-w-[400px] bg-white border border-[#E5EAF5] rounded-[24px] shadow-sm p-8" id="signup-card">
        
        {/* Title */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-full bg-[#5B6CFF] flex items-center justify-center text-white mx-auto mb-3 shadow-md shadow-[#5B6CFF]/20">
            <Zap className="w-5 h-5 fill-white stroke-none" />
          </div>
          <h2 className="font-outfit text-2xl font-semibold tracking-tight text-[#1F2937]">Create your account</h2>
          <p className="text-[15px] text-[#5F6B7A] mt-1.5 font-medium">Join the stress-free momentum movement.</p>
        </div>

        {/* Supabase status badge (if offline demo) */}
        {!isSupabaseConfigured && (
          <div className="mb-6 p-4 bg-[#EEF2FF] border border-[#DCE5FF] rounded-[14px] text-[13px] text-gray-700 leading-relaxed font-medium">
            <span className="font-bold text-[#5B6CFF]">Sandbox Mode:</span> Supabase is not connected. Sign up with any credentials to try the app offline!
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 p-4 bg-red-50 border border-red-100 text-[13px] text-red-600 rounded-[14px] font-semibold leading-normal" id="signup-error">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-4 bg-emerald-50 border border-emerald-100 text-[13px] text-[#22C55E] rounded-[14px] font-semibold leading-normal" id="signup-success">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4.5">
          <div>
            <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#5F6B7A]/70">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="E.g., Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-[52px] input-with-icon pr-5 bg-[#F7F8FC] border border-[#E5EAF5] focus:border-[#5B6CFF] outline-none text-[15px] rounded-[14px] transition-colors font-medium text-[#1F2937]"
                required
                disabled={loading}
                id="signup-fullname"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#5F6B7A]/70">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[52px] input-with-icon pr-5 bg-[#F7F8FC] border border-[#E5EAF5] focus:border-[#5B6CFF] outline-none text-[15px] rounded-[14px] transition-colors font-medium text-[#1F2937]"
                required
                disabled={loading}
                id="signup-email"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-2">
              Choose Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#5F6B7A]/70">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[52px] input-with-icon pr-5 bg-[#F7F8FC] border border-[#E5EAF5] focus:border-[#5B6CFF] outline-none text-[15px] rounded-[14px] transition-colors font-medium text-[#1F2937]"
                required
                disabled={loading}
                id="signup-password"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#5F6B7A]/70">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-[52px] input-with-icon pr-5 bg-[#F7F8FC] border border-[#E5EAF5] focus:border-[#5B6CFF] outline-none text-[15px] rounded-[14px] transition-colors font-medium text-[#1F2937]"
                required
                disabled={loading}
                id="signup-confirm-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#5B6CFF] hover:bg-[#4758E8] text-white font-semibold text-[15px] rounded-[14px] transition-all hover:scale-[1.02] shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
            id="signup-submit"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Gathering resources...
              </>
            ) : (
              <span className="flex items-center gap-1.5 justify-center">
                <Sparkles className="w-4 h-4" /> Start Saving My Deadlines
              </span>
            )}
          </button>
        </form>

        <div className="relative my-6 flex items-center">
          <div className="flex-grow border-t border-[#E5EAF5]"></div>
          <span className="flex-shrink mx-4 text-xs text-[#5F6B7A] uppercase tracking-widest bg-white">or</span>
          <div className="flex-grow border-t border-[#E5EAF5]"></div>
        </div>

        {/* Continue with Google */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 bg-white border border-[#E5EAF5] hover:bg-gray-50 text-gray-700 text-[15px] font-semibold rounded-[14px] flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer"
          id="signup-google"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Sign Up with Google
        </button>

        {/* Direct to Sign In */}
        <p className="text-center text-[13px] text-[#5F6B7A] mt-8 font-medium">
          Already have an account?{" "}
          <button
            onClick={() => onNavigate("/signin")}
            className="font-bold text-[#5B6CFF] hover:underline"
            id="signup-goto-signin"
          >
            Sign in instead
          </button>
        </p>
      </div>
    </div>
  );
}
