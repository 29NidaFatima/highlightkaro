import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi";
import { showToast } from "../utils/toast";
import { Eye, EyeOff, Mail, KeyRound, User, Check, ArrowRight, LoaderCircle } from "lucide-react";
import AuthLayout from "../components/AuthLayout";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
      showToast("Account created successfully. Please login.", "success");
      navigate("/login");
    } catch (err) {
      showToast(err.message || "Registration failed", "error");
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

  // Live checklist under the password field
  const passwordRules = [
    { ok: password.length >= 8, text: "8+ characters" },
    { ok: /[A-Z]/.test(password), text: "Uppercase" },
    { ok: /[a-z]/.test(password), text: "Lowercase" },
    { ok: /[0-9]/.test(password), text: "Number" },
  ];

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free forever plan. Upgrade only when you need more."
      footer={
        <>
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="font-semibold text-cyan-700 underline-offset-4 hover:underline"
          >
            Log in
          </button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (isFormValid && !isSubmitting) handleRegister();
        }}
        className="space-y-5"
      >
        {/* Name */}
        <div>
          <label htmlFor="reg-name" className="hk-label">Full name</label>
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value) validateName(e.target.value);
              }}
              onBlur={() => validateName(name)}
              disabled={isSubmitting}
              className={`hk-input pl-10 ${nameError ? "hk-input-error" : ""}`}
            />
          </div>
          {nameError && <p className="hk-field-error">{nameError}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="hk-label">Email</label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (e.target.value) validateEmail(e.target.value);
              }}
              onBlur={() => validateEmail(email)}
              disabled={isSubmitting}
              className={`hk-input pl-10 ${emailError ? "hk-input-error" : ""}`}
            />
          </div>
          {emailError && <p className="hk-field-error">{emailError}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-password" className="hk-label">Password</label>
          <div className="relative">
            <KeyRound size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (e.target.value) validatePassword(e.target.value);
              }}
              onBlur={() => validatePassword(password)}
              disabled={isSubmitting}
              className={`hk-input pl-10 pr-11 ${passwordError ? "hk-input-error" : ""}`}
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
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {passwordRules.map((r) => (
              <li
                key={r.text}
                className={`hk-chip transition-colors ${
                  r.ok ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-gray-100 text-gray-500"
                }`}
              >
                <Check size={11} strokeWidth={3} className={r.ok ? "opacity-100" : "opacity-30"} />
                {r.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Register Button */}
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="hk-btn hk-btn-primary hk-btn-lg w-full"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle size={18} className="animate-spin" /> Creating account…
            </>
          ) : (
            <>
              Create account <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
