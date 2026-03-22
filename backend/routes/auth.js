import express from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const router = express.Router();

const getTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  }
});

router.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  const db = req.db;
  const JWT_SECRET = req.JWT_SECRET;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const hashedPassword = bcryptjs.hashSync(password, 10);
  const userId = uuidv4();
  const householdId = uuidv4();

  db.run('INSERT INTO users (id, email, name, password) VALUES (?, ?, ?, ?)',
    [userId, email, name, hashedPassword],
    function(err) {
      if (err) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      db.run('INSERT INTO households (id, userId, name) VALUES (?, ?, ?)',
        [householdId, userId, name + '\'s Household']);

      const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        user: { id: userId, email, name },
        token
      });
    }
  );
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = req.db;
  const JWT_SECRET = req.JWT_SECRET;

  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = bcryptjs.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  });
});

router.post('/demo', (req, res) => {
  const JWT_SECRET = req.JWT_SECRET;
  const token = jwt.sign({ userId: 'demo-user-123' }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    user: { id: 'demo-user-123', email: 'demo@example.com', name: 'Demo User' },
    token
  });
});

router.delete('/account', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  let userId;
  try {
    const decoded = jwt.verify(token, req.JWT_SECRET);
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // Block demo account deletion
  if (userId === 'demo-user-123') {
    return res.status(403).json({ message: "Can't delete the demo account, nice try 😄" });
  }

  const db = req.db;

  db.serialize(() => {
    // Delete in order: symptoms → logs → profiles → household → user
    db.run(`
      DELETE FROM log_symptoms WHERE logId IN (
        SELECT l.id FROM logs l
        JOIN profiles p ON l.profileId = p.id
        JOIN households h ON p.householdId = h.id
        WHERE h.userId = ?
      )
    `, [userId]);

    db.run(`
      DELETE FROM logs WHERE profileId IN (
        SELECT p.id FROM profiles p
        JOIN households h ON p.householdId = h.id
        WHERE h.userId = ?
      )
    `, [userId]);

    db.run(`
      DELETE FROM profiles WHERE householdId IN (
        SELECT id FROM households WHERE userId = ?
      )
    `, [userId]);

    db.run('DELETE FROM households WHERE userId = ?', [userId]);

    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to delete account' });
      }
      res.json({ message: 'Account deleted' });
    });
  });
});

router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const db = req.db;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) {
      // Don't reveal if email exists — just say it's sent
      return res.json({ message: 'If that email exists, a reset link is on its way.' });
    }

    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour

    db.run(
      'INSERT INTO password_resets (token, userId, expiresAt) VALUES (?, ?, ?)',
      [resetToken, user.id, expiresAt],
      async (err) => {
        if (err) return res.status(500).json({ message: 'Failed to generate reset token' });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetLink = `${frontendUrl}?reset_token=${resetToken}`;

        try {
          const transporter = getTransporter();
          await transporter.sendMail({
            from: `"Synced" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Reset your Synced password',
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
                <h2 style="color: #ff006e;">Reset your password</h2>
                <p>Someone (hopefully you) requested a password reset for your Synced account.</p>
                <p style="margin: 1.5rem 0;">
                  <a href="${resetLink}" style="background: linear-gradient(90deg, #ff006e, #ff1493); color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    Reset Password
                  </a>
                </p>
                <p style="color: #888; font-size: 0.85rem;">This link expires in 1 hour. If you didn't request this, ignore this email and carry on.</p>
              </div>
            `
          });
        } catch (emailErr) {
          console.error('Email send failed:', emailErr);
          // Still return success so we don't reveal email existence
        }

        res.json({ message: 'If that email exists, a reset link is on its way.' });
      }
    );
  });
});

router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  const db = req.db;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  db.get('SELECT * FROM password_resets WHERE token = ?', [token], (err, reset) => {
    if (err || !reset) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    if (new Date(reset.expiresAt) < new Date()) {
      db.run('DELETE FROM password_resets WHERE token = ?', [token]);
      return res.status(400).json({ message: 'Reset link has expired. Please request a new one.' });
    }

    const hashedPassword = bcryptjs.hashSync(newPassword, 10);

    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, reset.userId], (err) => {
      if (err) return res.status(500).json({ message: 'Failed to update password' });

      db.run('DELETE FROM password_resets WHERE userId = ?', [reset.userId]);
      res.json({ message: 'Password updated successfully!' });
    });
  });
});

export default router;