
#!/bin/bash

# Configuración
PROJECT_ID="tu-proyecto-gcp"
SERVICE_NAME="fleetmaster-backend"
REGION="europe-west1"

echo "🚀 Desplegando FleetMaster Backend en Cloud Run..."

# Build de la imagen en Google Container Registry
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# Despliegue en Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated # El middleware de Firebase ya maneja la seguridad

echo "✅ Despliegue completado!"
