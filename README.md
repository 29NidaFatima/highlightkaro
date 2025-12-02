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
- 🎞️ Two animation modes: **Left → Right wipe** & **Pulse**  
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
HIGHLIGHTKARO/
│
├── highlightkaro-backend/
│   ├── app.js
│   ├── package-lock.json
│   ├── package.json
│
├── highlightkaro-frontend/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── HighlightKaro.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── README.md
│   ├── tailwind.config.js
│   ├── vite.config.js
│
└── (root)


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
# http://localhost:5173


# ========================================
# 🔗 Connecting Frontend & Backend
# ========================================

# Frontend communicates with backend using:
fetch("http://localhost:5000/render", {
  method: "POST",
  body: formData
});

# Service URLs
# Frontend: http://localhost:5173
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





