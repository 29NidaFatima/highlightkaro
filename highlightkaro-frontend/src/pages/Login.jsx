import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed. Please try again.");
        return;
      }

      login(data);
      
      // Redirect based on return parameter
      const returnPath = searchParams.get("return");
      if (returnPath === "export") {
        // State will be restored in HighlightKaro, but export won't auto-start
        navigate("/");
      } else {
        navigate("/");
      }
    } catch (err) {
      alert("Login failed. Please check your connection and try again.");
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
            className={`w-full p-2.5 rounded-lg border ${
              emailError ? "border-red-300" : "border-gray-300"
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
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            className={`w-full p-2.5 rounded-lg border ${
              passwordError ? "border-red-300" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-cyan-400`}
            onChange={handlePasswordChange}
            onBlur={() => validatePassword(password)}
            disabled={isSubmitting}
          />
          {passwordError && (
            <p className="text-xs text-red-600 mt-1">{passwordError}</p>
          )}
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={!isFormValid || isSubmitting}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 shadow-md ${
            !isFormValid || isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-cyan-500 hover:bg-cyan-600"
          }`}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        {/* Footer */}
        <p className="text-xs text-center text-gray-500 mt-4">
          Secure login • Plan-based features enabled
        </p>
      </div>
    </div>
  );
}
