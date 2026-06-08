# Image Scraper

Downloads all image URLs found on a target page with Puppeteer.

## Usage

```bash
npm install
npm start
```

By default, the scraper reads `https://www.naseemperfume.com` and writes downloaded files to `images/`.

Use environment variables to override the target site or output directory:

```bash
SITE_URL="https://example.com" OUTPUT_DIR="./images/example" npm start
```
