import React, { useState, useEffect, useRef } from "react";
import { Wallet, Eye, EyeOff, MailCheck, ArrowLeft, RefreshCw, Sparkles, Check } from "lucide-react";
import { apiFetch } from "../utils/api";
import { useGoogleLogin } from "@react-oauth/google";

export function LoginPage({ onLogin }: { onLogin: (user: any) => void }) {
  const [view, setView] = useState<"auth" | "verify" | "forgot" | "reset">("auth");
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Verification & Reset View State
  const [verifyEmail, setVerifyEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [timer, setTimer] = useState(30);
  const [copied, setCopied] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for resending code
  useEffect(() => {
    let interval: any;
    if ((view === "verify" || view === "reset") && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [view, timer]);

  // Check URL params for direct email verification or password reset link click
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlEmail = params.get("email") || params.get("verify_email");
    const urlCode = params.get("code") || params.get("token");
    const isResetPath = window.location.pathname.includes("reset-password");

    if (isResetPath && urlEmail && urlCode) {
      setVerifyEmail(urlEmail);
      const digits = urlCode.replace(/\D/g, "").slice(0, 6).split("");
      while (digits.length < 6) digits.push("");
      setOtp(digits);
      setView("reset");
    } else if (urlEmail && urlCode) {
      setVerifyEmail(urlEmail);
      const digits = urlCode.replace(/\D/g, "").slice(0, 6).split("");
      while (digits.length < 6) digits.push("");
      setOtp(digits);
      setView("verify");
      if (digits.join("").length === 6) {
        handleVerifySubmit(undefined, urlCode.replace(/\D/g, "").slice(0, 6), urlEmail);
      }
    } else if (urlEmail) {
      setVerifyEmail(urlEmail);
      setView(isResetPath ? "reset" : "verify");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        if (!name) {
          setError("Name is required");
          setLoading(false);
          return;
        }
        const res = await apiFetch("/auth/signup", {
          method: "POST",
          body: JSON.stringify({ email, password, name })
        });

        if (res.data?.requires_verification) {
          setVerifyEmail(email);
          setDevCode(res.data.dev_verification_code || null);
          setOtp(["", "", "", "", "", ""]);
          setTimer(30);
          setView("verify");
          setError("");
        } else if (res.data?.access_token) {
          localStorage.setItem("token", res.data.access_token);
          if (res.data.refresh_token) localStorage.setItem("refresh_token", res.data.refresh_token);
          onLogin(res.data.user);
        }
      } else {
        const res = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });
        localStorage.setItem("token", res.data.access_token);
        if (res.data.refresh_token) localStorage.setItem("refresh_token", res.data.refresh_token);
        onLogin(res.data.user);
      }
    } catch (err: any) {
      if (err.data?.requires_verification) {
        setVerifyEmail(email || err.data.email);
        setDevCode(err.data.dev_verification_code || null);
        setOtp(["", "", "", "", "", ""]);
        setTimer(30);
        setView("verify");
        setError("");
      } else {
        setError(err.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").split("").slice(0, 6);
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const focusIndex = Math.min(index + digits.length, 5);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const digits = pastedData.split("");
      const newOtp = ["", "", "", "", "", ""];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      const lastIndex = Math.min(digits.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const handleVerifySubmit = async (e?: React.FormEvent, customCode?: string, customEmail?: string) => {
    if (e) e.preventDefault();
    const emailToVerify = customEmail || verifyEmail;
    const codeToVerify = customCode || otp.join("");
    if (codeToVerify.length < 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email: emailToVerify, code: codeToVerify })
      });
      localStorage.setItem("token", res.data.access_token);
      if (res.data.refresh_token) localStorage.setItem("refresh_token", res.data.refresh_token);
      if (typeof window !== "undefined" && window.history) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      onLogin(res.data.user);
    } catch (err: any) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (timer > 0 || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: verifyEmail })
      });
      setDevCode(res.data?.dev_verification_code || null);
      setTimer(30);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAutofill = () => {
    if (!devCode) return;
    const digits = devCode.split("");
    setOtp(digits);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    handleVerifySubmit(undefined, devCode);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const emailToSend = verifyEmail || email;
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: emailToSend })
      });
      setVerifyEmail(emailToSend);
      setSuccessMsg(`A 6-digit verification code and reset link have been sent to ${emailToSend}. Please open your email to reset your password.`);
      setOtp(["", "", "", "", "", ""]);
      setTimer(30);
      setView("reset");
    } catch (err: any) {
      setError(err.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    const codeStr = otp.join("").trim();
    if (codeStr.length !== 6) {
      setError("Please enter the 6-digit verification code sent to your email");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email: verifyEmail, code: codeStr, new_password: newPassword })
      });
      if (typeof window !== "undefined" && window.history) {
        window.history.replaceState({}, document.title, "/");
      }
      setSuccessMsg("Password updated successfully! You can now log in using your new password.");
      setEmail(verifyEmail);
      setPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setView("auth");
      setIsSignup(false);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      setLoading(true);
      try {
        const res = await apiFetch("/auth/google", {
          method: "POST",
          body: JSON.stringify({ token: tokenResponse.access_token })
        });
        localStorage.setItem("token", res.data.access_token);
        if (res.data.refresh_token) localStorage.setItem("refresh_token", res.data.refresh_token);
        if (typeof window !== "undefined" && window.history) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        onLogin(res.data.user);
      } catch (err: any) {
        setError(err.message || "Google login failed");
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError("Google Login Failed or was cancelled");
    }
  });

  const handleGoogleAuth = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.includes("dummy_client_id") || clientId.includes("demo.apps.googleusercontent.com")) {
      setError("Please replace the demo VITE_GOOGLE_CLIENT_ID in your .env file with your original Google OAuth Client ID, then restart Vite or rebuild Docker.");
      return;
    }
    googleLogin();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neu p-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="w-full max-w-md bg-neu shadow-neu-flat rounded-[2.5rem] p-8 transition-all duration-300">
        
        {view === "verify" ? (
          /* ── EMAIL VERIFICATION VIEW ── */
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-[1.5rem] bg-neu shadow-neu-flat flex items-center justify-center mb-5 border border-white/40">
              <MailCheck size={32} className="text-[#3b82f6] animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-[#000000] tracking-tight">Verify Your Email</h1>
            <p className="text-[#1e293b] font-medium text-sm mt-1.5 text-center px-4 leading-relaxed">
              We've sent a 6-digit verification code to <span className="font-bold text-[#000000]">{verifyEmail}</span>.
            </p>

            {error && (
              <div className="mt-4 w-full p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl text-center font-semibold animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={(e) => handleVerifySubmit(e)} className="w-full mt-6 space-y-6">
              <div className="flex justify-between gap-2 px-1" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 bg-neu shadow-neu-pressed border-0 text-[#000000] text-xl font-extrabold text-center rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition-all"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className={`w-full bg-[#3b82f6] text-white text-lg font-bold py-4 rounded-2xl shadow-lg shadow-[#3b82f6]/30 transition-all ${loading || otp.join("").length < 6 ? "opacity-50 cursor-not-allowed" : "hover:bg-[#2563eb] active:scale-[0.98]"}`}
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-3 w-full">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={timer > 0 || loading}
                className={`text-sm font-bold flex items-center gap-1.5 transition-colors ${timer > 0 || loading ? "text-muted-foreground cursor-not-allowed" : "text-[#3b82f6] hover:underline cursor-pointer"}`}
              >
                <RefreshCw size={15} className={loading && timer === 0 ? "animate-spin" : ""} />
                {timer > 0 ? `Resend verification code (${timer}s)` : "Resend verification code"}
              </button>

              <button
                type="button"
                onClick={() => { setView("auth"); setError(""); }}
                className="text-xs font-semibold text-[#1e293b] hover:text-[#000000] flex items-center gap-1 mt-2 transition-colors"
              >
                <ArrowLeft size={14} />
                Back to Sign In
              </button>
            </div>
          </div>
        ) : view === "forgot" ? (
          /* ── FORGOT / CHANGE PASSWORD VIEW ── */
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-[1.5rem] bg-neu shadow-neu-flat flex items-center justify-center mb-5 border border-white/40">
              <RefreshCw size={32} className="text-[#3b82f6]" />
            </div>
            <h1 className="text-2xl font-bold text-[#000000] tracking-tight">Change Password</h1>
            <p className="text-[#1e293b] font-medium text-sm mt-1.5 text-center px-4 leading-relaxed">
              Enter your registered email address. We will send a verification code and reset link to your inbox.
            </p>

            {error && (
              <div className="mt-4 w-full p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl text-center font-semibold animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="w-full mt-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1e293b] uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email" 
                  value={verifyEmail || email}
                  onChange={(e) => { setVerifyEmail(e.target.value); setEmail(e.target.value); }}
                  placeholder="you@example.com"
                  className="w-full bg-neu shadow-neu-pressed border-0 text-[#000000] text-base rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 placeholder:text-muted-foreground transition-all"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full bg-[#3b82f6] text-white text-lg font-bold py-4 rounded-2xl shadow-lg shadow-[#3b82f6]/30 transition-all ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-[#2563eb] active:scale-[0.98]"}`}
              >
                {loading ? "Sending link..." : "Send Verification Email"}
              </button>
            </form>

            <button 
              onClick={() => { setView("auth"); setError(""); }}
              className="mt-6 text-sm font-semibold text-[#1e293b] hover:text-[#000000] flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>
          </div>
        ) : view === "reset" ? (
          /* ── RESET PASSWORD VIEW ── */
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-[1.5rem] bg-neu shadow-neu-flat flex items-center justify-center mb-5 border border-white/40">
              <RefreshCw size={32} className="text-[#3b82f6]" />
            </div>
            <h1 className="text-2xl font-bold text-[#000000] tracking-tight">Set New Password</h1>
            <p className="text-[#1e293b] font-medium text-sm mt-1.5 text-center px-4 leading-relaxed">
              Account: <span className="font-bold text-[#000000]">{verifyEmail}</span>
            </p>

            {error && (
              <div className="mt-4 w-full p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl text-center font-semibold animate-shake">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mt-4 w-full p-3 bg-green-500/10 border border-green-500/20 text-green-600 text-sm rounded-xl text-center font-semibold">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="w-full mt-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1e293b] uppercase tracking-widest ml-1">6-Digit Verification Code</label>
                <div className="flex justify-between gap-2 px-1" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-extrabold text-[#000000] bg-neu shadow-neu-pressed border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1e293b] uppercase tracking-widest ml-1">New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-neu shadow-neu-pressed border-0 text-[#000000] text-base rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 placeholder:text-muted-foreground transition-all pr-12"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-black/5"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1e293b] uppercase tracking-widest ml-1">Confirm New Password</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neu shadow-neu-pressed border-0 text-[#000000] text-base rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 placeholder:text-muted-foreground transition-all"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full bg-[#3b82f6] text-white text-lg font-bold py-4 rounded-2xl shadow-lg shadow-[#3b82f6]/30 transition-all ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-[#2563eb] active:scale-[0.98]"}`}
              >
                {loading ? "Updating..." : "Submit New Password"}
              </button>
            </form>

            <button 
              onClick={() => { setView("auth"); setError(""); }}
              className="mt-6 text-sm font-semibold text-[#1e293b] hover:text-[#000000] flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>
          </div>
        ) : (
          /* ── LOGIN / SIGNUP VIEW ── */
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-[1.5rem] bg-neu shadow-neu-flat flex items-center justify-center mb-4">
                <Wallet size={32} className="text-[#3b82f6]" />
              </div>
              <h1 className="text-2xl font-bold text-[#000000] tracking-tight">{isSignup ? "Create Account" : "Welcome Back"}</h1>
              <p className="text-[#1e293b] font-medium text-sm mt-1">{isSignup ? "Sign up to start tracking" : "Sign in to FinTrack"}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl text-center font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignup && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1e293b] uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-neu shadow-neu-pressed border-0 text-[#000000] text-base rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 placeholder:text-muted-foreground transition-all"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1e293b] uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-neu shadow-neu-pressed border-0 text-[#000000] text-base rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 placeholder:text-muted-foreground transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1e293b] uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-neu shadow-neu-pressed border-0 text-[#000000] text-base rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 placeholder:text-muted-foreground transition-all pr-12"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-black/5"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {!isSignup && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setView("forgot");
                        setError("");
                        setSuccessMsg("");
                        if (email) setVerifyEmail(email);
                      }}
                      className="text-xs font-bold text-[#3b82f6] hover:underline"
                    >
                      Change / Forgot Password?
                    </button>
                  </div>
                )}
              </div>

              {isSignup && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1e293b] uppercase tracking-widest ml-1">Confirm Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neu shadow-neu-pressed border-0 text-[#000000] text-base rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 placeholder:text-muted-foreground transition-all pr-12"
                      required
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full bg-[#3b82f6] text-white text-lg font-bold py-4 rounded-2xl shadow-lg shadow-[#3b82f6]/30 transition-all ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-[#2563eb] active:scale-[0.98]"}`}
              >
                {loading ? "Please wait..." : (isSignup ? "Sign Up" : "Sign In")}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-neu text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <button 
                onClick={handleGoogleAuth}
                className="mt-6 w-full bg-neu shadow-neu-flat text-[#1e293b] text-base font-bold py-3.5 rounded-2xl hover:shadow-neu-pressed transition-all flex items-center justify-center gap-3"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </div>

            <div className="mt-8 text-center">
              <div className="text-sm font-semibold text-[#1e293b]">
                {isSignup ? "Already have an account?" : "Don't have an account?"} 
                <button type="button" onClick={() => { setIsSignup(!isSignup); setError(""); }} className="text-[#3b82f6] hover:underline ml-1">
                  {isSignup ? "Sign in" : "Sign up"}
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
