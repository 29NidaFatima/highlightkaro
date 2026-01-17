import React, { useState, useRef, useEffect } from "react";
import {
  Sun,
  Moon,
  Upload,
  Crop,
  Square,
  Palette,
  Download,
  Play,
} from "lucide-react";
import PlanGuard from "./components/PlanGuard";
import { useAuth } from "./context/AuthContext";
import { PLAN_CONFIG } from "./config/planConfig";
import { useNavigate } from "react-router-dom";
import { saveExportState, getExportState, clearExportState } from "./utils/exportState";
import { createPaymentLink } from "./api/paymentApi";


const HighlightKaro = () => {

  const [darkMode, setDarkMode] = useState(false);
  const [image, setImage] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

const handleUpgrade = async (plan) => {
  try {
    const data = await createPaymentLink(plan, token);
    window.location.href = data.paymentLinkUrl; // Redirect to Razorpay
  } catch (err) {
    alert(err.message);
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
const planConfig = PLAN_CONFIG[plan];


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
      ctx.font = "20px Arial";
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
  ctx.font = "24px Arial";
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

      const drawX = hl.x * scale;
      let drawWidth = hl.width * scale;

      if (isAnimating && hl.animation === "left-to-right") {
        const progress = animationTime / animationDuration;
        drawWidth = hl.width * scale * progress;
      } else if (isAnimating && hl.animation === "pulse") {
        const progress = animationTime / animationDuration;
        const pulse = Math.sin(progress * Math.PI * 4) * 0.3 + 0.7;
        ctx.globalAlpha = hl.opacity * pulse;
      }

      ctx.fillRect(drawX, hl.y * scale, drawWidth, hl.height * scale);
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
    console.log("DOWN");

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
    console.log("MOVE");

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
    console.log("UP");

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

      const hl = highlightsData[0];

      const formData = new FormData();
      formData.append("image", file);
      formData.append("x", hl.x);
      formData.append("y", hl.y);
      formData.append("w", hl.width);
      formData.append("h", hl.height);
      formData.append("color", hl.color);
      formData.append("opacity", hl.opacity * 100);
      formData.append("duration", settings.duration);
      formData.append("fps", settings.fps);
      formData.append("anim", hl.animation || "left-to-right");

      const res = await fetch("http://localhost:5000/render", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.error || "Export failed";
        
        // Handle export limit error specifically
        if (res.status === 403 && errorData.limit) {
          throw new Error(
            `Daily export limit reached (${errorData.limit} exports). Upgrade to Basic plan for unlimited exports.`
          );
        }
        
        throw new Error(errorMsg);
      }

      const videoBlob = await res.blob();
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
      alert(errorMessage);
      throw err;
    } finally {
      setExporting(false);
    }
  };

  // Handle export button click
  const handleExport = async () => {
    if (!highlights.length) {
      alert("Please add at least one highlight area");
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
          alert("You're logged in. Click Export to continue.");
        } catch (err) {
          console.error("Failed to restore export state:", err);
          clearExportState(); // Clear on error
        }
      }
    }
  }, [user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${darkMode
        ? "dark bg-black"
        : "bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-50"
        }`}
    >
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {!darkMode ? (
          <>
            <div className="absolute bottom-0 left-0 w-64 h-64 opacity-20">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path
                  d="M50,10 L50,40 M45,15 L50,10 L55,15"
                  stroke="#8b4513"
                  fill="none"
                  strokeWidth="2"
                />
                <ellipse cx="50" cy="45" rx="20" ry="15" fill="#90EE90" />
              </svg>
            </div>
            <div className="absolute top-20 right-20 opacity-30">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-bounce"
                  style={{
                    left: `${i * 40}px`,
                    top: `${Math.sin(i) * 30}px`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: "3s",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20">
                    <path
                      d="M10,2 L12,8 L18,8 L13,12 L15,18 L10,14 L5,18 L7,12 L2,8 L8,8 Z"
                      fill="#06b6d4"
                    />
                  </svg>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="absolute top-10 right-32 w-24 h-24">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-200 to-yellow-400 shadow-2xl shadow-yellow-400/50 animate-pulse" />
            </div>
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              >
                <div className="w-1 h-1 bg-yellow-300 rounded-full shadow-lg shadow-yellow-300/50" />
              </div>
            ))}
          </>
        )}

        {/* Phoenix watermark */}
        <div
          className={`absolute bottom-4 right-4 opacity-10 ${darkMode ? "text-yellow-500" : "text-cyan-800"
            }`}
        >
          <svg width="60" height="60" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50,10 C50,10 30,20 30,40 C30,50 35,55 40,58 C35,62 32,68 35,75 C40,85 55,88 60,80 C62,77 62,73 60,70 C70,68 75,60 73,50 C72,45 68,42 65,40 C70,35 70,25 50,10 Z" />
            <circle cx="45" cy="35" r="3" />
          </svg>
        </div>
      </div>

      {/* Header */}
{/* Header */}
<div
  className={`relative z-10 border-b ${
      darkMode
        ? "bg-gray-900 border-yellow-500/20"
        : "bg-white/80 border-cyan-200"
  } backdrop-blur-sm`}
>
  <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
    
    {/* Left: Logo & Tagline */}
    <div>
      <h1
        className={`text-3xl font-bold ${
          darkMode ? "text-yellow-400" : "text-cyan-600"
        }`}
      >
        HighlightKaro
      </h1>
      <p
        className={`text-sm ${
          darkMode ? "text-gray-400" : "text-gray-600"
        }`}
      >
        Create CapCut-style highlight animations in seconds
      </p>
    </div>

    {/* Right: Dark Mode + Logout */}
    <div className="flex items-center gap-3">
      
      {/* Dark mode toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        disabled={!planConfig.darkMode}
        className={`p-3 rounded-full transition-all ${
          darkMode
            ? "bg-yellow-500 text-black hover:bg-yellow-400"
            : "bg-cyan-500 text-white hover:bg-cyan-600"
        } ${
          !planConfig.darkMode && "opacity-50 cursor-not-allowed"
        }`}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
{/* Plan badge + Upgrade */}
{user && (
  <div className="flex items-center gap-2 mr-2">
    <span
      className={`text-xs px-3 py-1 rounded-full font-semibold ${
        darkMode
          ? "bg-gray-800 text-yellow-400"
          : "bg-cyan-100 text-cyan-700"
      }`}
    >
      {user.plan.toUpperCase()}
    </span>

    {user.plan === "free" && (
    <button
  onClick={() => navigate("/upgrade")}
  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm"
>
  Upgrade
</button>

    )}

    {user.plan === "basic19" && (
      <button
        onClick={() => handleUpgrade("pro99")}
        className="px-3 py-1 text-xs rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold"
      >
        Go Pro ₹99
      </button>
    )}
  </div>
)}

      {/* Logout */}
      {user && (
<button
  onClick={() => {
    logout();
    navigate("/");
  }}
  className={`px-5 py-2 text-sm rounded-lg font-medium transition-all
    ${darkMode
      ? "bg-yellow-500 text-black hover:bg-yellow-400"
      : "bg-cyan-500 text-white hover:bg-cyan-600"}
  `}
>
  Logout
</button>

      )}
    </div>
  </div>
</div>


      {/* Main layout */}
      <div className="relative z-10 max-w-7xl mx-auto px-2 py-4 flex flex-col gap-4 md:flex-row md:gap-6 md:h-[calc(100vh-140px)]">

        {/* Controls panel */}
        <div
          className={`w-full md:w-80 lg:w-96 rounded-xl border p-4 max-h-[70vh] md:max-h-full overflow-y-auto  ${darkMode
            ? "bg-gray-900 border-yellow-500/20"
            : "bg-white/90 border-cyan-200"
            } backdrop-blur-sm`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current.click()}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${darkMode
              ? "bg-yellow-500 text-black hover:bg-yellow-400"
              : "bg-cyan-500 text-white hover:bg-cyan-600"
              }`}
          >
            <Upload size={20} />
            Upload Image
          </button>

          {image && (
            <>
              <div className="mt-6 space-y-4">
                {/* Crop tool */}
                <div>
                  <label
                    className={`block text-sm font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                  >
                    <Crop size={16} className="inline mr-2" />
                    Crop Tool
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={startCrop}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${cropMode
                        ? darkMode
                          ? "bg-yellow-500 text-black"
                          : "bg-cyan-500 text-white"
                        : darkMode
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                      {cropMode ? "Cropping..." : "Start Crop"}
                    </button>
                    {cropMode && (
                      <button
                        onClick={applyCrop}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${darkMode
                          ? "bg-green-600 hover:bg-green-500"
                          : "bg-green-500 hover:bg-green-600"
                          } text-white`}
                      >
                        Apply
                      </button>
                    )}
                  </div>
                  {cropMode && (
                    <select
                      value={cropRatio}
                      onChange={(e) => {
                        setCropRatio(e.target.value);
                        const ratio = e.target.value;
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
                      className={`w-full p-2 rounded-lg text-sm border ${darkMode
                        ? "bg-gray-800 text-gray-300 border-gray-700"
                        : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                    >
                      <option value="free">Freeform</option>
                      <option value="16:9">16:9</option>
                      <option value="9:16">9:16</option>
                      <option value="1:1">1:1</option>
                      <option value="4:3">4:3</option>
                    </select>
                  )}
                </div>



                {/* Highlight color */}

<div>
  <label className={`block text-sm font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
    <Palette size={16} className="inline mr-2" />
    Highlight Color
  </label>

  <div className="flex gap-2">
    {planConfig.colors === "ALL"
      ? ["#ffff00", "#ff0000", "#00ffff", "#00ff00"].map((color) => (
          <button
            key={color}
            onClick={() => setHighlightColor(color)}
            style={{ backgroundColor: color }}
            className="w-8 h-8 rounded border"
          />
        ))
      : planConfig.colors.map((color) => (
          <button
            key={color}
            onClick={() => setHighlightColor(color)}
            style={{ backgroundColor: color }}
            className="w-8 h-8 rounded border"
          />
        ))}
  </div>
</div>


                {/* Opacity */}
                <div>
                  <label
                    className={`block text-sm font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                  >
                    Opacity: {Math.round(highlightOpacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={highlightOpacity}
                    onChange={(e) =>
                      setHighlightOpacity(parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                </div>

                {/* Undo Button */}
                <button
                  onClick={handleUndo}
                  disabled={highlights.length === 0}
                  className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all
                    ${highlights.length === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : darkMode
                        ? "bg-yellow-500 text-black hover:bg-yellow-400"
                        : "bg-cyan-500 text-white hover:bg-cyan-600"
                    }
  `             }
                >
                  Undo Highlight
                </button>


                {/* Animation type */}
                <div>
                  <label
                    className={`block text-sm font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                  >
                    Animation Type
                  </label>
<select
  value={animationType}
  onChange={(e) => setAnimationType(e.target.value)}
  className={`w-full p-2 rounded-lg text-sm border ${darkMode
    ? "bg-gray-800 text-gray-300 border-gray-700"
    : "bg-gray-100 text-gray-700 border-gray-300"
  }`}
>
  {planConfig.animations === "ALL" ? (
    <>
      <option value="left-to-right">Left → Right</option>
      <option value="down-up">Down → Up</option>
      <option value="rise">Rise</option>
      <option value="glow">Glow Swipe</option>
      <option value="underline">Underline</option>
    </>
  ) : (
    planConfig.animations.map((anim) => (
      <option key={anim} value={anim}>
        {anim}
      </option>
    ))
  )}
</select>

                </div>

                {/* Duration */}
                <div>
                  <label
                    className={`block text-sm font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                  >
                    Duration: {animationDuration}s
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={animationDuration}
                    onChange={(e) =>
                      setAnimationDuration(parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                </div>

                {/* FPS */}
                <div>
                  <label
                    className={`block text-sm font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                  >
                    FPS
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFps(24)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${fps === 24
                        ? darkMode
                          ? "bg-yellow-500 text-black"
                          : "bg-cyan-500 text-white"
                        : darkMode
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                      24
                    </button>
                    <button
                      onClick={() => setFps(30)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${fps === 30
                        ? darkMode
                          ? "bg-yellow-500 text-black"
                          : "bg-cyan-500 text-white"
                        : darkMode
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                      30
                    </button>
                  </div>
                </div>

                {/* Highlights list */}
                {highlights.length > 0 && (
                  <div>
                    <label
                      className={`block text-sm font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                    >
                      Highlights ({highlights.length})
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {highlights.map((hl, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg flex items-center justify-between text-sm ${darkMode ? "bg-gray-800" : "bg-gray-100"
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: hl.color }}
                            />
                            <span
                              className={
                                darkMode ? "text-gray-300" : "text-gray-700"
                              }
                            >
                              {hl.animation}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              setHighlights(
                                highlights.filter((_, i) => i !== idx)
                              )
                            }
                            className={`text-xs px-2 py-1 rounded ${darkMode
                              ? "bg-red-600 hover:bg-red-500"
                              : "bg-red-500 hover:bg-red-600"
                              } text-white`}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview button */}
                <button
                  onClick={() => {
                    setIsAnimating(true);
                    setAnimationTime(0);
                  }}
                  disabled={highlights.length === 0}
                  className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${highlights.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : darkMode
                      ? "bg-blue-600 hover:bg-blue-500 text-white"
                      : "bg-cyan-500 hover:bg-cyan-600 text-white"
                    }`}
                >
                  <Play size={20} />
                  Preview Animation
                </button>


                {/* Export button */}
                <button
                  onClick={handleExport}
                  disabled={highlights.length === 0 || exporting}
                  className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${highlights.length === 0 || exporting
                      ? "bg-gray-400 cursor-not-allowed"
                      : !user
                        ? darkMode
                          ? "bg-cyan-600 hover:bg-cyan-500 text-white"
                          : "bg-cyan-500 hover:bg-cyan-600 text-white"
                        : darkMode
                          ? "bg-green-600 hover:bg-green-500 text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                >
                  <Download size={20} />
                  {exporting ? "Exporting..." : user ? "Export Video" : "Login to Export"}
                </button>
                
                {/* Export limit info for free plan */}
                {user && planConfig.exportLimit && (
                  <p className="text-xs text-center text-gray-500 mt-2">
                    {planConfig.exportLimit} exports per day on Free plan
                  </p>
                )}

              </div>
            </>
          )}
        </div>

        {/* Canvas Area */}
        <div className="w-full flex items-center justify-center">

          <div
            className={`border rounded-xl p-4 backdrop-blur-sm ${darkMode
              ? "bg-gray-900 border-yellow-500/20"
              : "bg-white/90 border-cyan-200"
              }`}
          >
            <canvas
              ref={canvasRef}

              onClick={handleCanvasSelect}
              onTouchStart={handleCanvasSelect}

              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}

              className="rounded-lg max-w-full h-auto cursor-crosshair"
            />

          </div>
        </div>
      </div>
    </div>
  );
};
export default HighlightKaro;
