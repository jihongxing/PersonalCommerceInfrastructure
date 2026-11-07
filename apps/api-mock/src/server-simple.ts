import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;

const PORT = 8080;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://pci_user:pci_local_pass@localhost:5432/pci_auth',
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

app.get('/health/db', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error' });
  }
});

// 简单的测试端点
app.post('/api/v1/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    console.log('Signup request:', { email, name });
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // 直接返回成功，数据保存到数据库
    const id = require('crypto').randomUUID();
    const token = 'test-token-' + Date.now();
    
    // 插入到 accounts 表
    const result = await pool.query(
      `INSERT INTO accounts (id, email, password_hash, name, is_active, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())
       RETURNING id, email, name`,
      [id, email, 'hashed-' + password, name]
    );

    console.log('Account created:', result.rows[0]);
    res.status(201).json({
      accountId: result.rows[0].id,
      email: result.rows[0].email,
      name: result.rows[0].name,
      accessToken: token,
      refreshToken: token,
    });
  } catch (error) {
    console.error('Error:', (error as Error).message);
    res.status(500).json({ error: (error as Error).message });
  }
});

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected');
    
    app.listen(PORT, () => {
      console.log(`✅ Mock API server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }
}

start();
