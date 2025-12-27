const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

router.get('/', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, message: 'URL required' });

    const response = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(response.data);

    const preview = {
      title: $('meta[property="og:title"]').attr('content') || $('title').text() || '',
      description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || '',
      url: url
    };

    res.json({ success: true, data: preview });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch preview' });
  }
});

module.exports = router;
