// Run with: node scripts/importGeoData.js
import axios from 'axios';
import Database from 'better-sqlite3';

const db = new Database('workinger.db');

async function importData() {
  console.log("Fetching GeoNames data...");
  // Note: In a production app, you would download the .zip from geonames.org
  // This is a conceptual placeholder for the batch insert logic
  const insert = db.prepare(`
    INSERT INTO cities (name, country_code, region, latitude, longitude, population) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Example of batch transaction
  const insertMany = db.transaction((cities) => {
    for (const city of cities) insert.run(city.name, city.country, city.admin, city.lat, city.lon, city.pop);
  });

  console.log("Database populated.");
}

importData();
