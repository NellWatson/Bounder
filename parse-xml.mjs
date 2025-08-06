import fs from 'fs-extra';
import path from 'node:path';
import xml2js from 'xml2js';
import * as cheerio from 'cheerio';

const OUTDIR = './bounder_clone';
const XML_FILE = './Squarespace-Wordpress-Export-07-26-2025.xml';

const parser = new xml2js.Parser();

// Read and parse XML
const xmlContent = await fs.readFile(XML_FILE, 'utf-8');
const result = await parser.parseStringPromise(xmlContent);

const channel = result.rss.channel[0];
const items = channel.item || [];

// Create output directory
await fs.ensureDir(OUTDIR);

// HTML template for pages
const createHTMLPage = (title, content, isHomepage = false) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Bounder</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        nav {
            background: #f8f9fa;
            padding: 1rem;
            margin-bottom: 2rem;
        }
        nav ul {
            list-style: none;
            display: flex;
            gap: 2rem;
            justify-content: center;
        }
        nav a {
            text-decoration: none;
            color: #333;
            font-weight: 500;
        }
        nav a:hover {
            color: #007bff;
        }
        h1, h2, h3 {
            margin-bottom: 1rem;
        }
        h1 {
            color: #2c3e50;
        }
        .text-align-center {
            text-align: center;
        }
        .hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4rem 2rem;
            text-align: center;
            margin-bottom: 3rem;
        }
        .hero h1 {
            color: white;
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px;
        }
        .button:hover {
            background: #0056b3;
        }
        .button.secondary {
            background: #6c757d;
        }
        .button.secondary:hover {
            background: #545b62;
        }
        .form-wrapper {
            max-width: 600px;
            margin: 0 auto;
        }
        .field {
            margin-bottom: 1.5rem;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }
        input, textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
        }
        textarea {
            min-height: 120px;
            resize: vertical;
        }
        .newsletter-form {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 8px;
            margin: 2rem 0;
            text-align: center;
        }
        footer {
            background: #2c3e50;
            color: white;
            text-align: center;
            padding: 2rem;
            margin-top: 3rem;
        }
        footer a {
            color: #74b9ff;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        .video-wrapper {
            position: relative;
            padding-bottom: 56.25%;
            height: 0;
            overflow: hidden;
            margin: 2rem 0;
        }
        .video-wrapper iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <nav>
        <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/contact.html">Contact</a></li>
            <li><a href="/privacy.html">Privacy</a></li>
            <li><a href="/terms.html">Terms</a></li>
        </ul>
    </nav>
    ${isHomepage ? '<div class="hero">' : '<div class="container">'}
        ${content}
    ${isHomepage ? '</div>' : '</div>'}
    <footer>
        <p>&copy; 2025 Bounder. All rights reserved.</p>
        <p><a href="/privacy.html">Privacy Policy</a> | <a href="/terms.html">Terms & Conditions</a></p>
    </footer>
</body>
</html>`;
};

// Process each page from XML
const pages = new Map();

for (const item of items) {
  const postType = item['wp:post_type']?.[0];
  const status = item['wp:status']?.[0];
  
  // Only process published pages
  if (status !== 'publish' || postType !== 'page') continue;
  
  const title = item.title?.[0] || '';
  const link = item.link?.[0] || '';
  const content = item['content:encoded']?.[0] || '';
  const postName = item['wp:post_name']?.[0] || '';
  
  // Skip empty pages and shift template pages
  if (!content || postName.includes('-shift')) continue;
  
  // Parse the content to extract HTML
  const $ = cheerio.load(content);
  
  // Determine the filename
  let filename;
  if (link === '/intro' || postName === 'intro') {
    filename = 'index.html';  // Main page becomes index.html
  } else if (link === '/new-page' || postName === 'new-page') {
    filename = 'terms.html';  // Terms & Conditions
  } else if (postName === 'contact') {
    filename = 'contact.html';
  } else if (postName === 'privacy') {
    filename = 'privacy.html';
  } else {
    filename = `${postName}.html`;
  }
  
  pages.set(filename, {
    title,
    content: $.html(),
    isHomepage: filename === 'index.html'
  });
}

// Create HTML files
for (const [filename, pageData] of pages) {
  const htmlContent = createHTMLPage(pageData.title, pageData.content, pageData.isHomepage);
  const filePath = path.join(OUTDIR, filename);
  await fs.writeFile(filePath, htmlContent);
  console.log(`Created: ${filename}`);
}

// Create a simple 404 page for GitHub Pages
const notFoundContent = createHTMLPage('404 - Page Not Found', `
  <div class="text-align-center">
    <h1>404 - Page Not Found</h1>
    <p>Sorry, the page you're looking for doesn't exist.</p>
    <a href="/" class="button">Go Home</a>
  </div>
`);
await fs.writeFile(path.join(OUTDIR, '404.html'), notFoundContent);

console.log('XML parsing complete. Initial HTML structure created.');