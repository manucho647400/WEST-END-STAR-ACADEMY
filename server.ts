import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, getUsers, saveRegisteredUser } from './src/db/users.ts';
import {
  getDbStudents,
  upsertDbStudent,
  getDbTransactions,
  addDbTransaction,
  getDbAssessments,
  addDbAssessment,
} from './src/db/queries.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Backend API endpoints
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email;
      const name = (req.user as any)?.name || req.body?.name || '';
      if (!uid || !email) {
        return res.status(400).json({ error: 'Missing UID or email in token' });
      }
      const user = await getOrCreateUser(uid, email, name);
      res.json({ success: true, user });
    } catch (error: any) {
      console.error('Error in /api/auth/sync:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  app.get('/api/users', requireAuth, async (_req: AuthRequest, res) => {
    try {
      const usersList = await getUsers();
      res.json(usersList);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch users' });
    }
  });

  // Save user details when an account is created
  app.post('/api/users/register', async (req, res) => {
    try {
      const userData = req.body;
      if (!userData || !userData.email) {
        return res.status(400).json({ error: 'User email is required' });
      }
      const savedUser = await saveRegisteredUser(userData);
      res.json({ success: true, user: savedUser || userData });
    } catch (error: any) {
      console.error('Failed to register user details:', error);
      res.status(500).json({ error: error.message || 'Failed to save user details' });
    }
  });

  app.get('/api/users/all', async (_req, res) => {
    try {
      const usersList = await getUsers();
      res.json(usersList);
    } catch (error: any) {
      console.error('Failed to fetch all users:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch all users' });
    }
  });

  app.get('/api/students', async (_req, res) => {
    try {
      const studentsList = await getDbStudents();
      res.json(studentsList);
    } catch (error: any) {
      console.error('Failed to fetch students:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch students' });
    }
  });

  app.post('/api/students', requireAuth, async (req: AuthRequest, res) => {
    try {
      const studentData = req.body;
      if (!studentData || !studentData.id || !studentData.fullName) {
        return res.status(400).json({ error: 'Student ID and Full Name are required' });
      }
      const saved = await upsertDbStudent(studentData);
      res.json({ success: true, student: saved });
    } catch (error: any) {
      console.error('Failed to save student:', error);
      res.status(500).json({ error: error.message || 'Failed to save student' });
    }
  });

  app.get('/api/transactions', async (_req, res) => {
    try {
      const txs = await getDbTransactions();
      res.json(txs);
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
    }
  });

  app.post('/api/transactions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const txData = req.body;
      if (!txData || !txData.id || !txData.receiptNo || !txData.amount) {
        return res.status(400).json({ error: 'Receipt No and Amount are required' });
      }
      const saved = await addDbTransaction(txData);
      res.json({ success: true, transaction: saved });
    } catch (error: any) {
      console.error('Failed to save transaction:', error);
      res.status(500).json({ error: error.message || 'Failed to save transaction' });
    }
  });

  app.get('/api/assessments', async (_req, res) => {
    try {
      const records = await getDbAssessments();
      res.json(records);
    } catch (error: any) {
      console.error('Failed to fetch assessments:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch assessments' });
    }
  });

  app.post('/api/assessments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const assessmentData = req.body;
      const saved = await addDbAssessment(assessmentData);
      res.json({ success: true, assessment: saved });
    } catch (error: any) {
      console.error('Failed to save assessment:', error);
      res.status(500).json({ error: error.message || 'Failed to save assessment' });
    }
  });

  // Serve Vite in dev or static in prod
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
