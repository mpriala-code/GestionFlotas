
/**
 * API Service for FleetMaster AI - Cloud Run + Firestore
 */

// REEMPLAZA ESTA URL con la que te dé Google Cloud Run tras desplegar
const CLOUD_RUN_URL = "https://fleetmaster-backend-8fjs92.a.run.app"; 

export const cloudApi = {
  async getData(idToken: string, fleetId: string) {
    if (!idToken || !fleetId) return null;
    try {
      const response = await fetch(`${CLOUD_RUN_URL}/api/fleet/${fleetId}`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${idToken}`,
          'Cache-Control': 'no-cache' 
        }
      });
      
      if (!response.ok) throw new Error(`Error ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("🚨 Error PULL:", error);
      throw error;
    }
  },

  async putData(idToken: string, fleetId: string, payload: any) {
    if (!idToken || !fleetId) return null;
    try {
      const response = await fetch(`${CLOUD_RUN_URL}/api/fleet/${fleetId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ payload })
      });
      
      if (!response.ok) throw new Error(`Error ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("🚨 Error PUSH:", error);
      throw error;
    }
  }
};
