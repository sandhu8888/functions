const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const { URL } = require('url');
const puppeteer = require('puppeteer');

const SITE_URL = process.env.SITE_URL || 'https://www.naseemperfume.com';
const OUTPUT_DIR = process.env.OUTPUT_DIR
  ? path.resolve(process.env.OUTPUT_DIR)
  : path.join(__dirname, 'images');

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        downloadFile(new URL(res.headers.location, url).href, destPath).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(destPath)));
      file.on('error', reject);
    });

    request.on('error', reject);
  });
}

function safeFilename(url, index) {
  const parsed = new URL(url);
  const base = path.basename(parsed.pathname) || `image-${index}`;
  const ext = path.extname(base) || '.jpg';
  const stem = path.basename(base, ext).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  return `${String(index).padStart(3, '0')}-${stem}${ext}`;
}

async function collectImageUrls(pageUrl) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    return page.evaluate(() => {
      const urls = new Set();

      for (const img of document.querySelectorAll('img')) {
        if (img.src) urls.add(img.src);
        if (img.dataset?.src) urls.add(img.dataset.src);
        if (img.srcset) {
          for (const part of img.srcset.split(',')) {
            const src = part.trim().split(/\s+/)[0];
            if (src) urls.add(src);
          }
        }
      }

      return [...urls];
    });
  } finally {
    await browser.close();
  }
}

function toAbsoluteImageUrls(imageUrls, siteUrl) {
  return [
    ...new Set(
      imageUrls
        .map((src) => {
          try {
            return new URL(src, siteUrl).href;
          } catch {
            return null;
          }
        })
        .filter((url) => url && !url.startsWith('data:')),
    ),
  ];
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const imageUrls = await collectImageUrls(SITE_URL);
  const absoluteUrls = toAbsoluteImageUrls(imageUrls, SITE_URL);

  console.log(`Found ${absoluteUrls.length} image(s)`);

  for (let i = 0; i < absoluteUrls.length; i += 1) {
    const url = absoluteUrls[i];
    const dest = path.join(OUTPUT_DIR, safeFilename(url, i + 1));

    try {
      await downloadFile(url, dest);
      console.log(`Saved: ${dest}`);
    } catch (err) {
      console.warn(`Skip ${url}: ${err.message}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
