
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';

// Inicialización de Firebase Admin (Cloud Run la detecta automáticamente si el proyecto está configurado)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' })); // Aumentamos límite para flotas grandes

// Middleware de Autenticación
const authenticate = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).send('No autorizado: Token faltante');

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).send('No autorizado: Token inválido');
  }
};

/**
 * GET /api/fleet/:fleetId
 * Obtiene los datos de una flota específica
 */
app.get('/api/fleet/:fleetId', authenticate, async (req: any, res: any) => {
  const { fleetId } = req.params;
  try {
    console.log(`📡 Petición GET para flota: ${fleetId} por usuario: ${req.user.uid}`);
    const doc = await db.collection('fleets').doc(fleetId).get();
    
    if (!doc.exists) {
      return res.json({ payload: null, message: 'Flota nueva creada' });
    }
    
    res.json(doc.data());
  } catch (error: any) {
    console.error("Error Firestore GET:", error);
    res.status(500).send(error.message);
  }
});

/**
 * POST /api/fleet/:fleetId
 * Guarda/Sincroniza los datos de una flota
 */
app.post('/api/fleet/:fleetId', authenticate, async (req: any, res: any) => {
  const { fleetId } = req.params;
  const { payload } = req.body;

  try {
    const data = {
      payload,
      lastUpdater: req.user.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('fleets').doc(fleetId).set(data, { merge: true });
    console.log(`💾 Sincronización exitosa: ${fleetId}`);
    res.json({ success: true, timestamp: Date.now() });
  } catch (error: any) {
    console.error("Error Firestore POST:", error);
    res.status(500).send(error.message);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Backend FleetMaster activo en puerto ${PORT}`));
