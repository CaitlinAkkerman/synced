import express from 'express';
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

router.get('/', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.userId;

  db.get(
    'SELECT * FROM households WHERE userId = ?',
    [userId],
    (err, household) => {
      if (err || !household) {
        return res.status(500).json({ message: 'Failed to find household' });
      }

      db.all(
        'SELECT * FROM profiles WHERE householdId = ? ORDER BY createdAt DESC',
        [household.id],
        (err, profiles) => {
          if (err) {
            return res.status(500).json({ message: 'Failed to fetch profiles' });
          }

          const profilesWithData = profiles.map(profile => {
            return new Promise((resolve) => {
              db.get(
                'SELECT * FROM logs WHERE profileId = ? ORDER BY date DESC LIMIT 1',
                [profile.id],
                (err, lastLog) => {
                  resolve({
                    ...profile,
                    lastLogged: lastLog ? lastLog.date : null,
                    endDate: lastLog ? lastLog.flow : null,
                    cycleStatus: lastLog ? (lastLog.type === 'period' ? 'Menstruating' : 'Tracking') : 'No data'
                  });
                }
              );
            });
          });

          Promise.all(profilesWithData).then(results => {
            res.json({
              id: household.id,
              userId: household.userId,
              name: household.name,
              profiles: results,
              memberCount: results.length
            });
          });
        }
      );
    }
  );
});

export default router;