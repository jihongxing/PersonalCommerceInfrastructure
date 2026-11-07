import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pg from 'pg';

const { Pool } = pg;

// 配置
const PORT = 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-secret-key-change-in-production-must-be-32-chars-minimum';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'local-refresh-secret-key-change-in-production-min-32-chars';

// 数据库连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://pci_user:pci_local_pass@localhost:5432/pci_auth',
});

// 应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

app.get('/health/db', async (req: Request, res: Response) => {
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const latency = Date.now() - start;
    res.json({ status: 'connected', latency_ms: latency });
  } catch (error) {
    res.status(500).json({ status: 'disconnected', error: (error as Error).message });
  }
});

// API 路由前缀
const API_V1 = '/api/v1';

/**
 * POST /api/v1/auth/signup
 * 用户注册
 */
app.post(`${API_V1}/auth/signup`, async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // 验证输入
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // 检查邮箱是否已存在
    const existing = await pool.query('SELECT id FROM accounts WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // 哈希密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建账户
    const accountId = uuidv4();
    await pool.query(
      'INSERT INTO accounts (id, email, password_hash, name, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
      [accountId, email, passwordHash, name, true]
    );

    // 生成 tokens
    const accessToken = jwt.sign({ accountId, email }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ accountId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // 存储 refresh token
    const tokenId = uuidv4();
    await pool.query(
      'INSERT INTO refresh_tokens (id, account_id, token, is_revoked, expires_at, created_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL \'7 days\', NOW())',
      [tokenId, accountId, refreshToken, false]
    );

    res.status(201).json({
      accountId,
      email,
      name,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/auth/login
 * 用户登陆
 */
app.post(`${API_V1}/auth/login`, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    // 查找账户
    const result = await pool.query('SELECT id, password_hash, name FROM accounts WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { id: accountId, password_hash, name } = result.rows[0];

    // 验证密码
    const validPassword = await bcrypt.compare(password, password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 生成 tokens
    const accessToken = jwt.sign({ accountId, email }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ accountId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // 存储 refresh token
    const tokenId = uuidv4();
    await pool.query(
      'INSERT INTO refresh_tokens (id, account_id, token, is_revoked, expires_at, created_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL \'7 days\', NOW())',
      [tokenId, accountId, refreshToken, false]
    );

    res.json({
      accountId,
      email,
      name,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/auth/refresh
 * 刷新 token
 */
app.post(`${API_V1}/auth/refresh`, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Missing refresh token' });
    }

    // 验证 refresh token
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { accountId: string };

      // 检查 token 是否已撤销
      const tokenResult = await pool.query('SELECT is_revoked FROM refresh_tokens WHERE token = $1', [refreshToken]);
      if (tokenResult.rows.length === 0 || tokenResult.rows[0].is_revoked) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // 获取账户信息
      const accountResult = await pool.query('SELECT email FROM accounts WHERE id = $1', [decoded.accountId]);
      if (accountResult.rows.length === 0) {
        return res.status(401).json({ error: 'Account not found' });
      }

      const email = accountResult.rows[0].email;

      // 生成新的 access token
      const newAccessToken = jwt.sign({ accountId: decoded.accountId, email }, JWT_SECRET, { expiresIn: '15m' });

      res.json({
        accessToken: newAccessToken,
      });
    } catch (error) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/auth/logout
 * 用户登出
 */
app.post(`${API_V1}/auth/logout`, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // 撤销 refresh token
      await pool.query('UPDATE refresh_tokens SET is_revoked = true WHERE token = $1', [refreshToken]);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/auth/forgot-password
 * 忘记密码
 */
app.post(`${API_V1}/auth/forgot-password`, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    // 检查账户是否存在
    const result = await pool.query('SELECT id FROM accounts WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // 出于安全考虑，不透露是否存在该邮箱
      return res.json({ message: 'If the email exists, a password reset link will be sent' });
    }

    // 生成重置 token
    const resetToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });

    // 保存重置请求
    const resetId = uuidv4();
    await pool.query(
      'INSERT INTO password_resets (id, email, token, is_used, expires_at, created_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL \'1 hour\', NOW())',
      [resetId, email, resetToken, false]
    );

    // 模拟发送邮件
    console.log(`[EMAIL] Password reset link sent to ${email}`);
    console.log(`[EMAIL] Reset token: ${resetToken}`);

    res.json({ message: 'Password reset link sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/auth/reset-password
 * 重置密码
 */
app.post(`${API_V1}/auth/reset-password`, async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Missing token or password' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // 验证 token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { email: string };

      // 检查 reset token 是否有效
      const resetResult = await pool.query(
        'SELECT id, is_used FROM password_resets WHERE token = $1 AND is_used = false',
        [token]
      );

      if (resetResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid or expired reset token' });
      }

      // 哈希新密码
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // 更新账户密码
      await pool.query('UPDATE accounts SET password_hash = $1, updated_at = NOW() WHERE email = $2', [
        passwordHash,
        decoded.email,
      ]);

      // 标记 reset token 为已使用
      await pool.query('UPDATE password_resets SET is_used = true WHERE id = $1', [resetResult.rows[0].id]);

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid reset token' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/auth/me
 * 获取当前用户信息 (需要 Bearer token)
 */
app.get(`${API_V1}/auth/me`, (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.slice(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { accountId: string; email: string };
      res.json({
        accountId: decoded.accountId,
        email: decoded.email,
      });
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 错误处理
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// 启动服务器
async function start() {
  try {
    // 测试数据库连接
    await pool.query('SELECT 1');
    console.log('✅ Database connected');

    app.listen(PORT, () => {
      console.log(`✅ Mock API server running on http://localhost:${PORT}`);
      console.log(`📍 Base URL: http://localhost:${PORT}${API_V1}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
