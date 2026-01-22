import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ---------- VALIDATIONS ---------- */

  const validateName = (value) => {
    if (!value.trim()) {
      setNameError("Name is required");
      return false;
    }
    if (value.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      return false;
    }
    setNameError("");
    return true;
  };

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

  const validatePassword = (value) => {
    if (!value) {
      setPasswordError("Password is required");
      return false;
    }
    if (value.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }
    if (!/[A-Z]/.test(value)) {
      setPasswordError("Password must include 1 uppercase letter");
      return false;
    }
    if (!/[a-z]/.test(value)) {
      setPasswordError("Password must include 1 lowercase letter");
      return false;
    }
    if (!/[0-9]/.test(value)) {
      setPasswordError("Password must include 1 number");
      return false;
    }
    setPasswordError("");
    return true;
  };

  /* ---------- HANDLERS ---------- */

  const handleRegister = async () => {
    const ok =
      validateName(name) &
      validateEmail(email) &
      validatePassword(password);

    if (!ok) return;

    setIsSubmitting(true);

    try {
      await registerUser({ name, email, password });
      alert("Account created successfully. Please login.");
      navigate("/login");
    } catch (err) {
      alert(err.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    name &&
    email &&
    password &&
    !nameError &&
    !emailError &&
    !passwordError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-50 px-4">
      <div className="w-full max-w-sm bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-cyan-200 p-6">

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-cyan-600 mb-1">
          Create Account
        </h2>
        <p className="text-center text-sm text-gray-600 mb-6">
          Start creating highlight videos in seconds
        </p>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value) validateName(e.target.value);
            }}
            onBlur={() => validateName(name)}
            disabled={isSubmitting}
            className={`w-full p-2.5 rounded-lg border ${nameError ? "border-red-300" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-cyan-400`}
          />
          {nameError && (
            <p className="text-xs text-red-600 mt-1">{nameError}</p>
          )}
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (e.target.value) validateEmail(e.target.value);
            }}
            onBlur={() => validateEmail(email)}
            disabled={isSubmitting}
            className={`w-full p-2.5 rounded-lg border ${emailError ? "border-red-300" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-cyan-400`}
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
            onChange={(e) => {
              setPassword(e.target.value);
              if (e.target.value) validatePassword(e.target.value);
            }}
            onBlur={() => validatePassword(password)}
            disabled={isSubmitting}
            className={`w-full p-2.5 rounded-lg border ${passwordError ? "border-red-300" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-cyan-400`}
          />
          {passwordError && (
            <p className="text-xs text-red-600 mt-1">{passwordError}</p>
          )}
        </div>

        {/* Register Button */}
        <button
          onClick={handleRegister}
          disabled={!isFormValid || isSubmitting}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 
            shadow-sm hover:shadow-md active:scale-[0.98]
            ${!isFormValid || isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-cyan-500 hover:bg-cyan-600"
            }`}
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>

        {/* Login CTA */}
        <p className="text-sm text-center text-gray-600 mt-4">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-cyan-600 font-semibold cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>

      </div>
    </div>
  );
}
