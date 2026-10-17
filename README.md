# 🔧 MechAI — The Mechanic's Intelligent Workshop Co-Pilot

> **Team TorqueIQ** · Google Cloud AI Builder Cup 2026 · Theme: Manufacturing

[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Cloud%20Run%20%7C%20Firebase-blue?logo=google-cloud)](https://cloud.google.com/run)
[![Gemini](https://img.shields.io/badge/Google%20AI-Gemini%203.8%20Flash-orange?logo=google)](https://deepmind.google/technologies/gemini/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Tailwind-61DAFB?logo=react)](https://react.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🚀 What is MechAI?

**MechAI** is an AI-powered garage companion and workshop co-pilot created by **TorqueIQ**. Built for real-world automotive manufacturing and repair operations, MechAI empowers technicians, mechanics, and service advisors to diagnose vehicle faults with pinpoint accuracy in seconds.

### The Problem It Solves:
- **The "Greasy Hands" Bottleneck**: In the shop, mechanics are covered in oil and grease under the hood. They cannot type on a keyboard or tap small screens. MechAI provides **true hands-free voice interaction** so mechanics can talk to their AI co-pilot without touching the screen.
- **Raw Telemetry vs. Real Physical Symptoms**: An OBD-II diagnostic scanner outputs cryptic codes (e.g., `P0300` - Random Misfire), but cannot tell a technician *why* it's happening. MechAI fuses raw vehicle telemetry with multimodal inputs (voice descriptions, photos, and engine videos) to isolate the exact failing component.
- **Instant Workshop Quotes**: Generates complete customer repair orders (RO) with required parts, pricing estimates, and labor hours instantly.

---

## ✨ Key Features

- ⚡ **OBD-II / DTC Diagnostic Engine**: Cross-references standardized automotive fault codes (`P0300`, `P0420`, `P0171`, `P0455`, `P0128`) with engine telemetry and physical symptoms.
- 🎙️ **Hands-Free Workshop Voice Assistant**: Continuous voice-activated loop designed for noisy, hands-busy garage environments.
- 📋 **Automated Customer Job Sheet (RO)**: 1-click printable repair order featuring technical findings, parts breakdown table, estimated labor hours, and customer/technician sign-off blocks.
- 🛠️ **Interactive Pre-Job Checklist**: Interactive tap-to-complete steps and tool checklist for pre-job prep.
- 🎥 **Multimodal Video & Image Analysis**: Upload engine bay photos, gauge clusters, or videos of strange engine sounds analyzed directly by Gemini.
- 📊 **Probabilistic Root Cause Breakdown**: Top 3 most probable root causes with confidence percentages and practical explanations.
- 🛡️ **Driveability & Safety Advisory**: Real-time safety ratings (`SAFE`, `DRIVE WITH CAUTION`, `DO NOT DRIVE`) preventing catastrophic engine failure.
- 📲 **Installable Progressive Web App (PWA)**: Works seamlessly across desktop, tablets, and mobile phones with native install support.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       React 18 PWA                          │
│     (Hands-Free Speech API · Tailwind CSS · Job Sheets)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON / Multipart
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                          │
│     (Async Python · Multimodal Ingestion · REST Endpoints)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
     ┌──────────────────┐ ┌─────────┐ ┌─────────────┐
     │  Google Gemini   │ │ Cloud   │ │ Cloud Run / │
     │  3.8 Flash API   │ │ Storage │ │ Firebase    │
     │  (Multimodal AI) │ │ (Media) │ │ (Hosting)   │
     └──────────────────┘ └─────────┘ └─────────────┘
```

---

## ⚡ Quick Start (Local Setup for Reviewers)

### Prerequisites
- Python 3.10+
- Node.js 18+
- Gemini API Key ([Google AI Studio](https://aistudio.google.com/app/apikey))

### 1. Clone the Repository
```bash
git clone https://github.com/YashRaj1240/Auto_Buddy.git
cd Auto_Buddy
```

### 2. Backend Setup
```bash
cd backend
# Create and activate a virtual environment (optional but recommended)
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo GEMINI_API_KEY=your_gemini_api_key_here > .env

# Run FastAPI backend
python -m uvicorn main:app --reload --port 8080
```
Backend will be live at: `http://127.0.0.1:8080` (Docs: `http://127.0.0.1:8080/docs`)

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm start
```
Frontend will be live at: `http://localhost:3000`

---

## 🧪 Quick Test Flow for Evaluators

1. Open `http://localhost:3000`.
2. Select **Honda Civic 2020**.
3. Under **Describe the Issue**, use the mic or type:
   > *"Engine is sputtering, power loss under acceleration, check engine light blinking."*
4. Select the **P0300** quick-select OBD-II pill.
5. Click **"Diagnose Vehicle Fault"**.
6. Inspect the **OBD-II Decoded Card**, tap the **Interactive Fix Steps** to complete them, and click **"Customer Job Sheet"** to preview the printable repair order!
7. Activate the **Hands-Free Assistant** to converse directly with MechAI.

---

## 👥 Team TorqueIQ
Developed for the **Google Cloud AI Builder Cup 2026** (Manufacturing Theme).
- **Yash Raj Choudhary** — Developer & Solution Architect
