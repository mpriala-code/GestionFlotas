
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());

// Middleware de Logs para diagnóstico
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const authenticate = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    console.warn("⚠️ Intento de acceso sin token.");
    return res.status(401).send('No token provided');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    console.log(`👤 Usuario identificado: ${req.user.uid}`);
    next();
  } catch (error) {
    console.error("❌ Token inválido:", error.message);
    res.status(401).send('Invalid token');
  }
};

app.get('/api/fleet', authenticate, async (req: any, res: any) => {
  try {
    const doc = await db.collection('fleets').doc(req.user.uid).get();
    if (!doc.exists) {
      console.log(`ℹ️ No hay datos previos para el usuario: ${req.user.uid}`);
      return res.json(null);
    }
    res.json(doc.data());
  } catch (error) {
    console.error("❌ Error leyendo de Firestore:", error);
    res.status(500).send(error.message);
  }
});

app.post('/api/fleet', authenticate, async (req: any, res: any) => {
  try {
    const { payload } = req.body;
    const data = {
      payload,
      ownerId: req.user.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('fleets').doc(req.user.uid).set(data, { merge: true });
    console.log(`💾 Datos guardados para el usuario: ${req.user.uid}`);
    res.json({ success: true, timestamp: Date.now() });
  } catch (error) {
    console.error("❌ Error escribiendo en Firestore:", error);
    res.status(500).send(error.message);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Backend operativo en puerto ${PORT}`));
