import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

const db = new Database(process.env.DATABASE_URL || "database.sqlite");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'candidate',
    title TEXT,
    location TEXT,
    bio TEXT,
    skills TEXT,
    experience TEXT,
    education TEXT,
    avatar_url TEXT
  );

  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    logo_url TEXT,
    description TEXT,
    industry TEXT,
    employee_count TEXT,
    location TEXT
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    title TEXT,
    location TEXT,
    type TEXT,
    salary TEXT,
    description TEXT,
    requirements TEXT,
    translations TEXT,
    posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS saved_jobs (
    user_id INTEGER,
    job_id INTEGER,
    PRIMARY KEY(user_id, job_id)
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    job_id INTEGER,
    status TEXT DEFAULT 'sent',
    message TEXT,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(job_id) REFERENCES jobs(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    job_id INTEGER,
    content TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  // Initial seed
  db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run(
    "alan.aa@me.com", "Pkjuhnkp0897", "Alan Ahmad", "admin"
  );
  db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run(
    "alanpool50@yahoo.com", "password123", "Alan Pool", "candidate"
  );
} else {
  // Ensure admin exists
  const admin = db.prepare("SELECT * FROM users WHERE email = ?").get("alan.aa@me.com");
  if (!admin) {
    db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run(
      "alan.aa@me.com", "Pkjuhnkp0897", "Alan Ahmad", "admin"
    );
  }
  // Ensure test user exists
  const testUser = db.prepare("SELECT * FROM users WHERE email = ?").get("alanpool50@yahoo.com");
  if (!testUser) {
    db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run(
      "alanpool50@yahoo.com", "password123", "Alan Pool", "candidate"
    );
  }
}

const jobCount = db.prepare("SELECT COUNT(*) as count FROM jobs").get() as { count: number };
if (jobCount.count === 0) {
  db.prepare("INSERT INTO companies (name, description, industry, location) VALUES (?, ?, ?, ?)").run(
    "TechCorp", "Leading tech company", "Technology", "London"
  );
  db.prepare("INSERT INTO jobs (company_id, title, location, type, salary, description) VALUES (?, ?, ?, ?, ?, ?)").run(
    1, "Software Engineer", "Remote", "Full Time", "£60k - £80k", "We are looking for a skilled developer..."
  );
  db.prepare("INSERT INTO jobs (company_id, title, location, type, salary, description) VALUES (?, ?, ?, ?, ?, ?)").run(
    1, "Product Designer", "London", "Full Time", "£50k - £70k", "Join our creative team..."
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      console.log(`Login successful for: ${email}`);
      res.json(user);
    } else {
      console.log(`Login failed for: ${email}`);
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Admin Dynamic API
  app.get("/api/admin/tables", (req, res) => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    res.json(tables.map((t: any) => t.name));
  });

  app.get("/api/admin/tables/:name", (req, res) => {
    const tableName = req.params.name;
    // Basic SQL injection protection for table names (only allow alphanumeric and underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return res.status(400).json({ error: "Invalid table name" });
    }
    const data = db.prepare(`SELECT * FROM ${tableName}`).all();
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    res.json({ data, columns });
  });

  app.delete("/api/admin/tables/:name/:id", (req, res) => {
    const { name, id } = req.params;
    if (!/^[a-zA-Z0-9_]+$/.test(name)) return res.status(400).json({ error: "Invalid table name" });
    db.prepare(`DELETE FROM ${name} WHERE id = ?`).run(id);
    res.json({ success: true });
  });

  app.get("/api/admin/analytics", (req, res) => {
    const stats = {
      totalUsers: (db.prepare("SELECT COUNT(*) as count FROM users").get() as any).count,
      totalJobs: (db.prepare("SELECT COUNT(*) as count FROM jobs").get() as any).count,
      totalApplications: (db.prepare("SELECT COUNT(*) as count FROM applications").get() as any).count,
      totalCompanies: (db.prepare("SELECT COUNT(*) as count FROM companies").get() as any).count,
      recentApplications: db.prepare(`
        SELECT applications.*, jobs.title as job_title, users.name as user_name 
        FROM applications 
        JOIN jobs ON applications.job_id = jobs.id 
        JOIN users ON applications.user_id = users.id 
        ORDER BY applied_at DESC LIMIT 5
      `).all()
    };
    res.json(stats);
  });

  // API Routes
  app.get("/api/jobs", (req, res) => {
    const jobs = db.prepare(`
      SELECT jobs.*, companies.name as company_name, companies.logo_url as company_logo 
      FROM jobs 
      JOIN companies ON jobs.company_id = companies.id
      ORDER BY posted_at DESC
    `).all();
    res.json(jobs);
  });

  app.get("/api/jobs/:id", (req, res) => {
    const job = db.prepare(`
      SELECT jobs.*, companies.name as company_name, companies.logo_url as company_logo, companies.description as company_description
      FROM jobs 
      JOIN companies ON jobs.company_id = companies.id
      WHERE jobs.id = ?
    `).get(req.params.id);
    res.json(job);
  });

  app.post("/api/applications", (req, res) => {
    const { user_id, job_id, message } = req.body;
    const result = db.prepare("INSERT INTO applications (user_id, job_id, message) VALUES (?, ?, ?)").run(user_id, job_id, message);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/users/:id/applications", (req, res) => {
    const apps = db.prepare(`
      SELECT applications.*, jobs.title as job_title, companies.name as company_name
      FROM applications
      JOIN jobs ON applications.job_id = jobs.id
      JOIN companies ON jobs.company_id = companies.id
      WHERE applications.user_id = ?
    `).all(req.params.id);
    res.json(apps);
  });

  app.get("/api/users/:id/saved", (req, res) => {
    const saved = db.prepare(`
      SELECT jobs.*, companies.name as company_name
      FROM saved_jobs
      JOIN jobs ON saved_jobs.job_id = jobs.id
      JOIN companies ON jobs.company_id = companies.id
      WHERE saved_jobs.user_id = ?
    `).all(req.params.id);
    res.json(saved);
  });

  app.post("/api/saved_jobs", (req, res) => {
    const { user_id, job_id } = req.body;
    try {
      db.prepare("INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)").run(user_id, job_id);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Already saved" });
    }
  });

  app.delete("/api/saved_jobs/:user_id/:job_id", (req, res) => {
    const { user_id, job_id } = req.params;
    db.prepare("DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?").run(user_id, job_id);
    res.json({ success: true });
  });

  app.post("/api/jobs", (req, res) => {
    const { company_id, title, location, type, salary, description, requirements, translations } = req.body;
    const result = db.prepare(`
      INSERT INTO jobs (company_id, title, location, type, salary, description, requirements, translations) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(company_id || 1, title, location, type, salary, description, requirements, translations);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/messages/:user_id", (req, res) => {
    const messages = db.prepare(`
      SELECT messages.*, users.name as sender_name 
      FROM messages 
      JOIN users ON messages.sender_id = users.id 
      WHERE receiver_id = ? OR sender_id = ?
      ORDER BY sent_at DESC
    `).all(req.params.user_id, req.params.user_id);
    res.json(messages);
  });

  app.post("/api/messages", (req, res) => {
    const { sender_id, receiver_id, content, job_id } = req.body;
    const result = db.prepare("INSERT INTO messages (sender_id, receiver_id, content, job_id) VALUES (?, ?, ?, ?)").run(sender_id, receiver_id, content, job_id);
    res.json({ id: result.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
