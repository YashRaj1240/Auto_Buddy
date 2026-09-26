# 🔧 MechAI — AI-Powered Automotive Fault Diagnosis

> **Team TorqueIQ** · Google Cloud AI Builder Cup 2025 · Theme: Manufacturing

[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Run-blue?logo=google-cloud)](https://cloud.google.com/run)
[![Gemini](https://img.shields.io/badge/Gemini-1.5%20Pro-orange?logo=google)](https://deepmind.google/technologies/gemini/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🚀 What is MechAI?

MechAI is an AI-powered workshop co-pilot that helps **any technician** — even those with zero ECU knowledge — diagnose automotive faults instantly.

A technician can:
1. **Select** their car (brand, model, year)
2. **Describe** the issue via text or **voice**
3. **Upload** a photo or **video** of the fault
4. Get a complete **Root Cause Analysis** with step-by-step fix instructions in plain English

---

## 🏗️ Architecture

```
[React Frontend] ──► [FastAPI Backend on Cloud Run]
                          │
                ┌─────────┼─────────────┐
                ▼         ▼             ▼
          [Gemini 1.5 Pro] [Firestore] [Cloud Storage]
          (Multimodal AI)  (Sessions)  (Video/Images)
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Tailwind CSS |
| Backend | FastAPI + Python 3.11 |
| AI Model | Gemini 1.5 Pro (multimodal) |
| Deployment | Google Cloud Run |
| Database | Google Cloud Firestore |
| Storage | Google Cloud Storage |

---

## ✨ Key Features

- 🎙️ **Voice Input** — Speak the issue, get instant transcription
- 🎥 **Video Analysis** — Film the fault; Gemini analyzes it natively
- 📸 **Image Upload** — Dashboard lights, engine bay photos
- 🤖 **Multi-layer AI** — Root causes ranked by probability
- 🔧 **Step-by-step fixes** — Written for non-experts
- 💬 **Follow-up Chat** — Ask deeper questions after diagnosis
- 📄 **PDF Report** — Download and share with workshop manager
- 📱 **Mobile Responsive** — Works on any device in the field

---

## ⚡ Quick Start (Local)

### Prerequisites
- Python 3.11+
- Node.js 20+
- Google Cloud account
- Gemini API key

### 1. Clone the repo
```bash
git clone https://github.com/YashRaj1240/mechai.git
cd mechai
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env
# Fill in GEMINI_API_KEY and GCP_PROJECT_ID in .env
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## ☁️ Deploy to Google Cloud Run

```bash
# Make deploy script executable
chmod +x deployment/deploy.sh

# Edit PROJECT_ID in deploy.sh, then:
./deployment/deploy.sh
```

---

## 📁 Project Structure

```
mechai/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── routers/
│   │   ├── diagnose.py            # Main diagnosis endpoint
│   │   ├── chat.py                # Follow-up chat endpoint
│   │   └── upload.py              # File upload endpoint
│   ├── services/
│   │   ├── gemini_service.py      # Gemini 1.5 Pro integration
│   │   ├── firestore_service.py   # Firestore CRUD operations
│   │   └── storage_service.py     # Google Cloud Storage
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DiagnoseForm.jsx   # Car selector + input form
│   │   │   ├── DiagnosisReport.jsx # Full RCA report UI
│   │   │   └── Header.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Main page
│   │   │   ├── Report.jsx         # Saved report view
│   │   │   └── History.jsx        # Diagnosis history
│   │   └── App.jsx
│   └── Dockerfile
├── deployment/
│   └── deploy.sh                  # One-click Cloud Run deploy
├── docker-compose.yml
└── README.md
```

---

## 🎯 Hackathon Theme Alignment

**Theme: Manufacturing** — MechAI directly addresses:
- ✅ **Quality Control**: AI-powered defect detection via visual + audio analysis
- ✅ **Operational Efficiency**: Reduces diagnostic time from hours → minutes
- ✅ **Knowledge Democratization**: Junior technicians get senior-engineer-level diagnosis

---

## 👥 Team TorqueIQ

ECU engineers & AI builders. Real automotive software for global OEMs. Real Voice AI in production. One mission: give every mechanic the diagnostic power of a senior engineer, powered by Google Cloud & Gemini AI.

---

## 📄 License

MIT License — TorqueIQ © 2025
