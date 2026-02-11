
const CLOUD_RUN_URL = "https://fleetmaster-backend-8fjs92.a.run.app"; 

export const cloudApi = {
  async createFleet(idToken: string, name: string) {
    const response = await fetch(`${CLOUD_RUN_URL}/api/fleets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body: JSON.stringify({ name })
    });
    return response.json();
  },

  async inviteMember(idToken: string, fleetId: string, email: string) {
    const response = await fetch(`${CLOUD_RUN_URL}/api/fleets/${fleetId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body: JSON.stringify({ email })
    });
    return response.json();
  },

  async getData(idToken: string, fleetId: string) {
    const response = await fetch(`${CLOUD_RUN_URL}/api/fleet/${fleetId}`, {
      headers: { 'Authorization': `Bearer ${idToken}`, 'Cache-Control': 'no-cache' }
    });
    if (!response.ok) throw new Error("Acceso denegado a la flota");
    return response.json();
  },

  async putData(idToken: string, fleetId: string, payload: any) {
    const response = await fetch(`${CLOUD_RUN_URL}/api/fleet/${fleetId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body: JSON.stringify({ payload })
    });
    return response.json();
  }
};
