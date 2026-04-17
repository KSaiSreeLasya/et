import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'database.sqlite');
// If the database is temporarily locked (concurrent requests), don't wait forever.
// better-sqlite3's `timeout` controls how long it waits for locks.
const db = new Database(dbPath, { verbose: console.log, timeout: 5000 });

// Defensive: also set SQLite busy timeout explicitly.
// This avoids long hangs that can surface as client-side request timeouts.
db.exec('PRAGMA busy_timeout = 5000;');

// Initialize database schema
console.log('[DB] Initializing schema...');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'employee')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')) NOT NULL,
    status TEXT CHECK(status IN ('Pending', 'In Progress', 'Completed')) DEFAULT 'Pending',
    deadline DATETIME,
    assigned_to INTEGER,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK(category IN ('Technical', 'HR', 'Other')) NOT NULL,
    priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')) NOT NULL,
    status TEXT CHECK(status IN ('Open', 'In Progress', 'Resolved', 'Closed')) DEFAULT 'Open',
    raised_by INTEGER,
    assigned_to INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (raised_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    ticket_id INTEGER,
    user_id INTEGER,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);
console.log('[DB] Schema initialized.');

// Seed default admin if not exists
console.log('[DB] Checking for admin user...');
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  console.log('[DB] Creating default admin user...');
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
    .run('System Admin', 'admin@taskflow.com', hashedPassword, 'admin');
  console.log('[DB] Default admin created: admin@taskflow.com / admin123');
} else {
  console.log('[DB] Admin user already exists.');
}

export default db;
