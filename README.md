# 🎨 HighlightKaro  
### **Create CapCut-style highlight animations directly in the browser, exported as smooth MP4 videos.**

---

## 🏷️ Badges  
![Node](https://img.shields.io/badge/Node-18+-green)   
![Stars](https://img.shields.io/github/stars/29NidaFatima/highlightkaro?style=social)  
![Issues](https://img.shields.io/github/issues/29NidaFatima/highlightkaro)  


---

## 📘 Overview  
**HighlightKaro** lets users upload an image, draw highlight regions, preview CapCut-style animations, and export them as high-quality MP4 videos , all **inside the browser**.  
A **React + Vite** frontend handles drawing, previewing, and UI;
a **Node.js + Express** backend powers MP4 rendering using **FFmpeg** pipelines.

Perfect for creators, editors, educators, or anyone who needs clean animated highlight effects quickly.

---

## ✨ Key Features  
- 🖼️ Upload & crop images  
- ✏️ Freeform highlight/selection drawing  
- 🎨 Choose highlight **color** & **opacity**  
- 🎞️ Five animations: **Left → Right**, **Down → Up**, **Rise**, **Glow** & **Underline** (preview matches the export)  
- 🖍️ Multiple highlights per video  
- 💳 Razorpay plans (Basic / Pro, 30 days, renewable) with webhook + redirect confirmation  
- ⚡ Real-time canvas animation preview  
- 🎥 MP4 export via backend FFmpeg  
- 🌗 Light/Dark mode  
- 📱 Fully responsive interface  
- 🔧 Easy-to-integrate backend API

---

## 🧠 Tech Stack  

| Layer | Technologies |
|------|--------------|
| **Frontend** | React, Vite, TailwindCSS, Canvas |
| **Backend** | Node.js, Express, Multer, FFmpeg |
| **Tools** | NPM, PostCSS, Git, JSON APIs |

## 📁 Folder Structure
```

 highlightkaro/
    ├── README.md
    ├── highlightkaro-backend/
    │   ├── app.js
    │   ├── DESIGN_CLOUD_SAVE.md
    │   ├── package.json
    │   ├── RAZORPAY_TESTING_GUIDE.md
    │   ├── config/
    │   │   ├── db.js
    │   │   ├── planConfig.js
    │   │   └── pricingConfig.js
    │   ├── controllers/
    │   │   ├── authController.js
    │   │   ├── paymentController.js
    │   │   ├── pricingController.js
    │   │   └── renderController.js
    │   ├── middleware/
    │   │   ├── auth.middleware.js
    │   │   ├── plan.middleware.js
    │   │   └── validation.middleware.js
    │   ├── models/
    │   │   ├── ExportLog.js
    │   │   ├── Payment.js
    │   │   └── User.js
    │   ├── routes/
    │   │   ├── auth.routes.js
    │   │   ├── payment.routes.js
    │   │   ├── pricing.routes.js
    │   │   └── render.routes.js
    │   ├── services/
    │   │   └── pricing.service.js
    │   └── utils/
    │       ├── jwt.js
    │       ├── planFeatures.js
    │       ├── pricingRegion.js
    │       └── watermark.js
    └── highlightkaro-frontend/
        ├── README.md
        ├── eslint.config.js
        ├── index.html
        ├── package.json
        ├── postcss.config.js
        ├── tailwind.config.js
        ├── vite.config.js
        └── src/
            ├── App.css
            ├── App.jsx
            ├── HighlightKaro.jsx
            ├── index.css
            ├── main.jsx
            ├── api/
            │   ├── authApi.js
            │   ├── paymentApi.js
            │   ├── pricingApi.js
            │   └── renderApi.js
            ├── components/
            │   └── PlanGuard.jsx
            ├── config/
            │   ├── api.js
            │   ├── planConfig.js
            │   └── pricingConfig.js
            ├── context/
            │   └── AuthContext.jsx
            ├── pages/
            │   ├── Login.jsx
            │   ├── PaymentFailed.jsx
            │   ├── PaymentRedirect.jsx
            │   ├── PaymentSuccess.jsx
            │   ├── Register.jsx
            │   └── Upgrade.jsx
            └── utils/
                ├── auth.js
                ├── exportState.js
                └── planFeatures.js

```
 ## Environment Setup
 ```
# ========================================
# Clone the repository
# ========================================
git clone <repo-url>
cd highlightkaro


# ========================================
# ⚙️ Backend Environment (Node.js + Express + FFmpeg)
# ========================================

# Navigate to backend
cd highlightkaro-backend

# Install backend dependencies
npm install

# Verify FFmpeg installation
ffmpeg -version

# Start backend server
node app.js

# Backend will be running at:
# http://localhost:5000


# ========================================
# 🎨 Frontend Environment (React + Vite)
# ========================================

# Navigate to frontend
cd highlightkaro-frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev

# Frontend will be running at:
# https://highlightkaro-1.onrender.com


# ========================================
# 🔗 Connecting Frontend & Backend
# ========================================

# Frontend communicates with backend using:
fetch("http://localhost:5000/render", {
  method: "POST",
  body: formData
});

# Service URLs
# Frontend: https://highlightkaro-1.onrender.com
# Backend:  http://localhost:5000

# If both are running, MP4 Export will work correctly. 🎉

```
## 🧩 How It Works (Architecture Overview)
```
 ┌──────────────┐      Upload Image       ┌──────────────┐
 │  Frontend     │ ─────────────────────▶ │   Backend     │
 │ (React + Vite)│                        │ (Express +    │
 │ Canvas UI     │ ◀───────────────────── │   FFmpeg)     │
 └──────┬────────┘     MP4 Response       └──────┬────────┘
        │                                       │
        │                                       │
        ▼                                       ▼
 User draws highlight                Backend generates
 and previews animation              MP4 via FFmpeg pipeline
```



## 📞 Support


For questions or support, please contact:
- Email: 2529nida17@gmail.com
- GitHub Issues: [Create an issue](https://github.com/29NidaFatima/Issues)





