const Database = require('better-sqlite3');
const db = new Database('sqlite.db');
const stmt = db.prepare('INSERT INTO public_matches (id, host_id, datetime, end_datetime, fee, surface, skill_level, description, rules, refund_policy, status, attendees, waitlist_ids, slot_offers, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
try {
  stmt.run('test1', 'host1', new Date('2025-04-26T03:22:00.000Z'), new Date('2025-04-26T05:22:00.000Z'), 0, 'hard', 3, '', '', 'half', 'open', '[]', '[]', '[]', new Date().toISOString());
} catch(e) { console.log(e); }
const row = db.prepare('SELECT datetime, end_datetime FROM public_matches WHERE id = ?').get('test1');
console.log(row);
