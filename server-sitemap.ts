app.get("/sitemap.xml", (req, res) => {
  const jobs = db.prepare("SELECT id FROM jobs").all();
  const cities = db.prepare("SELECT name FROM cities WHERE population > 50000").all();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add Job Pages
  jobs.forEach(job => {
    xml += `<url><loc>https://workinger.app/jobs/${job.id}</loc></url>`;
  });

  // Add City Pages (SEO Goldmine)
  cities.forEach(city => {
    xml += `<url><loc>https://workinger.app/jobs-in-${city.name.toLowerCase()}</loc></url>`;
  });

  xml += `</urlset>`;
  res.header('Content-Type', 'application/xml');
  res.send(xml);
});
