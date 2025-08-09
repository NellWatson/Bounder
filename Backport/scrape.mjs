import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'node:path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';

const ROOT   = 'https://www.slana.org';
const OUTDIR = './slana_clone';
const CONCURRENCY = 4;

// --- helpers --------------------------------------------------------------
const sleep = ms => new Promise(r => setTimeout(r, ms));
const urlToFile = u => {
  let p = new URL(u).pathname.replace(/\/$/, '/index');
  return path.join(OUTDIR, p.endsWith('.html') ? p : `${p}.html`);
};
const saveFile = async (filePath, data) => {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, data);
};

// --- main crawler ---------------------------------------------------------
const browser = await puppeteer.launch({headless: 'new'});
const page    = await browser.newPage();

const queue    = [ROOT];
const visited  = new Set();
const manifest = [];

const dlLimit  = pLimit(8);   // assets
const pgLimit  = pLimit(CONCURRENCY);   // pages

while (queue.length) {
  const url = queue.shift();
  if (visited.has(url)) continue;
  visited.add(url);

  await pgLimit(async () => {
    const p = await browser.newPage();
    await p.goto(url, {waitUntil: 'networkidle2', timeout: 45_000});
    await sleep(800);  // give Squarespace JS a moment

    const html = await p.content();
    const filePath = urlToFile(url);
    manifest.push({url, file: path.relative(OUTDIR, filePath)});
    await saveFile(filePath, html);

    // --- parse for new links & assets
    const $ = cheerio.load(html);
    $('a[href]').each((_, a) => {
      const href = $(a).attr('href');
      if (!href) return;
      const abs = new URL(href, url).href;
      if (abs.startsWith(ROOT)) queue.push(abs.split('#')[0]);
    });

    // assets
    const assetPromises = [];
    $('img[src], link[rel="stylesheet"][href], script[src]').each((_, el) => {
      const attr = el.tagName === 'LINK' ? 'href' : 'src';
      const src  = $(el).attr(attr);
      if (!src) return;
      const abs  = new URL(src, url).href;
      assetPromises.push(dlLimit(async () => {
        try {
          const res = await axios.get(abs, {responseType: 'arraybuffer'});
          const out = path.join(OUTDIR, 'assets', new URL(abs).pathname);
          await saveFile(out, res.data);
        } catch (e) { /* skip broken */ }
      }));
      // rewrite link to local
      const relPath = path.relative(path.dirname(filePath), path.join('assets', new URL(abs).pathname));
      $(el).attr(attr, relPath);
    });

    // Handle lazy-loaded images with data-src
    $('img[data-src]').each((_, img) => { 
      const dataSrc = $(img).attr('data-src');
      if (dataSrc) {
        $(img).attr('src', dataSrc);
        const abs = new URL(dataSrc, url).href;
        assetPromises.push(dlLimit(async () => {
          try {
            const res = await axios.get(abs, {responseType: 'arraybuffer'});
            const out = path.join(OUTDIR, 'assets', new URL(abs).pathname);
            await saveFile(out, res.data);
          } catch (e) { /* skip broken */ }
        }));
        // rewrite link to local
        const relPath = path.relative(path.dirname(filePath), path.join('assets', new URL(abs).pathname));
        $(img).attr('src', relPath);
      }
    });

    await Promise.all(assetPromises);
    // save HTML again with local asset paths
    await saveFile(filePath, $.html());

    await p.close();
    console.log('✓', url);
  });
}

await saveFile(path.join(OUTDIR, 'index.json'), JSON.stringify(manifest, null, 2));
await browser.close();
console.log(`Done. ${visited.size} pages saved → ${OUTDIR}`);