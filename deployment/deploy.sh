#!/bin/bash
# =============================================================
# MechAI - Google Cloud Run Deployment Script
# Team: TorqueIQ | Google Cloud AI Builder Cup 2025
# =============================================================

set -e

# ---- CONFIGURE THESE ----
PROJECT_ID="YOUR_PROJECT_ID"
REGION="asia-south1"
BACKEND_SERVICE="mechai-backend"
FRONTEND_SERVICE="mechai-frontend"
BUCKET_NAME="mechai-uploads"
# --------------------------

echo "🚀 Deploying MechAI to Google Cloud Run..."

# Authenticate
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  storage.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com

# Create GCS bucket
gsutil mb -p $PROJECT_ID -l $REGION gs://$BUCKET_NAME 2>/dev/null || echo "Bucket already exists"
gsutil cors set deployment/cors.json gs://$BUCKET_NAME

# Deploy Backend
echo "📦 Building and deploying backend..."
gcloud run deploy $BACKEND_SERVICE \
  --source ./backend \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "GCP_PROJECT_ID=$PROJECT_ID,GCS_BUCKET_NAME=$BUCKET_NAME" \
  --set-secrets "GEMINI_API_KEY=gemini-api-key:latest" \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300

BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region $REGION --format 'value(status.url)')
echo "✅ Backend deployed: $BACKEND_URL"

# Deploy Frontend
echo "🎨 Building and deploying frontend..."
gcloud run deploy $FRONTEND_SERVICE \
  --source ./frontend \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "REACT_APP_API_URL=$BACKEND_URL/api" \
  --memory 512Mi

FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region $REGION --format 'value(status.url)')
echo ""
echo "🎉 Deployment Complete!"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo "   API Docs: $BACKEND_URL/docs"
