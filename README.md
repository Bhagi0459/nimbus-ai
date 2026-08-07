# 🌦️ Nimbus AI

Nimbus AI is a modern weather intelligence dashboard built using Angular 19 and Express.js. It combines real-time weather data, AI-powered insights, interactive visualizations, and a premium user experience.

## 🚀 Live Demo

**Frontend:**
https://nimbus-ai-phi.vercel.app/

**Backend API:**
https://nimbus-ai-api.onrender.com/

> Note: The backend is hosted on Render's free tier and may take a few seconds to wake up after inactivity.

---

## ✨ Features

* 🌍 Real-time weather search
* 🤖 AI-powered weather insights using Groq
* 📈 Interactive temperature trends with ApexCharts
* 🗺️ Weather map integration using Leaflet
* 🌬️ Wind compass visualization
* 🌫️ Air Quality Index (AQI) monitoring
* 📅 3-Day weather forecast
* ⏰ Hourly forecast timeline
* 🕓 Recently searched cities remembered locally
* ⏳ Friendly heads-up while the free-tier backend wakes up
* 🌦️ Dynamic weather backgrounds and effects
* 💀 Skeleton loaders for smooth loading states
* 🔒 Secure API integration through Express backend
* 🛡️ Response caching and rate limiting to protect API quotas
* ✅ Automated unit tests for the weather data mapping logic
* ⚙️ Environment-based configuration
* 🚀 CI/CD using GitHub Actions, Render, and Vercel

---

## 🏗️ Architecture

Frontend (Angular 19)
↓
Express.js Backend
↓
WeatherAPI + Groq AI

---

## 🛠️ Tech Stack

### Frontend

* Angular 19
* TypeScript
* Signals
* SCSS
* ApexCharts
* Leaflet
* Lucide Icons

### Backend

* Express.js
* Node.js
* Groq SDK
* dotenv
* CORS
* express-rate-limit

### DevOps

* GitHub Actions
* Render
* Vercel

---

## ⚡ Getting Started

### Frontend

```bash
npm install
ng serve
```

Navigate to:

```txt
http://localhost:4200
```

### Backend

```bash
cd server
npm install
npm run dev
```

Create a `.env` file inside the `server` folder:

```env
GROQ_API_KEY=your_groq_api_key
WEATHER_API_KEY=your_weather_api_key
```

Backend runs at:

```txt
http://localhost:3000
```

---

## 🚀 Deployment

* Frontend deployed on Vercel
* Backend deployed on Render
* Automated build validation using GitHub Actions

---

## 📚 Documentation

A full engineering write-up — architecture, the backend line by line, the
frontend's Signal-based state, every widget, deployment, and a glossary of
every term used — lives in [`docs/`](./docs/README.md), written to be
followable by any developer picking up this codebase for the first time.

---

## 👨‍💻 Author

**Bhagya Sankar Maddela**

Built to showcase modern Angular development practices, backend integration, AI capabilities, and end-to-end deployment workflows.
