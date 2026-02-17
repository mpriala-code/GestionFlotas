
/**
 * API para conexión con el backend en Cloud Run.
 * Incluye fallback a localStorage para robustez en caso de errores de red.
 */
const API_URL = 'https://fleetmaster-backend-809491764126.europe-west1.run.app/items';
const LOCAL_STORAGE_KEY = 'fleet_master_data_cache';

export const cloudApi = {
  async getGlobalData() {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error('Servidor en la nube no disponible');
      
      const result = await response.json();
      if (result && result.data) {
        // Guardar copia local al recibir datos frescos
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(result.data));
      }
      return result;
    } catch (error) {
      console.warn("API Error (GET) - Usando caché local:", error);
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        return { data: JSON.parse(cached) };
      }
      return { data: null };
    }
  },

  async saveGlobalData(content: any) {
    // Siempre guardar localmente primero
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(content));
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!response.ok) throw new Error('Error al sincronizar con la nube');
      return await response.json();
    } catch (error) {
      console.error("API Error (POST) - Datos guardados localmente:", error);
      // No lanzamos error para que la UI no se bloquee, ya que guardamos en local
      return { success: false, offline: true };
    }
  }
};
