import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import logRoutes from './routes/logs.js';
import householdRoutes from './routes/household.js';
import exportRoutes from './routes/export.js';

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: [
    'https://cyclepsychos.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
  console.log('Incoming request:');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Headers:', req.headers);
  next();
});


app.use(express.json());

// Database setup
const dbPath = process.env.DATABASE_PATH || './database.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Households table
    db.run(`
      CREATE TABLE IF NOT EXISTS households (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);

    // Profiles table
    db.run(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        householdId TEXT NOT NULL,
        name TEXT NOT NULL,
        age INTEGER,
        role TEXT DEFAULT 'daughter',
        cycleLength INTEGER DEFAULT 28,
        periodLength INTEGER DEFAULT 5,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(householdId) REFERENCES households(id)
      )
    `);

    // Logs table
    db.run(`
      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        profileId TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        flow TEXT,
        intensity TEXT,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(profileId) REFERENCES profiles(id)
      )
    `);

    // Migration: Add intensity column if it doesn't exist (for existing databases)
    db.run(`ALTER TABLE logs ADD COLUMN intensity TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.log('Note: intensity column may already exist');
      }
    });

    // Log symptoms junction table
    db.run(`
      CREATE TABLE IF NOT EXISTS log_symptoms (
        logId TEXT NOT NULL,
        symptom TEXT NOT NULL,
        FOREIGN KEY(logId) REFERENCES logs(id)
      )
    `);

    console.log('Database initialized');
    createDemoAccount();
  });
}

db.run(`
  CREATE TABLE IF NOT EXISTS password_resets (
    token TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    expiresAt DATETIME NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id)
  )
`);

function createDemoAccount() {
  const demoUserId = 'demo-user-123';
  const householdId = 'demo-household-123';
  
  const hashedPassword = bcryptjs.hashSync('demo123', 10);

  db.run('INSERT OR IGNORE INTO users VALUES (?, ?, ?, ?, datetime("now"))', 
    [demoUserId, 'demo@example.com', 'Demo User', hashedPassword]);

  db.run('INSERT OR IGNORE INTO households VALUES (?, ?, ?, datetime("now"))', 
    [householdId, demoUserId, 'Demo Household']);

  db.run('INSERT OR IGNORE INTO profiles VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"), ?)', 
    ['demo-profile-mom', householdId, 'Caitlin Akkerman', 40, 'mother', 28, 5, '🌸']);
 
  db.run('INSERT OR IGNORE INTO profiles VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"), ?)', 
    ['demo-profile-daughter', householdId, 'Ayden Erhart', 14, 'daughter', 28, 5, '🌸']);
}

// Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    req.db = db;
    req.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Pass db to routes
app.use((req, res, next) => {
  req.db = db;
  req.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/household', householdRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`Demo account: demo@example.com / demo123`);
});