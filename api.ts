
/**
 * API Service for FleetMaster AI Cloud Sync
 * Replace PROXY_URL with your actual Cloudflare Worker URL
 */

const PROXY_URL = "https://tu-worker.tusubdominio.workers.dev"; 

export const cloudApi = {
  async getData(syncId: string) {
    if (!syncId) return null;
    try {
      const response = await fetch(`${PROXY_URL}/${syncId}`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Cloud Pull Error:", error);
      throw error;
    }
  },

  async putData(syncId: string, payload: any) {
    if (!syncId) return null;
    try {
      const response = await fetch(`${PROXY_URL}/${syncId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Cloud Push Error:", error);
      throw error;
    }
  }
};
