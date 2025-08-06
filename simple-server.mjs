import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = 8080;
const ROOT = join(__dirname, 'bounder_clone');

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

const server = createServer(async (req, res) => {
  try {
    let filePath = join(ROOT, req.url === '/' ? 'index.html' : req.url);
    
    // Handle routes without .html extension
    if (!extname(filePath)) {
      const routes = {
        '/contact': 'contact.html',
        '/privacy': 'privacy.html',
        '/new-page': 'new-page.html',
        '/gallery-shift': 'gallery-shift.html',
        '/ride-to-live-shift': 'ride-to-live-shift.html',
        '/intro': 'intro.html'
      };
      filePath = join(ROOT, routes[req.url] || 'index.html');
    }
    
    const content = await readFile(filePath);
    const ext = extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Try to serve 404.html
      try {
        const content = await readFile(join(ROOT, '404.html'));
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not Found');
      }
    } else {
      res.writeHead(500);
      res.end('Server Error');
    }
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});