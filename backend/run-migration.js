// run-migration.js
// Run this ONCE on your backend to add the emoji column.
// Example: node run-migration.js

import Database from 'better-sqlite3'; // or however you init your db
import path from 'path';

// Update this path to wherever your SQLite file lives
const db = new Database(path.resolve('./database.sqlite'));

try {
  db.exec(`ALTER TABLE profiles ADD COLUMN emoji TEXT DEFAULT '🌸'`);
  console.log('✅ Migration complete: emoji column added to profiles table');
} catch (err) {
  if (err.message.includes('duplicate column name')) {
    console.log('ℹ️ Column already exists — no action needed');
  } else {
    console.error('❌ Migration failed:', err.message);
  }
} finally {
  db.close();
}
