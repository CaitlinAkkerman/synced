import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const router = express.Router();

// POST - Create a new log entry
router.post('/', (req, res) => {

  console.log('POST /api/logs received');
  console.log('Body:', req.body)

  const { profileId, startDate, endDate, type, symptoms, notes, intensity } = req.body;
  const db = req.db;
  const logId = uuidv4();

  console.log('profileId:', profileId);
  console.log('startDate:', startDate);

  if (!profileId || !startDate) {
    console.log('MISSING FIELDS!');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Insert the log entry
  db.run(
    'INSERT INTO logs (id, profileId, date, type, flow, intensity, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [logId, profileId, startDate, type || 'period', endDate || null, intensity || null, notes || ''],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to create log' });
      }

      // Insert symptoms if provided
      if (symptoms && symptoms.length > 0) {
        symptoms.forEach(symptom => {
          db.run(
            'INSERT INTO log_symptoms (logId, symptom) VALUES (?, ?)',
            [logId, symptom],
            (err) => {
              if (err) console.error('Error inserting symptom:', err);
            }
          );
        });
      }

      // Update profile's lastLogged and endDate
      db.run(
        'UPDATE profiles SET lastLogged = ?, endDate = ? WHERE id = ?',
        [startDate, endDate || null, profileId],
        (err) => {
          if (err) console.error('Error updating profile:', err);
        }
      );

      res.json({
        id: logId,
        profileId,
        date: startDate,
        type,
        flow: endDate,
        intensity: intensity || null,
        symptoms,
        notes
      });
    }
  );
});

// GET - Retrieve logs for a specific profile
router.get('/profile/:profileId', (req, res) => {
  const { profileId } = req.params;
  const db = req.db;

  db.all(
    'SELECT * FROM logs WHERE profileId = ? ORDER BY date DESC',
    [profileId],
    (err, logs) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to fetch logs' });
      }

      // Fetch symptoms for each log
      const logsWithSymptoms = logs.map(log => {
        return new Promise((resolve) => {
          db.all(
            'SELECT symptom FROM log_symptoms WHERE logId = ?',
            [log.id],
            (err, symptoms) => {
              resolve({
                ...log,
                symptoms: symptoms ? symptoms.map(s => s.symptom) : []
              });
            }
          );
        });
      });

      Promise.all(logsWithSymptoms).then(result => {
        res.json(result);
      });
    }
  );
});

// GET - Retrieve a specific log by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const db = req.db;

  db.get(
    'SELECT * FROM logs WHERE id = ?',
    [id],
    (err, log) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to fetch log' });
      }

      if (!log) {
        return res.status(404).json({ message: 'Log not found' });
      }

      // Fetch symptoms
      db.all(
        'SELECT symptom FROM log_symptoms WHERE logId = ?',
        [id],
        (err, symptoms) => {
          res.json({
            ...log,
            symptoms: symptoms ? symptoms.map(s => s.symptom) : []
          });
        }
      );
    }
  );
});

// PUT - Update an existing log entry
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, type, symptoms, notes, intensity } = req.body;
  const db = req.db;

  if (!startDate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // First get the log to find the profileId
  db.get(
    'SELECT profileId FROM logs WHERE id = ?',
    [id],
    (err, log) => {
      if (err || !log) {
        return res.status(404).json({ message: 'Log not found' });
      }

      const profileId = log.profileId;

      // Update the log entry
      db.run(
        'UPDATE logs SET date = ?, type = ?, flow = ?, intensity = ?, notes = ? WHERE id = ?',
        [startDate, type || 'period', endDate || null, intensity || null, notes || '', id],
        (err) => {
          if (err) {
            return res.status(500).json({ message: 'Failed to update log' });
          }

          // Delete existing symptoms
          db.run(
            'DELETE FROM log_symptoms WHERE logId = ?',
            [id],
            (err) => {
              // Insert new symptoms
              if (symptoms && symptoms.length > 0) {
                symptoms.forEach(symptom => {
                  db.run(
                    'INSERT INTO log_symptoms (logId, symptom) VALUES (?, ?)',
                    [id, symptom],
                    (err) => {
                      if (err) console.error('Error inserting symptom:', err);
                    }
                  );
                });
              }

              // Update profile's lastLogged and endDate
              db.run(
                'UPDATE profiles SET lastLogged = ?, endDate = ? WHERE id = ?',
                [startDate, endDate || null, profileId],
                (err) => {
                  if (err) console.error('Error updating profile:', err);
                }
              );

              res.json({
                id,
                profileId,
                date: startDate,
                type,
                flow: endDate,
                intensity: intensity || null,
                symptoms,
                notes
              });
            }
          );
        }
      );
    }
  );
});

// DELETE - Delete a log entry
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = req.db;

  // Delete symptoms first
  db.run(
    'DELETE FROM log_symptoms WHERE logId = ?',
    [id],
    (err) => {
      // Then delete the log
      db.run(
        'DELETE FROM logs WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Failed to delete log' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ message: 'Log not found' });
          }

          res.json({ message: 'Log deleted successfully' });
        }
      );
    }
  );
});

export default router;