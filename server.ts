
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';

// Inicialización de Firebase Admin (Cloud Run usa la cuenta de servicio por defecto)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' })); // Permitir payloads grandes para la flota

const COLLECTION_NAME = 'items';
const DOCUMENT_ID = 'GLOBAL_FLEET_STATE';

/**
 * GET /items
 * Devuelve todos los items con fleetId == "GLOBAL"
 */
app.get('/items', async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION_NAME)
      .where('fleetId', '==', 'GLOBAL')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({ data: null });
    }

    const docData = snapshot.docs[0].data();
    res.json(docData);
  } catch (error: any) {
    console.error("Error GET /items:", error);
    res.status(500).send(error.message);
  }
});

/**
 * POST /items
 * Guarda el contenido con fleetId: "GLOBAL"
 */
app.post('/items', async (req, res) => {
  try {
    const { content } = req.body;
    
    const payload = {
      fleetId: "GLOBAL",
      data: content,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Usamos set con merge para asegurar que el documento exista y se actualice
    await db.collection(COLLECTION_NAME).doc(DOCUMENT_ID).set(payload, { merge: true });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error POST /items:", error);
    res.status(500).send(error.message);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 FleetMaster Backend GLOBAL corriendo en puerto ${PORT}`);
});
