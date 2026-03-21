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

// Helper to convert array to CSV
function convertToCSV(data, headers) {
  const csvRows = [];
  csvRows.push(headers.join(','));
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape values with commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// Export single profile data
router.get('/profile/:profileId', authMiddleware, (req, res) => {
  const { profileId } = req.params;
  const db = req.db;
  
  // Get profile info
  db.get(
    'SELECT p.*, h.name as householdName FROM profiles p JOIN households h ON p.householdId = h.id WHERE p.id = ? AND h.userId = ?',
    [profileId, req.userId],
    (err, profile) => {
      if (err || !profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      
      // Get all logs for this profile
      db.all(
        'SELECT * FROM logs WHERE profileId = ? ORDER BY date DESC',
        [profileId],
        (err, logs) => {
          if (err) {
            return res.status(500).json({ message: 'Failed to fetch logs' });
          }
          
          // Get symptoms for each log
          const logsWithSymptoms = logs.map(log => {
            return new Promise((resolve) => {
              db.all(
                'SELECT symptom FROM log_symptoms WHERE logId = ?',
                [log.id],
                (err, symptoms) => {
                  resolve({
                    ...log,
                    symptoms: symptoms ? symptoms.map(s => s.symptom).join('; ') : ''
                  });
                }
              );
            });
          });
          
          Promise.all(logsWithSymptoms).then(results => {
            const exportData = results.map(log => ({
              Date: log.date,
              Type: log.type,
              'Start Date': log.date,
              'End Date': log.flow || '',
              Intensity: log.intensity || '',
              Symptoms: log.symptoms,
              Notes: log.notes || ''
            }));
            
            const headers = ['Date', 'Type', 'Start Date', 'End Date', 'Intensity', 'Symptoms', 'Notes'];
            const csv = convertToCSV(exportData, headers);
            
            const filename = `${profile.name.replace(/\s+/g, '_')}_cycle_data.csv`;
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(csv);
          });
        }
      );
    }
  );
});

// Export entire household data
router.get('/household', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.userId;
  
  db.get(
    'SELECT * FROM households WHERE userId = ?',
    [userId],
    (err, household) => {
      if (err || !household) {
        return res.status(404).json({ message: 'Household not found' });
      }
      
      db.all(
        'SELECT * FROM profiles WHERE householdId = ?',
        [household.id],
        (err, profiles) => {
          if (err) {
            return res.status(500).json({ message: 'Failed to fetch profiles' });
          }
          
          const allLogs = [];
          let processedCount = 0;
          
          if (profiles.length === 0) {
            // No profiles, return empty CSV with headers
            const headers = ['Profile', 'Date', 'Type', 'Start Date', 'End Date', 'Intensity', 'Symptoms', 'Notes'];
            const csv = headers.join(',') + '\n';
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="household_cycle_data.csv"');
            return res.send(csv);
          }
          
          profiles.forEach(profile => {
            db.all(
              'SELECT * FROM logs WHERE profileId = ? ORDER BY date DESC',
              [profile.id],
              (err, logs) => {
                if (err) {
                  processedCount++;
                  return;
                }
                
                const logsWithSymptoms = logs.map(log => {
                  return new Promise((resolve) => {
                    db.all(
                      'SELECT symptom FROM log_symptoms WHERE logId = ?',
                      [log.id],
                      (err, symptoms) => {
                        resolve({
                          profile: profile.name,
                          date: log.date,
                          type: log.type,
                          startDate: log.date,
                          endDate: log.flow || '',
                          intensity: log.intensity || '',
                          symptoms: symptoms ? symptoms.map(s => s.symptom).join('; ') : '',
                          notes: log.notes || ''
                        });
                      }
                    );
                  });
                });
                
                Promise.all(logsWithSymptoms).then(results => {
                  allLogs.push(...results);
                  processedCount++;
                  
                  if (processedCount === profiles.length) {
                    // All profiles processed, sort by date and send CSV
                    allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    const exportData = allLogs.map(log => ({
                      Profile: log.profile,
                      Date: log.date,
                      Type: log.type,
                      'Start Date': log.startDate,
                      'End Date': log.endDate,
                      Intensity: log.intensity,
                      Symptoms: log.symptoms,
                      Notes: log.notes
                    }));
                    
                    const headers = ['Profile', 'Date', 'Type', 'Start Date', 'End Date', 'Intensity', 'Symptoms', 'Notes'];
                    const csv = convertToCSV(exportData, headers);
                    
                    res.setHeader('Content-Type', 'text/csv');
                    res.setHeader('Content-Disposition', 'attachment; filename="household_cycle_data.csv"');
                    res.send(csv);
                  }
                });
              }
            );
          });
        }
      );
    }
  );
});

export default router;