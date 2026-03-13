import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();
const db = new Database(process.env.DATABASE_URL || "database.sqlite");

// --- 1. Initialize Enhanced Database Schema ---
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
    avatar_url TEXT,
    preferred_lang TEXT DEFAULT 'en'
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

  CREATE TABLE IF NOT EXISTS countries (
    country_code TEXT PRIMARY KEY,
    country_name TEXT,
    region TEXT,
    currency TEXT,
    timezone TEXT
  );

  CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY,
    name TEXT,
    country_code TEXT,
    region TEXT,
    latitude REAL,
    longitude REAL,
    population INTEGER
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    title TEXT,
    location TEXT, -- Descriptive location (e.g. "Erbil, Kurdistan")
    country_code TEXT,
    city_id INTEGER,
    latitude REAL,
    longitude REAL,
    type TEXT,
    salary TEXT,
    description TEXT,
    requirements TEXT,
    translations TEXT,
    posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(company_id) REFERENCES companies(id)
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

  CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);
  CREATE INDEX IF NOT EXISTS idx_jobs_coords ON jobs(latitude, longitude);
`);

// --- 2. Geospatial Logic (Haversine Formula) ---
// Returns distance in km
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());

  // --- 3. Location & Search APIs ---

  // Global City Autocomplete
  app.get("/api/locations/cities", (req, res) => {
    const { q } = req.query;
    if (!q || String(q).length < 2) return res.json([]);
    const matches = db.prepare(`
      SELECT cities.*, countries.country_name 
      FROM cities 
      JOIN countries ON cities.country_code = countries.country_code
      WHERE cities.name LIKE ? 
      ORDER BY population DESC LIMIT 10
    `).all(`${q}%`);
    res.json(matches);
  });

  // Get All Countries (for settings selector)
  app.get("/api/locations/countries", (req, res) => {
    const countries = db.prepare("SELECT * FROM countries ORDER BY country_name ASC").all();
    res.json(countries);
  });

  // Jobs Near You Feed
  app.get("/api/jobs/nearby", (req, res) => {
    const { lat, lon, radius = 50 } = req.query;
    const userLat = parseFloat(lat as string);
    const userLon = parseFloat(lon as string);
    const rad = parseFloat(radius as string);

    if (isNaN(userLat) || isNaN(userLon)) {
      return res.status(400).json({ error: "Coordinates required for nearby jobs" });
    }

    const allJobs = db.prepare(`
      SELECT jobs.*, companies.name as company_name, companies.logo_url as company_logo 
      FROM jobs 
      JOIN companies ON jobs.company_id = companies.id
    `).all();

    const nearbyJobs = (allJobs as any[])
      .map(job => ({
        ...job,
        distance: job.latitude ? getDistance(userLat, userLon, job.latitude, job.longitude) : null
      }))
      .filter(job => job.distance !== null && job.distance <= rad)
      .sort((a, b) => a.distance - b.distance);

    res.json(nearbyJobs);
  });

  // --- 4. Existing Job & Auth APIs (Updated) ---

  app.get("/api/jobs", (req, res) => {
    const { remote } = req.query;
    let query = `
      SELECT jobs.*, companies.name as company_name, companies.logo_url as company_logo 
      FROM jobs 
      JOIN companies ON jobs.company_id = companies.id
    `;
    if (remote === 'true') query += " WHERE jobs.type = 'Remote'";
    query += " ORDER BY posted_at DESC";
    
    const jobs = db.prepare(query).all();
    res.json(jobs);
  });

  app.post("/api/jobs", (req, res) => {
    const { 
      company_id, title, location, type, salary, 
      description, requirements, translations,
      country_code, city_id, latitude, longitude 
    } = req.body;

    const result = db.prepare(`
      INSERT INTO jobs (company_id, title, location, type, salary, description, requirements, translations, country_code, city_id, latitude, longitude) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(company_id || 1, title, location, type, salary, description, requirements, translations, country_code, city_id, latitude, longitude);
    
    res.json({ id: result.lastInsertRowid });
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) res.json(user);
    else res.status(401).json({ error: "Invalid credentials" });
  });

  // --- Admin APIs (Kept for your management dashboard) ---
  app.get("/api/admin/tables", (req, res) => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    res.json(tables.map((t: any) => t.name));
  });

  app.get("/api/admin/tables/:name", (req, res) => {
    const tableName = req.params.name;
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) return res.status(400).json({ error: "Invalid table name" });
    const data = db.prepare(`SELECT * FROM ${tableName}`).all();
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    res.json({ data, columns });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Workinger Server running on http://localhost:${PORT}`);
  });
}

startServer();
