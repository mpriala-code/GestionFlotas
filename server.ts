
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Middleware de Autenticación
const authenticate = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).send('No autorizado');
  try {
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch (error) {
    res.status(401).send('Token inválido');
  }
};

// Middleware de Verificación de Membresía
const checkMembership = async (req: any, res: any, next: any) => {
  const { fleetId } = req.params;
  const memberDoc = await db.collection('fleets').doc(fleetId).collection('members').doc(req.user.uid).get();
  
  if (!memberDoc.exists) {
    return res.status(403).send('No tienes acceso a esta flota');
  }
  req.userRole = memberDoc.data()?.role;
  next();
};

/**
 * POST /api/fleets
 * Crea una nueva flota y asigna al creador como admin
 */
app.post('/api/fleets', authenticate, async (req: any, res: any) => {
  const { name } = req.body;
  const fleetId = name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
  
  try {
    const batch = db.batch();
    const fleetRef = db.collection('fleets').doc(fleetId);
    const memberRef = fleetRef.collection('members').doc(req.user.uid);

    batch.set(fleetRef, { 
      name, 
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      payload: { vehicles: [], workers: [], works: [], logs: [], priceHistory: [] }
    });
    
    batch.set(memberRef, { 
      role: 'admin', 
      email: req.user.email,
      joinedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();
    res.json({ fleetId, name });
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

/**
 * POST /api/fleets/:fleetId/members
 * Invitar a un miembro (Solo Admins)
 */
app.post('/api/fleets/:fleetId/members', authenticate, checkMembership, async (req: any, res: any) => {
  if (req.userRole !== 'admin') return res.status(403).send('Solo los admins pueden invitar');
  
  const { email, role = 'member' } = req.body;
  const { fleetId } = req.params;

  try {
    const user = await admin.auth().getUserByEmail(email);
    await db.collection('fleets').doc(fleetId).collection('members').doc(user.uid).set({
      role,
      email,
      invitedBy: req.user.uid,
      joinedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(404).send('Usuario no encontrado en Firebase Auth');
  }
});

app.get('/api/fleet/:fleetId', authenticate, checkMembership, async (req: any, res: any) => {
  const doc = await db.collection('fleets').doc(req.params.fleetId).get();
  res.json(doc.data());
});

app.post('/api/fleet/:fleetId', authenticate, checkMembership, async (req: any, res: any) => {
  await db.collection('fleets').doc(req.params.fleetId).update({
    payload: req.body.payload,
    lastUpdater: req.user.uid,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  res.json({ success: true });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 FleetMaster Multi-Tenant en puerto ${PORT}`));
