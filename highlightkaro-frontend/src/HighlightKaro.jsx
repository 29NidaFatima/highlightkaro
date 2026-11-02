import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Sun,
  Moon,
  Upload,
  Crop,
  Palette,
  Download,
  Play,
  Lock,
  LogOut,
  Crown,
  Sparkles,
  ImagePlus,
  Layers,
  Timer,
  Gauge,
  Undo2,
  Trash2,
  MousePointer2,
  Check,
  LoaderCircle,
} from "lucide-react";
import Logo from "./components/Logo";
import { useAuth } from "./context/AuthContext";
import { PLAN_CONFIG, ALL_COLORS, ALL_ANIMATIONS } from "./config/planConfig";
import { API_BASE_URL } from "./config/api";
import { useNavigate } from "react-router-dom";
import { saveExportState, getExportState, clearExportState } from "./utils/exportState";
import { createPaymentLink } from "./api/paymentApi";
import { fetchPricing } from "./api/pricingApi";
import { renderVideo } from "./api/renderApi";
import { getHighlightFrame } from "./utils/highlightAnimation";
import { PLAN_CODES } from "./config/pricingConfig";
import { showToast } from "./utils/toast";


const HighlightKaro = () => {

  const [darkMode, setDarkMode] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 3}s`,
        duration: `${2 + Math.random() * 3}s`,
        opacity: 0.3 + Math.random() * 0.6,
      })),
    []
  );
  const [image, setImage] = useState(null);
  const [pricingData, setPricingData] = useState(null);
  const [recommendedRegion, setRecommendedRegion] = useState("global");
  const [, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Fetch recommended region on mount
  useEffect(() => {
    fetchPricing().then((data) => {
      setPricingData(data);
      if (data?.recommendedRegion) {
        setRecommendedRegion(data.recommendedRegion);
      }
    }).catch(() => {
      // Ignore errors, default to global
    });
  }, []);

  const handleUpgrade = async (plan) => {
    try {
      // Step 1: Call createPaymentLink with plan, region, and token
      const data = await createPaymentLink(plan, recommendedRegion, token);
      
      // Step 2: Redirect to intermediate page (like Upgrade page does)
      const currentPricing = pricingData?.pricing?.[recommendedRegion] || pricingData?.pricing?.global;
      const planKey = plan === "basic30" ? 'basic' : 'pro'; // using hardcoded mapping based on plan codes
      // Better to use PLAN_CODES if available or just infer
      
      // We need amount/currency for the loading screen
      let amount = 0;
      let currency = "USD";
      let billingCycle = "/ month";
      
      if (currentPricing) {
        amount = currentPricing[planKey]?.monthly || 0;
        currency = currentPricing.currency;
        billingCycle = currentPricing.cadenceLabel;
      }

      navigate("/payment-redirect", {
        state: {
          paymentLink: data.paymentLinkUrl,
          plan: plan === "basic30" ? 'Basic' : 'Pro',
          amount: amount,
          currency: currency,
          billingCycle: billingCycle
        }
      });

    } catch (err) {
      showToast(err.message || "Payment initiation failed", "error");
    }
  };


  const [croppedImage, setCroppedImage] = useState(null);
  const [cropMode, setCropMode] = useState(false);
  const [cropRatio, setCropRatio] = useState("free");
  const [cropRect, setCropRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const [highlights, setHighlights] = useState([]);
  const [currentHighlight, setCurrentHighlight] = useState(null);
  const [highlightColor, setHighlightColor] = useState("#ffff00");
  const [highlightOpacity, setHighlightOpacity] = useState(0.5);
  const [animationType, setAnimationType] = useState("left-to-right");
  const [animationDuration, setAnimationDuration] = useState(2);
  const [fps, setFps] = useState(30);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationTime, setAnimationTime] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [tapStart, setTapStart] = useState(null);
  const { user, token, logout } = useAuth();

  const navigate = useNavigate();

  const plan = user?.plan || "free";
  const planConfig = PLAN_CONFIG[plan] || PLAN_CONFIG.free;


  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const isDraggingCrop = useRef(false);
  const isDragging = useRef(false);
  const cropOffset = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    drawCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    image,
    croppedImage,
    highlights,
    cropMode,
    cropRect,
    isAnimating,
    animationTime,
    highlightColor,
    highlightOpacity,
  ]);

  useEffect(() => {
    if (!planConfig.darkMode && darkMode) {
      setDarkMode(false);
    }
  }, [plan, darkMode]);

  useEffect(() => {
    let animationFrame;
    if (isAnimating) {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed < animationDuration) {
          setAnimationTime(elapsed);
          animationFrame = requestAnimationFrame(animate);
        } else {
          setAnimationTime(0);
          setIsAnimating(false);
        }
      };
      animationFrame = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isAnimating, animationDuration]);

  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / (croppedImage || image).width;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setImageDimensions({ width: img.width, height: img.height });
          setCroppedImage(null);
          setHighlights([]);
          setCropRect({
            x: 0,
            y: 0,
            width: img.width,
            height: img.height,
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const applyCrop = () => {
    if (!image) return;
    const canvas = document.createElement("canvas");
    canvas.width = cropRect.width;
    canvas.height = cropRect.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      image,
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
      0,
      0,
      cropRect.width,
      cropRect.height
    );
    const croppedImg = new Image();
    croppedImg.onload = () => {
      setCroppedImage(croppedImg);
      setImageDimensions({
        width: cropRect.width,
        height: cropRect.height,
      });
      setCropMode(false);
      setHighlights([]);
    };
    croppedImg.src = canvas.toDataURL();
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const displayImg = croppedImage || image;
    if (!displayImg) {
      canvas.width = 800;
      canvas.height = 600;
      ctx.fillStyle = darkMode ? "#1a1a1a" : "#ecfeff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = darkMode ? "#666" : "#999";
      ctx.font = "500 18px Geist, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "Upload an image to start",
        canvas.width / 2,
        canvas.height / 2
      );
      return;
    }

    const maxWidth = window.innerWidth > 768 ? 800 : window.innerWidth - 40;
    const maxHeight = window.innerHeight - 200;
    const scale = Math.min(
      maxWidth / displayImg.width,
      maxHeight / displayImg.height,
      1
    );

    canvas.width = displayImg.width * scale;
    canvas.height = displayImg.height * scale;

    ctx.drawImage(displayImg, 0, 0, canvas.width, canvas.height);
    // 🔐 WATERMARK — FREE PLAN ONLY
    if (planConfig.watermark) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.font = "600 20px Geist, system-ui, sans-serif";
      ctx.fillStyle = "#000";
      ctx.textAlign = "right";
      ctx.fillText(
        "HighlightKaro",
        canvas.width - 16,
        canvas.height - 16
      );
      ctx.restore();
    }

    if (cropMode) {
      const sx = cropRect.x * scale;
      const sy = cropRect.y * scale;
      const sw = cropRect.width * scale;
      const sh = cropRect.height * scale;

      // Dim entire canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Use composite operation to "cut out" transparent crop area
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillRect(sx, sy, sw, sh);

      // Reset composite mode
      ctx.globalCompositeOperation = "source-over";

      // Draw white crop border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, sw, sh);
    }



    highlights.forEach((hl) => {
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = hl.color;
      ctx.globalAlpha = hl.opacity;

      // Same maths as the exported video; when not playing, show the final frame
      const t = isAnimating ? animationTime / animationDuration : 1;
      const frame = getHighlightFrame(
        hl.animation || "left-to-right",
        t,
        { x: hl.x * scale, y: hl.y * scale, width: hl.width * scale, height: hl.height * scale },
        hl.opacity
      );
      ctx.globalAlpha = frame.opacity;
      ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    });

    if (currentHighlight) {
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = highlightColor;
      ctx.globalAlpha = highlightOpacity;
      ctx.fillRect(
        currentHighlight.x * scale,
        currentHighlight.y * scale,
        currentHighlight.width * scale,
        currentHighlight.height * scale
      );
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }
  };

  const handleCanvasSelect = (e) => {
    if (!image || cropMode) return;

    // Prevent conflict with drag highlight on desktop
    if (!e.touches && isDragging.current) return;

    const point = getCanvasPoint(e);

    if (!tapStart) {
      setTapStart(point);
    } else {
      const rect = {
        x: Math.min(tapStart.x, point.x),
        y: Math.min(tapStart.y, point.y),
        width: Math.abs(point.x - tapStart.x),
        height: Math.abs(point.y - tapStart.y),
      };

      if (rect.width > 10 && rect.height > 10) {
        setHighlights((prev) => [
          ...prev,
          {
            ...rect,
            color: highlightColor,
            opacity: highlightOpacity,
            animation: animationType,
          },
        ]);
      }

      setTapStart(null);
    }
  };


  const handleCanvasMouseDown = (e) => {
    if (!image || cropMode) {
      if (cropMode) handleCropMouseDown(e);
      return;
    }


    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / (croppedImage || image).width;

    isDragging.current = true;
    dragStart.current = {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / (croppedImage || image).width;

    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    if (cropMode && isDraggingCrop.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scale = canvas.width / image.width;

      const mouseX = (e.clientX - rect.left) / scale;
      const mouseY = (e.clientY - rect.top) / scale;

      setCropRect((prev) => ({
        ...prev,
        x: mouseX - cropOffset.current.x,
        y: mouseY - cropOffset.current.y,
      }));

      return;
    }


    if (!isDragging.current || cropMode) return;

    setCurrentHighlight({
      x: Math.min(dragStart.current.x, mouseX),
      y: Math.min(dragStart.current.y, mouseY),
      width: Math.abs(mouseX - dragStart.current.x),
      height: Math.abs(mouseY - dragStart.current.y),
    });
  };


  const handleCanvasMouseUp = () => {
    if (cropMode) {
      isDraggingCrop.current = false;
    }

    if (isDragging.current && currentHighlight && !cropMode) {
      if (currentHighlight.width > 10 && currentHighlight.height > 10) {
        setHighlights([
          ...highlights,
          {
            ...currentHighlight,
            color: highlightColor,
            opacity: highlightOpacity,
            animation: animationType,
          },
        ]);
      }
      setCurrentHighlight(null);
    }
    isDragging.current = false;
  };
  const handleCropMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / image.width;

    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    // Check if inside crop area
    if (
      mouseX >= cropRect.x &&
      mouseX <= cropRect.x + cropRect.width &&
      mouseY >= cropRect.y &&
      mouseY <= cropRect.y + cropRect.height
    ) {
      isDraggingCrop.current = true;
      cropOffset.current = {
        x: mouseX - cropRect.x,
        y: mouseY - cropRect.y,
      };
    }
  };


  const startCrop = () => {
    setCropMode(true);
    if (image) {
      setCropRect({ x: 0, y: 0, width: image.width, height: image.height });
    }
  };

  const handleUndo = () => {
    setHighlights((prev) => prev.slice(0, -1));
  };


  // Perform actual export (called after login if needed)
  const performExport = async (imageDataUrl, highlightsData, settings) => {
    setExporting(true);

    try {
      // Convert data URL to File
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], "image.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("image", file);
      formData.append(
        "highlights",
        JSON.stringify(
          highlightsData.map((hl) => ({
            x: hl.x,
            y: hl.y,
            width: hl.width,
            height: hl.height,
            color: hl.color,
            opacity: hl.opacity,
            animation: hl.animation || "left-to-right",
          }))
        )
      );
      formData.append("duration", settings.duration);
      formData.append("fps", settings.fps);

      const videoBlob = await renderVideo(token, formData);
      const url = URL.createObjectURL(videoBlob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "highlight.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      // Clear pending export state
      clearExportState();
    } catch (err) {
      // Show user-friendly error message
      const errorMessage = err.message.includes("limit reached")
        ? err.message
        : `Export failed: ${err.message}`;
      showToast(errorMessage, "error");
      // throw err; // Don't rethrow, just alert
    } finally {
      setExporting(false);
    }
  };

  // Handle export button click
  const handleExport = async () => {
    if (!highlights.length) {
      showToast("Please add at least one highlight area", "info");
      return;
    }

    // Check if user is logged in
    if (!user || !token) {
      // Save export state and redirect to login
      const displayImg = croppedImage || image;

      // Convert image to data URL for storage
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = displayImg.width;
      tempCanvas.height = displayImg.height;
      const ctx = tempCanvas.getContext("2d");
      ctx.drawImage(displayImg, 0, 0);
      const imageDataUrl = tempCanvas.toDataURL("image/png");

      // Save export state
      saveExportState({
        imageDataUrl,
        highlights,
        settings: {
          duration: animationDuration,
          fps,
        },
      });

      // Redirect to login with return path
      navigate("/login?return=export");
      return;
    }

    // User is logged in, proceed with export
    const displayImg = croppedImage || image;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = displayImg.width;
    tempCanvas.height = displayImg.height;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(displayImg, 0, 0);
    const imageDataUrl = tempCanvas.toDataURL("image/png");

    await performExport(imageDataUrl, highlights, {
      duration: animationDuration,
      fps,
    });
  };

  // Restore export state after login (but DO NOT auto-export)
  useEffect(() => {
    if (user && token) {
      const pendingExport = getExportState();
      if (pendingExport) {
        // Restore editor state from saved export data
        try {
          // Restore image
          if (pendingExport.imageDataUrl) {
            const img = new Image();
            img.onload = () => {
              setImage(img);
              setImageDimensions({ width: img.width, height: img.height });
            };
            img.src = pendingExport.imageDataUrl;
          }

          // Restore highlights
          if (pendingExport.highlights) {
            setHighlights(pendingExport.highlights);
          }

          // Restore settings
          if (pendingExport.settings) {
            if (pendingExport.settings.duration) {
              setAnimationDuration(pendingExport.settings.duration);
            }
            if (pendingExport.settings.fps) {
              setFps(pendingExport.settings.fps);
            }
          }

          // Clear pending export state (prevent auto-export)
          clearExportState();

          // Show user-friendly message
          showToast("You're logged in. Click Export to continue.", "info");
        } catch (err) {
          console.error("Failed to restore export state:", err);
          clearExportState(); // Clear on error
        }
      }
    }
  }, [user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const ANIMATION_LABELS = {
    "left-to-right": "Left → Right",
    "down-up": "Down → Up",
    rise: "Rise",
    glow: "Glow pulse",
    underline: "Underline",
  };

  const PLAN_LABELS = { free: "Free", basic30: "Basic", pro99: "Pro" };

  // Lowest plan that unlocks a colour / animation, for the lock badges
  const unlockPlanFor = (kind, value) =>
    ["free", "basic30", "pro99"].find((p) => PLAN_CONFIG[p][kind].includes(value));

  const promptUpgrade = (feature, planKey) => {
    showToast(`${feature} is available on the ${PLAN_LABELS[planKey]} plan`, "info");
    if (user) navigate("/upgrade");
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleDrop = (e) => {
    e.preventDefault();
    setDropActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload({ target: { files: [file] } });
    } else if (file) {
      showToast("Please drop an image file (PNG, JPG or WebP)", "error");
    }
  };

  const displayImg = croppedImage || image;

  return (
    <div className={`hk-page transition-colors duration-500 ${darkMode ? "dark" : ""}`}>
      {/* Dark mode sky */}
      {darkMode && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute right-[12%] top-24 h-24 w-24 rounded-full bg-gradient-to-br from-yellow-200 to-amber-400 opacity-80 shadow-[0_0_80px_20px_rgba(250,204,21,0.25)]" />
          {stars.map((s, i) => (
            <span
              key={i}
              className="absolute h-[3px] w-[3px] animate-pulse rounded-full bg-yellow-200"
              style={{ left: s.left, top: s.top, animationDelay: s.delay, animationDuration: s.duration, opacity: s.opacity }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-xl ${
          darkMode ? "border-yellow-500/10 bg-black/60" : "border-white/60 bg-white/60"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Logo dark={darkMode} showTagline onClick={() => navigate("/")} />

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Legendary Dark Mode Toggle */}
            <button
              onClick={() =>
                planConfig.darkMode ? setDarkMode(!darkMode) : promptUpgrade("Legendary Dark Mode", "basic30")
              }
              aria-label="Legendary Dark Mode"
              title={planConfig.darkMode ? "Legendary Dark Mode" : "Legendary Dark Mode · unlock with Basic"}
              className={`relative grid h-10 w-10 place-items-center rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                darkMode
                  ? "bg-yellow-400 text-gray-950 shadow-[0_8px_24px_-8px_rgba(250,204,21,0.7)]"
                  : "bg-white text-cyan-700 ring-1 ring-cyan-100 shadow-sm hover:bg-cyan-50"
              }`}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              {!planConfig.darkMode && (
                <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-gray-900 text-white">
                  <Lock size={9} strokeWidth={3} />
                </span>
              )}
            </button>

            {user ? (
              <>
                {/* Plan capsule */}
                <div
                  className={`hidden items-center gap-3 rounded-2xl py-1.5 pl-3 pr-1.5 sm:flex ${
                    darkMode ? "bg-white/5 ring-1 ring-yellow-500/15" : "bg-white/80 ring-1 ring-cyan-100 shadow-sm"
                  }`}
                >
                  <div className="leading-tight">
                    <span
                      className={`flex items-center gap-1 text-[13px] font-semibold ${
                        darkMode ? "text-yellow-400" : "text-cyan-700"
                      }`}
                    >
                      {user.plan !== "free" && <Crown size={13} />}
                      {PLAN_CONFIG[user.plan]?.name || user.plan} plan
                    </span>
                    <span className={`block text-[11px] ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                      {user.planExpiresAt
                        ? `until ${new Date(user.planExpiresAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`
                        : user.name?.split(" ")[0] || ""}
                    </span>
                  </div>

                  {user.plan === "free" && (
                    <button onClick={() => navigate("/upgrade")} className="hk-btn hk-btn-primary px-3 py-1.5 text-xs">
                      <Sparkles size={13} /> Upgrade
                    </button>
                  )}
                  {user.plan === "basic30" && (
                    <button onClick={() => handleUpgrade("pro99")} className="hk-btn hk-btn-premium px-3 py-1.5 text-xs">
                      <Crown size={13} /> Go Pro
                    </button>
                  )}
                  {user.plan === "pro99" && <span className="w-1.5" />}
                </div>

                {user.plan === "free" && (
                  <button
                    onClick={() => navigate("/upgrade")}
                    className="hk-btn hk-btn-primary h-10 w-10 px-0 sm:hidden"
                    aria-label="Upgrade plan"
                    title="Upgrade"
                  >
                    <Sparkles size={16} />
                  </button>
                )}

                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="hk-btn hk-btn-ghost h-10 px-3"
                  title="Log out"
                >
                  <LogOut size={17} />
                  <span className="hidden md:inline">Log out</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate("/login")} className="hk-btn hk-btn-ghost h-10">
                  Log in
                </button>
                <button onClick={() => navigate("/register")} className="hk-btn hk-btn-primary h-10">
                  Sign up free
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-4 px-3 py-4 sm:px-4 md:h-[calc(100vh-73px)] md:flex-row md:gap-5 md:py-5">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

        {/* Controls panel */}
        <aside className="hk-glass flex w-full flex-col overflow-hidden md:w-[340px] lg:w-[360px]">
          <div className="flex-1 space-y-6 overflow-y-auto p-5 max-h-[70vh] md:max-h-none">
            <button onClick={openFilePicker} className="hk-btn hk-btn-primary hk-btn-lg w-full">
              {image ? <ImagePlus size={18} /> : <Upload size={18} />}
              {image ? "Replace image" : "Upload image"}
            </button>

            {!image && (
              <ol className="space-y-3">
                {[
                  ["Upload", "a screenshot, note or article"],
                  ["Drag", "across the words you want to highlight"],
                  ["Preview & export", "as an MP4 video"],
                ].map(([strong, rest], i) => (
                  <li key={strong} className="flex items-start gap-3 text-sm">
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                        darkMode ? "bg-yellow-400/15 text-yellow-300" : "bg-cyan-100 text-cyan-700"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
                      <span className={`font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{strong}</span>{" "}
                      {rest}
                    </span>
                  </li>
                ))}
              </ol>
            )}

            {image && (
              <>
                {/* Crop tool */}
                <section className="space-y-2.5">
                  <p className="hk-eyebrow">
                    <Crop size={13} /> Crop
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={startCrop}
                      className={`hk-btn flex-1 ${cropMode ? "hk-btn-primary" : "hk-btn-soft"}`}
                    >
                      {cropMode ? "Cropping…" : "Start crop"}
                    </button>
                    {cropMode && (
                      <button onClick={applyCrop} className="hk-btn hk-btn-success flex-1">
                        <Check size={16} /> Apply
                      </button>
                    )}
                  </div>
                  {cropMode && (
                    <div className="hk-segment">
                      {[
                        ["free", "Free"],
                        ["16:9", "16:9"],
                        ["9:16", "9:16"],
                        ["1:1", "1:1"],
                        ["4:3", "4:3"],
                      ].map(([ratio, label]) => (
                        <button
                          key={ratio}
                          data-active={cropRatio === ratio}
                          className="hk-segment-item px-1"
                          onClick={() => {
                            setCropRatio(ratio);
                            if (ratio !== "free") {
                              const [w, h] = ratio.split(":").map(Number);
                              const imgAspect = image.width / image.height;
                              const targetAspect = w / h;
                              let newWidth, newHeight;
                              if (imgAspect > targetAspect) {
                                newHeight = image.height;
                                newWidth = newHeight * targetAspect;
                              } else {
                                newWidth = image.width;
                                newHeight = newWidth / targetAspect;
                              }
                              setCropRect({
                                x: (image.width - newWidth) / 2,
                                y: (image.height - newHeight) / 2,
                                width: newWidth,
                                height: newHeight,
                              });
                            }
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <div className="hk-divider" />

                {/* Highlight color */}
                <section className="space-y-2.5">
                  <p className="hk-eyebrow">
                    <Palette size={13} /> Colour
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {ALL_COLORS.map((color) => {
                      const allowed = planConfig.colors.includes(color);
                      const selected = highlightColor === color;
                      return (
                        <button
                          key={color}
                          onClick={() =>
                            allowed ? setHighlightColor(color) : promptUpgrade("This colour", unlockPlanFor("colors", color))
                          }
                          aria-label={`Colour ${color}${allowed ? "" : " (locked)"}`}
                          className={`relative h-9 w-9 rounded-full transition-all duration-200 hover:scale-110 ${
                            selected
                              ? darkMode
                                ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-900"
                                : "ring-2 ring-cyan-500 ring-offset-2"
                              : darkMode
                                ? "ring-1 ring-white/10"
                                : "ring-1 ring-black/10"
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {!allowed && (
                            <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-white">
                              <Lock size={13} strokeWidth={2.5} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Opacity */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="hk-eyebrow">
                      <Layers size={13} /> Opacity
                    </p>
                    <span className={`text-xs font-semibold tabular-nums ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {Math.round(highlightOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={highlightOpacity}
                    onChange={(e) => setHighlightOpacity(parseFloat(e.target.value))}
                  />
                </section>

                <div className="hk-divider" />

                {/* Animation type */}
                <section className="space-y-2.5">
                  <p className="hk-eyebrow">
                    <Sparkles size={13} /> Animation
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_ANIMATIONS.map((anim) => {
                      const allowed = planConfig.animations.includes(anim);
                      const active = animationType === anim;
                      return (
                        <button
                          key={anim}
                          onClick={() =>
                            allowed ? setAnimationType(anim) : promptUpgrade(ANIMATION_LABELS[anim], unlockPlanFor("animations", anim))
                          }
                          className={`flex items-center justify-between gap-1 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200 ${
                            active
                              ? darkMode
                                ? "bg-yellow-400 text-gray-950"
                                : "bg-cyan-500 text-white shadow-[0_8px_20px_-10px_rgba(6,182,212,0.9)]"
                              : darkMode
                                ? "bg-white/5 text-gray-300 hover:bg-white/10"
                                : "bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-cyan-300"
                          } ${allowed ? "" : "opacity-60"}`}
                        >
                          {ANIMATION_LABELS[anim]}
                          {!allowed && <Lock size={12} className="shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Duration */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="hk-eyebrow">
                      <Timer size={13} /> Duration
                    </p>
                    <span className={`text-xs font-semibold tabular-nums ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {animationDuration}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={animationDuration}
                    onChange={(e) => setAnimationDuration(parseFloat(e.target.value))}
                  />
                </section>

                {/* FPS */}
                <section className="space-y-2.5">
                  <p className="hk-eyebrow">
                    <Gauge size={13} /> Frame rate
                  </p>
                  <div className="hk-segment">
                    {[24, 30].map((v) => (
                      <button key={v} data-active={fps === v} onClick={() => setFps(v)} className="hk-segment-item">
                        {v} fps
                      </button>
                    ))}
                  </div>
                </section>

                {/* Highlights list */}
                <section className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="hk-eyebrow">
                      <MousePointer2 size={13} /> Highlights
                      <span
                        className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${
                          darkMode ? "bg-white/10 text-gray-300" : "bg-cyan-100 text-cyan-700"
                        }`}
                      >
                        {highlights.length}
                      </span>
                    </p>
                    <button
                      onClick={handleUndo}
                      disabled={highlights.length === 0}
                      className="hk-btn hk-btn-ghost px-2 py-1 text-xs"
                    >
                      <Undo2 size={14} /> Undo
                    </button>
                  </div>

                  {highlights.length === 0 ? (
                    <p
                      className={`rounded-xl border border-dashed px-3 py-4 text-center text-xs ${
                        darkMode ? "border-white/10 text-gray-500" : "border-cyan-200 text-gray-500"
                      }`}
                    >
                      Drag on the image to draw your first highlight
                    </p>
                  ) : (
                    <ul className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                      {highlights.map((hl, idx) => (
                        <li
                          key={idx}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                            darkMode ? "bg-white/5" : "bg-white ring-1 ring-gray-100"
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="h-4 w-4 rounded-md ring-1 ring-black/10" style={{ backgroundColor: hl.color }} />
                            <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                              {ANIMATION_LABELS[hl.animation] || hl.animation}
                            </span>
                          </span>
                          <button
                            onClick={() => setHighlights(highlights.filter((_, i) => i !== idx))}
                            className={`grid h-7 w-7 place-items-center rounded-lg transition ${
                              darkMode ? "text-gray-500 hover:bg-red-500/15 hover:text-red-400" : "text-gray-400 hover:bg-red-50 hover:text-red-600"
                            }`}
                            aria-label="Remove highlight"
                          >
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>

          {/* Sticky actions */}
          {image && (
            <div
              className={`space-y-2.5 border-t p-4 ${
                darkMode ? "border-yellow-500/10 bg-black/20" : "border-cyan-100/80 bg-white/40"
              }`}
            >
              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    setIsAnimating(true);
                    setAnimationTime(0);
                  }}
                  disabled={highlights.length === 0 || isAnimating}
                  className="hk-btn hk-btn-soft hk-btn-lg flex-1"
                >
                  <Play size={17} />
                  {isAnimating ? "Playing…" : "Preview"}
                </button>
                <button
                  onClick={handleExport}
                  disabled={highlights.length === 0 || exporting}
                  className={`hk-btn hk-btn-lg flex-[1.4] ${user ? "hk-btn-success" : "hk-btn-primary"}`}
                >
                  {exporting ? <LoaderCircle size={17} className="animate-spin" /> : <Download size={17} />}
                  {exporting ? "Exporting…" : user ? "Export MP4" : "Log in to export"}
                </button>
              </div>
              {user && planConfig.exportLimit && (
                <p className={`text-center text-[11px] ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                  {planConfig.exportLimit} free exports per day ·{" "}
                  <button onClick={() => navigate("/upgrade")} className="font-semibold text-cyan-600 hover:underline">
                    go unlimited
                  </button>
                </p>
              )}
            </div>
          )}
        </aside>

        {/* Canvas Area */}
        <section
          className={`hk-glass hk-grid relative flex min-h-[55vh] flex-1 items-center justify-center overflow-hidden p-4 sm:p-6 ${
            dropActive ? (darkMode ? "ring-2 ring-yellow-400" : "ring-2 ring-cyan-400") : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDropActive(true);
          }}
          onDragLeave={() => setDropActive(false)}
          onDrop={handleDrop}
        >
          {!displayImg && (
            <button
              onClick={openFilePicker}
              className={`group flex w-full max-w-lg flex-col items-center rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-all duration-300 ${
                darkMode
                  ? "border-yellow-500/25 hover:border-yellow-400/60 hover:bg-yellow-400/5"
                  : "border-cyan-300/70 hover:border-cyan-400 hover:bg-white/60"
              }`}
            >
              <span
                className={`mb-5 grid h-16 w-16 animate-float place-items-center rounded-2xl ${
                  darkMode
                    ? "bg-yellow-400/15 text-yellow-300"
                    : "bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-[0_14px_30px_-10px_rgba(6,182,212,0.8)]"
                }`}
              >
                <ImagePlus size={28} />
              </span>
              <span className={`font-display text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                Drop an image to start
              </span>
              <span className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                or <span className={`font-semibold ${darkMode ? "text-yellow-400" : "text-cyan-600"}`}>browse files</span> · PNG, JPG, WebP up to 15 MB
              </span>
            </button>
          )}

          <div className={displayImg ? "relative" : "hidden"}>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasSelect}
              onTouchStart={handleCanvasSelect}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className={`h-auto max-w-full cursor-crosshair rounded-2xl ${
                darkMode ? "shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]" : "shadow-[0_20px_60px_-24px_rgba(8,47,73,0.45)]"
              }`}
            />
          </div>

          {displayImg && (
            <span
              className={`hk-chip absolute bottom-4 left-1/2 -translate-x-1/2 backdrop-blur ${
                darkMode ? "bg-black/60 text-gray-300 ring-1 ring-white/10" : "bg-white/80 text-gray-600 ring-1 ring-cyan-100"
              }`}
            >
              {cropMode ? (
                <>
                  <Crop size={12} /> Drag the frame, then Apply
                </>
              ) : (
                <>
                  <MousePointer2 size={12} /> Drag across text to highlight
                </>
              )}
            </span>
          )}

          {dropActive && (
            <div
              className={`pointer-events-none absolute inset-0 grid place-items-center text-sm font-semibold ${
                darkMode ? "bg-black/60 text-yellow-300" : "bg-cyan-50/80 text-cyan-700"
              }`}
            >
              Drop to upload
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
export default HighlightKaro;
