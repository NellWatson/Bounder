import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 8080;

// Serve static files from bounder_clone directory
app.use(express.static(path.join(__dirname, 'bounder_clone')));

// Handle all routes by serving the appropriate HTML file
app.get('/:page(*)', (req, res) => {
  let page = req.params.page || 'index';
  
  // Map page names to HTML files
  const pageMap = {
    'contact': 'contact.html',
    'privacy': 'privacy.html',
    'new-page': 'new-page.html',
    'terms': 'new-page.html',
    'gallery-shift': 'gallery-shift.html',
    'ride-to-live-shift': 'ride-to-live-shift.html',
    'intro': 'intro.html',
    'index': 'index.html',
    '': 'index.html'
  };
  
  const htmlFile = pageMap[page] || '404.html';
  res.sendFile(path.join(__dirname, 'bounder_clone', htmlFile));
});

app.listen(PORT, () => {
  console.log(`
🚀 Bounder.io clone is running locally!
   
📍 URL: http://localhost:${PORT}
   
📄 Available pages:
   - http://localhost:${PORT}/                    (Homepage)
   - http://localhost:${PORT}/contact             (Contact)
   - http://localhost:${PORT}/privacy             (Privacy & Cookies)
   - http://localhost:${PORT}/new-page            (Terms & Conditions)
   - http://localhost:${PORT}/gallery-shift       (Gallery)
   - http://localhost:${PORT}/ride-to-live-shift  (Ride to Live)
   
Press Ctrl+C to stop the server
  `);
});