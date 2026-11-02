import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import { showToast } from "../utils/toast";
import { Eye, EyeOff, Mail, KeyRound, ArrowRight, LoaderCircle } from "lucide-react";
import AuthLayout from "../components/AuthLayout";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  // Validate email format
  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError("Invalid email format");
      return false;
    }
    setEmailError("");
    return true;
  };

  // Validate password (presence only on login)
  const validatePassword = (value) => {
    if (!value) {
      setPasswordError("Password is required");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (value) {
      validateEmail(value);
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (value) {
      validatePassword(value);
    } else {
      setPasswordError("");
    }
  };

  const handleLogin = async () => {
    // Validate before submit
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Login failed. Please try again.", "error");
        return;
      }

      login(data);
      showToast("Welcome back!", "success");

      // Redirect based on return parameter
      const returnPath = searchParams.get("return");
      if (returnPath === "export") {
        // State will be restored in HighlightKaro, but export won't auto-start
        navigate("/");
      } else if (returnPath === "upgrade") {
        navigate("/upgrade");
      } else {
        navigate("/");
      }
    } catch {
      showToast("Login failed. Please check your connection and try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form is valid
  const isFormValid = email && password && !emailError && !passwordError;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={
        searchParams.get("return") === "export"
          ? "Log in to export your highlight video."
          : "Log in to continue creating with HighlightKaro."
      }
      footer={
        <>
          Don&apos;t have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="font-semibold text-cyan-700 underline-offset-4 hover:underline"
          >
            Create one free
          </button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (isFormValid && !isSubmitting) handleLogin();
        }}
        className="space-y-5"
      >
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="hk-label">Email</label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              className={`hk-input pl-10 ${emailError ? "hk-input-error" : ""}`}
              onChange={handleEmailChange}
              onBlur={() => validateEmail(email)}
              disabled={isSubmitting}
            />
          </div>
          {emailError && <p className="hk-field-error">{emailError}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="login-password" className="hk-label">Password</label>
          <div className="relative">
            <KeyRound size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              className={`hk-input pl-10 pr-11 ${passwordError ? "hk-input-error" : ""}`}
              onChange={handlePasswordChange}
              onBlur={() => validatePassword(password)}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Toggle password visibility"
              disabled={isSubmitting}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {passwordError && <p className="hk-field-error">{passwordError}</p>}
        </div>

        {/* Remember Me */}
        <label htmlFor="rememberMe" className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-gray-600">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            className="h-4 w-4 rounded accent-cyan-600"
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isSubmitting}
          />
          Keep me signed in for 7 days
        </label>

        {/* Login Button */}
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="hk-btn hk-btn-primary hk-btn-lg w-full"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle size={18} className="animate-spin" /> Logging in…
            </>
          ) : (
            <>
              Log in <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
