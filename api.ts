
/**
 * API Service for FleetMaster AI - Cloud Run + Firestore
 */

// IMPORTANTE: Debes poner la URL real que te dio Google Cloud Run al desplegar.
// Ejemplo: "https://fleetmaster-backend-8fjs92.a.run.app"
const CLOUD_RUN_URL = "https://fleetmaster-backend-XXXXX.a.run.app"; 

export const cloudApi = {
  async getData(idToken: string) {
    if (!idToken) return null;
    console.log("📡 Intentando PULL desde:", CLOUD_RUN_URL);
    try {
      const response = await fetch(`${CLOUD_RUN_URL}/api/fleet`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${idToken}`,
          'Cache-Control': 'no-cache' 
        }
      });
      
      if (response.status === 401) {
        console.error("❌ Error 401: Token de Firebase no válido o expirado.");
        return null;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error de Servidor (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log("✅ Datos recibidos de la nube:", data);
      return data;
    } catch (error) {
      console.error("🚨 Error crítico en PULL:", error);
      throw error;
    }
  },

  async putData(idToken: string, payload: any) {
    if (!idToken) return null;
    console.log("📤 Intentando PUSH a:", CLOUD_RUN_URL);
    try {
      const response = await fetch(`${CLOUD_RUN_URL}/api/fleet`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ payload })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error de Servidor (${response.status}): ${errorText}`);
      }
      
      console.log("✅ Sincronización exitosa con Firestore.");
      return await response.json();
    } catch (error) {
      console.error("🚨 Error crítico en PUSH:", error);
      throw error;
    }
  }
};
