const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');

// In-memory cache for previews (1 hour TTL)
const previewCache = new Map();
const CACHE_TTL = 3600000;

// Extract metadata from HTML
const extractMetadata = (html, url) => {
  const getTag = (regex) => {
    const match = html.match(regex);
    return match ? match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim() : null;
  };

  const title = getTag(/<meta property="og:title" content="([^"]+)"/) ||
                getTag(/<meta name="twitter:title" content="([^"]+)"/) ||
                getTag(/<title>([^<]+)<\/title>/) ||
                url;

  const description = getTag(/<meta property="og:description" content="([^"]+)"/) ||
                      getTag(/<meta name="twitter:description" content="([^"]+)"/) ||
                      getTag(/<meta name="description" content="([^"]+)"/);

  const image = getTag(/<meta property="og:image" content="([^"]+)"/) ||
                getTag(/<meta name="twitter:image" content="([^"]+)"/);

  return { title, description, image, url };
};

// Fetch URL content
const fetchUrl = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout: 5000 }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode}`));
      }
      
      let data = '';
      res.on('data', chunk => {
        data += chunk;
        if (data.length > 500000) { // 500KB limit
          req.destroy();
          reject(new Error('Response too large'));
        }
      });
      res.on('end', () => resolve(data));
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
};

// GET /api/link-preview?url=...
router.get('/', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ message: 'URL required' });
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ message: 'Invalid URL' });
  }

  // Check cache
  const cached = previewCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json({ success: true, data: cached.data });
  }

  try {
    const html = await fetchUrl(url);
    const metadata = extractMetadata(html, url);
    
    // Cache result
    previewCache.set(url, { data: metadata, timestamp: Date.now() });
    
    res.json({ success: true, data: metadata });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch preview', error: error.message });
  }
});

module.exports = router;
