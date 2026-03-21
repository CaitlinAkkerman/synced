import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const router = express.Router();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, req.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

router.post('/', authMiddleware, (req, res) => {
  const { name, age, role, cycleLength, periodLength, emoji } = req.body;
  const db = req.db;
  const userId = req.userId;

  if (!name || !age) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  db.get('SELECT * FROM households WHERE userId = ?', [userId], (err, household) => {
    if (err || !household) {
      return res.status(500).json({ message: 'Failed to find household' });
    }

    const profileId = uuidv4();
    const profileEmoji = emoji || '🌸';

    db.run(
      'INSERT INTO profiles (id, householdId, name, age, role, cycleLength, periodLength, emoji) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [profileId, household.id, name, age, role || 'daughter', cycleLength || 28, periodLength || 5, profileEmoji],
      function(err) {
        if (err) {
          // If emoji column doesn't exist yet (migration), fall back to insert without it
          db.run(
            'INSERT INTO profiles (id, householdId, name, age, role, cycleLength, periodLength) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [profileId, household.id, name, age, role || 'daughter', cycleLength || 28, periodLength || 5],
            function(err2) {
              if (err2) {
                return res.status(500).json({ message: 'Failed to create profile' });
              }
              res.json({ id: profileId, name, age, role, cycleLength, periodLength, emoji: profileEmoji });
            }
          );
          return;
        }
        res.json({ id: profileId, name, age, role, cycleLength, periodLength, emoji: profileEmoji });
      }
    );
  });
});

router.get('/', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.userId;

  db.get('SELECT * FROM households WHERE userId = ?', [userId], (err, household) => {
    if (err || !household) {
      return res.status(500).json({ message: 'Failed to find household' });
    }

    db.all('SELECT * FROM profiles WHERE householdId = ?', [household.id], (err, profiles) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to fetch profiles' });
      }
      res.json(profiles);
    });
  });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.userId;
  const profileId = req.params.id;

  db.get(
    'SELECT p.* FROM profiles p JOIN households h ON p.householdId = h.id WHERE p.id = ? AND h.userId = ?',
    [profileId, userId],
    (err, profile) => {
      if (err || !profile) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      db.run('DELETE FROM profiles WHERE id = ?', [profileId], function(err) {
        if (err) {
          return res.status(500).json({ message: 'Failed to delete profile' });
        }
        res.json({ message: 'Profile deleted' });
      });
    }
  );
});

router.put('/:id', authMiddleware, (req, res) => {
  const { age, cycleLength, periodLength, emoji } = req.body;
  const db = req.db;
  const userId = req.userId;
  const profileId = req.params.id;

  db.get(
    'SELECT p.* FROM profiles p JOIN households h ON p.householdId = h.id WHERE p.id = ? AND h.userId = ?',
    [profileId, userId],
    (err, profile) => {
      if (err || !profile) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      db.run(
        'UPDATE profiles SET age = ?, cycleLength = ?, periodLength = ?, emoji = ? WHERE id = ?',
        [age, cycleLength, periodLength, emoji || profile.emoji || '🌸', profileId],
        function(err) {
          if (err) {
            // Fallback if emoji column doesn't exist yet
            db.run(
              'UPDATE profiles SET age = ?, cycleLength = ?, periodLength = ? WHERE id = ?',
              [age, cycleLength, periodLength, profileId],
              function(err2) {
                if (err2) {
                  return res.status(500).json({ message: 'Failed to update profile' });
                }
                res.json({ id: profileId, age, cycleLength, periodLength, message: 'Profile updated' });
              }
            );
            return;
          }

          res.json({
            id: profileId,
            age,
            cycleLength,
            periodLength,
            emoji: emoji || profile.emoji || '🌸',
            message: 'Profile updated'
          });
        }
      );
    }
  );
});

export default router;