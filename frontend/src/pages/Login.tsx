import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api";
import { Wrench, Shield, Zap, ArrowRight, Eye, EyeOff, Key, Mail, RefreshCw } from "lucide-react";

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isNewRegister = location.state?.newRegister;

  useEffect(() => {
    document.title = "Login — FixTrack Pro";
  }, []);

  // Cleanup cooldown interval
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = () => {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setResendMessage("");
    setError("");
    try {
      const res = await api.auth.resendOTP({ email: email.toLowerCase().trim() });
      setResendMessage(res.message || "A new code has been sent!");
      setOtp("");
      startCooldown();
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResendMessage("");
    try {
      if (requiresOTP) {
        const res = await api.auth.verifyOTP({ email: email.toLowerCase().trim(), otp });
        if (res.error) throw new Error(res.error);
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        onLogin(res.user);
        navigate(res.user.role === "admin" ? "/admin" : "/");
      } else {
        const res = await api.auth.login({ email: email.toLowerCase().trim(), password });
        if (res.error) throw new Error(res.error);
        
        if (res.requiresOTP) {
          setRequiresOTP(true);
          startCooldown();
        } else {
          localStorage.setItem("token", res.token);
          localStorage.setItem("user", JSON.stringify(res.user));
          onLogin(res.user);
          navigate(res.user.role === "admin" ? "/admin" : "/");
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 lg:bg-white">
      {/* Left Side - Marketing Content (Hidden on mobile/tablet) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#5546e4] text-white p-16 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-[#5546e4]" />
            </div>
            <span className="text-2xl font-bold tracking-tight">FixTrack Pro</span>
          </div>

          <div className="max-w-md">
            <h1 className="text-5xl font-black leading-tight mb-6">
              The #1 Repair Shop Management System in Nigeria.
            </h1>
            <p className="text-indigo-100 text-lg leading-relaxed opacity-90">
              Digitize your workflow, track every repair, and grow your profit with the most practical tool for phone and laptop engineers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-12">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-lg">Secure & Reliable</h3>
            <p className="text-indigo-100 text-sm opacity-80">
              Your data is safe and isolated per shop.
            </p>
          </div>
          <div className="space-y-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-lg">Fast Check-in</h3>
            <p className="text-indigo-100 text-sm opacity-80">
              Check in a device in under 30 seconds.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-16">
        <div className="w-full max-w-md bg-white p-8 lg:p-0 rounded-2xl shadow-xl shadow-slate-200/50 lg:shadow-none">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-12 lg:hidden">
            <div className="w-8 h-8 bg-[#5546e4] rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">FixTrack Pro</span>
          </div>
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isNewRegister ? "Account Created" : "Welcome Back"}
            </h2>
            <p className="text-slate-500">
              {requiresOTP ? "Enter the 6-digit code sent to your email" : isNewRegister ? "Please login to continue" : "Login to manage your shop"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {error}
            </div>
          )}

          {resendMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-xl flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              {resendMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!requiresOTP ? (
              <>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      PASSWORD
                    </label>
                    <Link to="/forgot-password" title="Forgot Password" className="text-[10px] font-bold text-indigo-600 hover:underline">
                      FORGOT PASSWORD?
                    </Link>
                  </div>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  VERIFICATION CODE
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  className="w-full px-4 py-4 text-center text-3xl font-black tracking-[1em] rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-200"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
                <p className="mt-4 text-center text-xs text-slate-500">
                  Didn't receive code?{" "}
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || resending}
                    onClick={handleResendOTP}
                    className={`font-bold ${
                      resendCooldown > 0 || resending
                        ? "text-slate-400 cursor-not-allowed"
                        : "text-indigo-600 hover:underline"
                    }`}
                  >
                    {resending
                      ? "Sending..."
                      : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Resend Code"}
                  </button>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5546e4] hover:bg-[#4438c7] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? "Processing..." : (
                <>
                  {requiresOTP ? "Verify & Login" : "Login to Dashboard"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-500 text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-[#5546e4] font-bold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

