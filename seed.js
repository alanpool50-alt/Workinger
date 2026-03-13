import Database from 'better-sqlite3';
const db = new Database('database.sqlite');

// 1. Seed Countries
const insertCountry = db.prepare(`
  INSERT OR REPLACE INTO countries (country_code, country_name, region, currency, timezone)
  VALUES (?, ?, ?, ?, ?)
`);

insertCountry.run('IQ', 'Iraq', 'Middle East', 'IQD', 'Asia/Baghdad');
insertCountry.run('GB', 'United Kingdom', 'Europe', 'GBP', 'Europe/London');
insertCountry.run('AE', 'United Arab Emirates', 'Middle East', 'AED', 'Asia/Dubai');

// 2. Seed Sample Cities (with coordinates for distance testing)
const insertCity = db.prepare(`
  INSERT OR REPLACE INTO cities (id, name, country_code, latitude, longitude, population)
  VALUES (?, ?, ?, ?, ?, ?)
`);

insertCity.run(1, 'Erbil', 'IQ', 36.1912, 44.0091, 1600000);
insertCity.run(2, 'London', 'GB', 51.5074, -0.1278, 8900000);
insertCity.run(3, 'Dubai', 'AE', 25.2048, 55.2708, 3300000);

// 3. Seed Sample Jobs
const insertJob = db.prepare(`
  INSERT INTO jobs (company_id, title, location, country_code, latitude, longitude, type, salary, description)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const sampleJobs = [
  // ERBIL JOBS
  [1, 'Full Stack Developer', 'Erbil, Kurdistan', 'IQ', 36.1912, 44.0091, 'Full Time', '$2500 - $3500', 'Exciting role in the heart of Erbil.'],
  [1, 'Civil Engineer', 'Erbil, Iraq', 'IQ', 36.1850, 44.0100, 'Contract', '$4000', 'Infrastructure project near Empire World.'],
  [1, 'English Teacher', 'Erbil', 'IQ', 36.2000, 43.9900, 'Part Time', '$1200', 'Teach at a leading international school.'],
  
  // LONDON JOBS
  [2, 'UX Researcher', 'London, UK', 'GB', 51.5074, -0.1278, 'Remote', '£55k', 'Global tech firm looking for researchers.'],
  [2, 'Financial Analyst', 'Canary Wharf, London', 'GB', 51.5054, -0.0235, 'Full Time', '£70k', 'Banking sector role.'],
  [2, 'Marketing Manager', 'Soho, London', 'GB', 51.5130, -0.1300, 'Full Time', '£45k', 'Creative agency in central London.'],
  
  // DUBAI JOBS
  [3, 'Real Estate Agent', 'Dubai Marina', 'AE', 25.0819, 55.1367, 'Commission', 'AED 20k+', 'Luxury property sales.'],
  [3, 'Software Architect', 'Dubai Internet City', 'AE', 25.0945, 55.1550, 'Full Time', 'AED 35k', 'Cloud-based logistics platform.'],
  [3, 'Hospitality Manager', 'Palm Jumeirah', 'AE', 25.1124, 55.1390, 'Full Time', 'AED 15k', 'Five-star resort management.'],
  [3, 'Data Scientist', 'Downtown Dubai', 'AE', 25.1972, 55.2744, 'Full Time', 'AED 28k', 'AI-driven retail analytics.']
];

const seedJobs = db.transaction((jobs) => {
  for (const job of jobs) insertJob.run(...job);
});

seedJobs(sampleJobs);

console.log("✅ Database Seeded Successfully!");
console.log("Added 3 Countries, 3 Cities, and 10 Jobs.");
