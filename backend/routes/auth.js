import express from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

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

export default router;