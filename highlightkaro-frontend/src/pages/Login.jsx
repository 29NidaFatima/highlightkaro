import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import { showToast } from "../utils/toast";
import { Eye, EyeOff } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-50 px-4">
      <div className="w-full max-w-sm bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-cyan-200 p-6">

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-cyan-600 mb-1">
          Welcome Back
        </h2>
        <p className="text-center text-sm text-gray-600 mb-6">
          {searchParams.get("return") === "export"
            ? "Login to export your highlight video"
            : "Login to continue using HighlightKaro"}
        </p>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            className={`w-full p-2.5 rounded-lg border ${emailError ? "border-red-300" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-cyan-400`}
            onChange={handleEmailChange}
            onBlur={() => validateEmail(email)}
            disabled={isSubmitting}
          />
          {emailError && (
            <p className="text-xs text-red-600 mt-1">{emailError}</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              className={`w-full pr-10 p-2.5 rounded-lg border ${passwordError ? "border-red-300" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-cyan-400`}
              onChange={handlePasswordChange}
              onBlur={() => validatePassword(password)}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label="Toggle password visibility"
              disabled={isSubmitting}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {passwordError && (
            <p className="text-xs text-red-600 mt-1">{passwordError}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="mb-6 flex items-center gap-2 ">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            className="accent-cyan-600 focus:ring-cyan-600 focus:outline-none"
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isSubmitting}
          />
          <label htmlFor="rememberMe" className="text-sm text-gray-700">
            Remember me
          </label>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={!isFormValid || isSubmitting}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 
            shadow-sm hover:shadow-md active:scale-[0.98]
            ${!isFormValid || isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-cyan-500 hover:bg-cyan-600"
            }`}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
        {/* Register CTA */}
        <p className="text-sm text-center text-gray-600 mt-4">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-cyan-600 font-semibold cursor-pointer hover:underline"
          >
            Create one
          </span>
        </p>

      </div>
    </div>
  );
}
