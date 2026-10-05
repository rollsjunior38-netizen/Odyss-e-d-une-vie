import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'reservations.json');

// Ensure data folder and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
}

function readReservations(): any[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading reservations file:', err);
    return [];
  }
}

function writeReservations(data: any[]): boolean {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing reservations file:', err);
    return false;
  }
}

function extractTicketNumber(str: string): number | null {
  if (!str) return null;
  const match = str.match(/(\d+)/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return isNaN(n) ? null : n;
}

const CATEGORY_LIMITS_MAP: Record<string, { min: number; max: number; rangeLabel: string }> = {
  Gold: { min: 1, max: 59, rangeLabel: '001 - 059' },
  Silver: { min: 100, max: 200, rangeLabel: '100 - 200' },
  Classic: { min: 300, max: 400, rangeLabel: '300 - 400' },
};

function validateTicketNumberRules(category: string, ticketNumber: string, list: any[], currentId?: string): string | null {
  const limits = CATEGORY_LIMITS_MAP[category];
  if (!limits) return null;

  const num = extractTicketNumber(ticketNumber);
  if (num === null) {
    return `Numéro de billet invalide. Pour ${category}, il doit être compris entre ${limits.rangeLabel}.`;
  }

  if (num < limits.min || num > limits.max) {
    return `Dépassement de limite : Les billets ${category} sont strictement limités de ${limits.rangeLabel} (${num} est hors limites).`;
  }

  // Check duplicate number in this category
  const conflict = list.find((r) => {
    if (currentId && r.id === currentId) return false;
    return r.category === category && extractTicketNumber(r.ticketNumber) === num;
  });

  if (conflict) {
    return `Le numéro ${num} pour ${category} est déjà attribué à ${conflict.clientName} (Billet : ${conflict.ticketNumber}).`;
  }

  return null;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/reservations', (_req, res) => {
    const list = readReservations();
    res.json(list);
  });

  app.post('/api/reservations', (req, res) => {
    const list = readReservations();
    const newReservation = req.body;

    if (!newReservation.clientName || !newReservation.category || !newReservation.ticketNumber) {
      return res.status(400).json({ error: 'Champs requis manquants (Nom, Catégorie, N° Billet)' });
    }

    const valError = validateTicketNumberRules(newReservation.category, newReservation.ticketNumber, list);
    if (valError) {
      return res.status(400).json({ error: valError });
    }

    const item = {
      ...newReservation,
      id: newReservation.id || `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: newReservation.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list.unshift(item);
    writeReservations(list);
    res.status(201).json(item);
  });

  app.put('/api/reservations/:id', (req, res) => {
    const { id } = req.params;
    const list = readReservations();
    const index = list.findIndex((r) => r.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    const updatedData = req.body;
    const categoryToCheck = updatedData.category || list[index].category;
    const ticketToCheck = updatedData.ticketNumber || list[index].ticketNumber;

    const valError = validateTicketNumberRules(categoryToCheck, ticketToCheck, list, id);
    if (valError) {
      return res.status(400).json({ error: valError });
    }

    list[index] = {
      ...list[index],
      ...updatedData,
      id,
      updatedAt: new Date().toISOString(),
    };

    writeReservations(list);
    res.json(list[index]);
  });

  app.delete('/api/reservations/:id', (req, res) => {
    const { id } = req.params;
    const list = readReservations();
    const target = list.find((r) => r.id === id || r.ticketNumber === id);
    const filtered = list.filter((r) => r.id !== id && r.ticketNumber !== id);

    writeReservations(filtered);
    res.json({
      success: true,
      message: 'Réservation supprimée avec succès',
      deleted: target || null,
      remainingCount: filtered.length,
    });
  });

  app.post('/api/reservations/bulk', (req, res) => {
    const newItems = req.body;
    if (!Array.isArray(newItems)) {
      return res.status(400).json({ error: 'Tableau attendu' });
    }
    const current = readReservations();
    const updated = [...newItems, ...current];
    writeReservations(updated);
    res.json({ success: true, count: newItems.length });
  });

  // Health / info
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  if (!isProd) {
    // Vite middleware in dev
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serve
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
