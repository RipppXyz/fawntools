const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

// ============================================================
// 1. API IQC
// ============================================================
app.get('/api/iqc', async (req, res) => {
  const { text } = req.query;
  if (!text) {
    return res.status(400).json({ status: 'error', message: 'Text-nya diisi dulu bro!' });
  }
  const chatTime = req.query.chatTime || '12.20';
  const statusBarTime = req.query.statusBarTime || '12.20';
  const signalName = req.query.signalName || 'Telkomsel';
  const bubbleColor = req.query.bubbleColor || '#34C759';
  const menuColor = req.query.menuColor || '#1C1C1E';
  const textColor = req.query.textColor || '#FFFFFF';
  const fontName = req.query.fontName || 'Poppins';

  try {
    const response = await axios.get('https://anabot.my.id/api/maker/iqc', {
      params: { text, chatTime, statusBarTime, signalName, bubbleColor, menuColor, textColor, fontName, apikey: 'freeApikey' },
      responseType: 'arraybuffer',
      timeout: 15000
    });
    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (err) {
    console.error('IQC error:', err.message);
    res.status(500).json({ status: 'error', message: 'Gagal generate fake chat' });
  }
});

// ============================================================
// 2. API IMAGE SEARCH
// ============================================================
app.get('/api/imagesearch', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ status: 'error', message: 'Keyword diperlukan' });

  const blacklist = ['adult', 'xxx', 'porn', 'sex', 'nude', '18+', 'bikini', 'hot', 'sexy', 'erotic', 'porno', 'bokep', 'bugil', 'telanjang', 'memek', 'kontol', 'ngentot', 'coli'];
  const filterImages = (urls) => urls.filter(url => {
    const lower = url.toLowerCase();
    return !blacklist.some(word => lower.includes(word));
  });

  try {
    const ddgUrl = `https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images&kp=1`;
    const response = await axios.get(ddgUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    });
    const $ = cheerio.load(response.data);
    const images = new Set();
    $('img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original');
      if (src && src.startsWith('http') && !src.includes('duckduckgo.com') && !src.includes('data:image')) {
        const clean = src.split('?')[0];
        if (clean.match(/\.(jpg|jpeg|png|gif|webp)$/i)) images.add(clean);
      }
    });
    $('[style*="background-image"]').each((i, el) => {
      const style = $(el).attr('style');
      const match = style.match(/url\(['"]?(.*?)['"]?\)/);
      if (match && match[1]) {
        const url = match[1];
        if (url.startsWith('http') && !url.includes('duckduckgo.com')) {
          const clean = url.split('?')[0];
          if (clean.match(/\.(jpg|jpeg|png|gif|webp)$/i)) images.add(clean);
        }
      }
    });
    let imageArray = filterImages(Array.from(images));
    if (imageArray.length === 0) {
      const UNSPLASH_KEY = 'YOUR_UNSPLASH_KEY';
      if (UNSPLASH_KEY !== 'YOUR_UNSPLASH_KEY') {
        try {
          const unsplashRes = await axios.get('https://api.unsplash.com/search/photos', {
            params: { query: q, per_page: 20 },
            headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
            timeout: 10000
          });
          const unsplashImages = unsplashRes.data.results.map(p => p.urls.regular);
          const filtered = filterImages(unsplashImages);
          if (filtered.length > 0) return res.json({ status: 'success', images: filtered.slice(0, 30) });
        } catch(e) {}
      }
    }
    if (imageArray.length === 0) {
      return res.json({ status: 'error', message: 'Gak nemu gambar aman, coba keyword lain' });
    }
    res.json({ status: 'success', images: imageArray.slice(0, 30) });
  } catch (err) {
    console.error('Image search error:', err.message);
    res.status(500).json({ status: 'error', message: 'Gagal ambil gambar' });
  }
});

// ============================================================
// 3. API CUACA
// ============================================================
app.get('/api/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) return res.status(400).json({ status: 'error', message: 'Nama kota diperlukan' });
  const API_KEY = '577f7b744218443cec55394aa85208b3';
  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: { q: city, appid: API_KEY, units: 'metric', lang: 'id' },
      timeout: 10000
    });
    const data = response.data;
    res.json({
      status: 'success',
      city: data.name,
      country: data.sys.country,
      temp: data.main.temp,
      feels_like: data.main.feels_like,
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      wind_speed: data.wind.speed,
      pressure: data.main.pressure
    });
  } catch (err) {
    console.error('Weather error:', err.message);
    res.status(500).json({ status: 'error', message: 'Gagal cek cuaca' });
  }
});

// ============================================================
// 4. API GEMPA
// ============================================================
app.get('/api/gempa', async (req, res) => {
  try {
    const response = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json', { timeout: 10000 });
    const data = response.data.Infogempa.gempa;
    res.json({
      status: 'success',
      tanggal: data.Tanggal,
      jam: data.Jam,
      magnitudo: data.Magnitude,
      kedalaman: data.Kedalaman,
      wilayah: data.Wilayah,
      potensi: data.Potensi,
      dirasakan: data.Dirasakan || 'Tidak dirasakan',
      koordinat: data.Coordinates
    });
  } catch (err) {
    console.error('Gempa error:', err.message);
    res.status(500).json({ status: 'error', message: 'Gagal ambil data gempa' });
  }
});

// ============================================================
// 5. API KOMIK
// ============================================================
app.get('/api/komik', async (req, res) => {
  const q = req.query.q;
  if (!q) {
    return res.status(400).json({ status: 'error', message: 'Judul komik diperlukan!' });
  }
  try {
    const response = await axios.get(`https://komiku-api.vercel.app/api/search/${encodeURIComponent(q)}`, {
      timeout: 10000
    });
    const data = response.data;
    if (!data || data.length === 0) {
      return res.json({ status: 'error', message: 'Komik gak ditemukan' });
    }
    const komik = data[0];
    res.json({
      status: 'success',
      title: komik.title || 'N/A',
      chapter: komik.chapter || 'N/A',
      thumbnail: komik.thumb || '',
      link: komik.link || ''
    });
  } catch (err) {
    console.error('Komik error:', err.message);
    res.status(500).json({ status: 'error', message: 'Gagal ambil data komik' });
  }
});

// ============================================================
// 6. API TIKTOK DOWNLOADER
// ============================================================
app.get('/api/tiktok', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ status: 'error', message: 'Link TikTok diperlukan!' });
  }
  try {
    const response = await axios.get(`https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`, {
      timeout: 15000
    });
    const data = response.data;
    if (!data || !data.video_url) {
      return res.json({ status: 'error', message: 'Gagal ambil video TikTok' });
    }
    res.json({
      status: 'success',
      title: data.title || 'TikTok Video',
      video: data.video_url,
      thumbnail: data.thumbnail || '',
      duration: data.duration || 'N/A'
    });
  } catch (err) {
    console.error('TikTok error:', err.message);
    res.status(500).json({ status: 'error', message: 'Gagal download TikTok' });
  }
});

// ============================================================
// 7. API INSTAGRAM DOWNLOADER
// ============================================================
app.get('/api/instagram', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ status: 'error', message: 'Link Instagram diperlukan!' });
  }
  try {
    const response = await axios.get(`https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`, {
      timeout: 10000
    });
    const data = response.data;
    if (!data || !data.thumbnail_url) {
      return res.json({ status: 'error', message: 'Gagal ambil data Instagram' });
    }
    res.json({
      status: 'success',
      title: data.title || 'Instagram Post',
      thumbnail: data.thumbnail_url,
      author: data.author_name || 'Unknown',
      author_url: data.author_url || ''
    });
  } catch (err) {
    console.error('Instagram error:', err.message);
    res.status(500).json({ status: 'error', message: 'Gagal download Instagram' });
  }
});

// ============================================================
// ROUTE UTAMA — DASHBOARD (7 Tools)
// ============================================================
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FAWNTOOLS · Nexus</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      background: #0a0a0a;
      font-family: 'Segoe UI', 'Courier New', monospace;
      color: #00ff88;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: rgba(0,0,0,0.85);
      border: 1px solid rgba(0,255,136,0.15);
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 0 60px rgba(0,255,136,0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(0,255,136,0.08);
      padding-bottom: 15px;
      margin-bottom: 25px;
      flex-wrap: wrap;
    }
    .header .title {
      font-size: 28px;
      font-weight: bold;
      letter-spacing: 2px;
      color: #00ff88;
      text-shadow: 0 0 20px rgba(0,255,136,0.2);
    }
    .header .title span { color: #ff66ff; }
    .header .menu-info {
      display: flex;
      gap: 15px;
      font-size: 13px;
      opacity: 0.6;
      flex-wrap: wrap;
    }
    .header .menu-info a {
      color: #00ff88;
      text-decoration: none;
      border-bottom: 1px dotted transparent;
      transition: 0.3s;
      cursor: pointer;
    }
    .header .menu-info a:hover {
      border-bottom-color: #00ff88;
      opacity: 1;
    }
    .status-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 20px 40px;
      background: rgba(0,255,136,0.02);
      border: 1px solid rgba(0,255,136,0.06);
      border-radius: 12px;
      padding: 15px 20px;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .status-bar .item {
      display: flex;
      gap: 6px;
      opacity: 0.7;
    }
    .status-bar .item .label { opacity: 0.4; }
    .status-bar .item .value { font-weight: bold; color: #00ff88; }
    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
      margin-top: 10px;
    }
    .tool-card {
      background: rgba(0,255,136,0.02);
      border: 1px solid rgba(0,255,136,0.08);
      border-radius: 14px;
      padding: 18px 20px 16px;
      transition: 0.3s;
      cursor: pointer;
      display: flex;
      flex-direction: column;
    }
    .tool-card:hover {
      background: rgba(0,255,136,0.06);
      border-color: rgba(0,255,136,0.3);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,255,136,0.05);
    }
    .tool-card .name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 4px;
      color: #00ff88;
    }
    .tool-card .desc {
      font-size: 13px;
      opacity: 0.5;
      margin-bottom: 12px;
      flex: 1;
    }
    .tool-card .badge {
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #ff66ff;
      border: 1px solid rgba(255,102,255,0.15);
      border-radius: 20px;
      padding: 2px 12px;
      display: inline-block;
      align-self: flex-start;
      margin-bottom: 10px;
    }
    .tool-card .nav-btn {
      background: transparent;
      border: 1px solid rgba(0,255,136,0.2);
      color: #00ff88;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      transition: 0.3s;
      align-self: flex-end;
      font-family: 'Courier New', monospace;
    }
    .tool-card .nav-btn:hover {
      background: #00ff88;
      color: #0a0a0a;
      border-color: #00ff88;
    }
    .page-container {
      display: none;
      margin-top: 30px;
      border-top: 1px solid rgba(0,255,136,0.06);
      padding-top: 25px;
    }
    .page-container.active {
      display: block;
    }
    .back-btn {
      background: transparent;
      border: none;
      color: #00ff88;
      font-size: 20px;
      cursor: pointer;
      opacity: 0.5;
      transition: 0.3s;
      margin-bottom: 15px;
      font-family: 'Courier New', monospace;
    }
    .back-btn:hover { opacity: 1; }
    .input-group {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin: 15px 0;
    }
    .input-group input, .input-group select {
      flex: 1;
      background: rgba(0,255,136,0.04);
      border: 1px solid rgba(0,255,136,0.2);
      color: #00ff88;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 15px;
      outline: none;
      min-width: 180px;
    }
    .input-group input:focus, .input-group select:focus {
      border-color: #00ff88;
      box-shadow: 0 0 20px rgba(0,255,136,0.1);
    }
    .input-group input[type="color"] {
      padding: 4px;
      height: 44px;
      cursor: pointer;
    }
    .btn {
      background: transparent;
      border: 1px solid #00ff88;
      color: #00ff88;
      padding: 12px 28px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 15px;
      font-weight: bold;
      cursor: pointer;
      transition: 0.3s;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .btn:hover {
      background: #00ff88;
      color: #0a0a0a;
      box-shadow: 0 0 30px rgba(0,255,136,0.2);
    }
    .result-box {
      margin-top: 20px;
      background: rgba(0,255,136,0.02);
      border: 1px solid rgba(0,255,136,0.1);
      border-radius: 12px;
      padding: 20px;
    }
    .result-box .line {
      padding: 6px 0;
      border-bottom: 1px solid rgba(0,255,136,0.04);
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .result-box .label {
      color: rgba(0,255,136,0.5);
      min-width: 130px;
    }
    .result-box .value { color: #00ff88; font-weight: bold; word-break: break-all; }
    .result-box .value.highlight { color: #ff66ff; }
    .image-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px,1fr));
      gap: 12px;
      margin-top: 15px;
    }
    .image-grid img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid rgba(0,255,136,0.1);
    }
    .loading-indicator {
      text-align: center;
      margin: 20px 0;
    }
    .loading-indicator .spinner {
      display: inline-block;
      width: 30px;
      height: 30px;
      border: 3px solid rgba(0,255,136,0.1);
      border-top: 3px solid #00ff88;
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
    }
    @keyframes spin { 0%{ transform:rotate(0); } 100%{ transform:rotate(360deg); } }
    .loading-indicator p {
      margin-top: 8px;
      opacity: 0.5;
      animation: blink 1s infinite;
    }
    @keyframes blink { 0%,100%{ opacity:0.5; } 50%{ opacity:0.1; } }
    .iqc-result-img {
      max-width: 100%;
      border-radius: 12px;
      border: 1px solid rgba(0,255,136,0.15);
      margin-top: 15px;
    }
    .iqc-settings {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 15px 0;
    }
    .iqc-settings label {
      color: rgba(0,255,136,0.6);
      font-size: 13px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .iqc-settings input, .iqc-settings select {
      background: rgba(0,255,136,0.04);
      border: 1px solid rgba(0,255,136,0.2);
      color: #00ff88;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      outline: none;
    }
    .iqc-settings input:focus, .iqc-settings select:focus {
      border-color: #00ff88;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      opacity: 0.2;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid rgba(0,255,136,0.05);
      letter-spacing: 3px;
    }
    .video-link {
      color: #ff66ff;
      text-decoration: none;
      word-break: break-all;
    }
    .video-link:hover { text-decoration: underline; }
    @media (max-width: 600px) {
      .container { padding: 16px; }
      .header .title { font-size: 22px; }
      .status-bar { flex-direction: column; gap: 8px; }
      .tools-grid { grid-template-columns: 1fr; }
      .iqc-settings { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
<div class="container">
  <!-- Header -->
  <div class="header">
    <div class="title">⬡ FAWN<span>TOOLS</span></div>
    <div class="menu-info">
      <a onclick="alert('📌 About Dev: FAWNTOOLS dibuat oleh RipppXyz')">About Dev</a>
      <a onclick="alert('📩 Report Bug: hubungi @ripppxyz di Telegram')">Report Bug</a>
      <a onclick="alert('💡 Saran: kirim ke ripppxyz@gmail.com')">Saran</a>
      <a onclick="alert('🚀 Ide: chat ke @ripppxyz')">Ide</a>
    </div>
  </div>

  <!-- Status Bar -->
  <div class="status-bar">
    <div class="item"><span class="label">NEGARA</span><span class="value">Indonesia</span></div>
    <div class="item"><span class="label">DEVICE</span><span class="value">Browser</span></div>
    <div class="item"><span class="label">BROWSER</span><span class="value">Chrome</span></div>
    <div class="item"><span class="label">STATUS</span><span class="value">Online</span></div>
  </div>

  <!-- Tools Grid -->
  <h2 style="font-size:18px;font-weight:400;opacity:0.5;margin-bottom:15px;letter-spacing:3px;">✦ SEMUA TOOLS</h2>
  <div class="tools-grid">
    <div class="tool-card" data-page="iqc">
      <div class="name">📱 Fake Chat</div>
      <div class="desc">Buat screenshot chat iPhone palsu (custom warna, jam, provider)</div>
      <div class="badge">INTERAKTIF</div>
      <button class="nav-btn">➡️ Buka</button>
    </div>
    <div class="tool-card" data-page="imagesearch">
      <div class="name">🖼️ Image Search</div>
      <div class="desc">Cari gambar dari DuckDuckGo + Unsplash fallback (aman 18+)</div>
      <div class="badge">GAMBAR</div>
      <button class="nav-btn">➡️ Buka</button>
    </div>
    <div class="tool-card" data-page="weather">
      <div class="name">🌤️ Cuaca</div>
      <div class="desc">Cek cuaca kota mana pun (OpenWeatherMap)</div>
      <div class="badge">REAL TIME</div>
      <button class="nav-btn">➡️ Buka</button>
    </div>
    <div class="tool-card" data-page="gempa">
      <div class="name">🌋 Gempa Terkini</div>
      <div class="desc">Data gempa terbaru dari BMKG Indonesia</div>
      <div class="badge">REAL TIME</div>
      <button class="nav-btn">➡️ Buka</button>
    </div>
    <div class="tool-card" data-page="komik">
      <div class="name">📚 Baca Komik</div>
      <div class="desc">Cari manga/manhwa/manhua (Komiku API)</div>
      <div class="badge">MANGA</div>
      <button class="nav-btn">➡️ Buka</button>
    </div>
    <div class="tool-card" data-page="tiktok">
      <div class="name">🎵 TikTok Downloader</div>
      <div class="desc">Download video TikTok tanpa watermark</div>
      <div class="badge">DOWNLOAD</div>
      <button class="nav-btn">➡️ Buka</button>
    </div>
    <div class="tool-card" data-page="instagram">
      <div class="name">📸 Instagram Downloader</div>
      <div class="desc">Download foto/video dari Instagram</div>
      <div class="badge">DOWNLOAD</div>
      <button class="nav-btn">➡️ Buka</button>
    </div>
  </div>

  <!-- ========================================================= -->
  <!-- PAGE IQC -->
  <!-- ========================================================= -->
  <div class="page-container" id="page-iqc">
    <button class="back-btn" onclick="backToDashboard()">⬅️ Kembali</button>
    <h3>📱 Fake Chat iPhone</h3>
    <p style="opacity:0.4;font-size:14px;margin:6px 0 12px;">Ketik pesan (bisa pake emoji 😂) dan atur warna, jam, provider.</p>
    <div class="input-group">
      <input type="text" id="iqc-text" placeholder="Pesan...">
      <button class="btn" onclick="generateIQC()">▶ Generate</button>
    </div>
    <div class="iqc-settings">
      <label>Warna Bubble <input type="color" id="iqc-bubble" value="#34C759"></label>
      <label>Warna Menu <input type="color" id="iqc-menu" value="#1C1C1E"></label>
      <label>Warna Teks <input type="color" id="iqc-textcolor" value="#FFFFFF"></label>
      <label>Font <input type="text" id="iqc-font" value="Poppins"></label>
      <label>Jam Chat <input type="text" id="iqc-chattime" value="12.20"></label>
      <label>Jam Status Bar <input type="text" id="iqc-statustime" value="12.20"></label>
      <label>Provider <input type="text" id="iqc-provider" value="Telkomsel"></label>
    </div>
    <div id="iqc-loading" class="loading-indicator" style="display:none;"><div class="spinner"></div><p>GENERATING...</p></div>
    <div id="iqc-result"></div>
  </div>

  <!-- ========================================================= -->
  <!-- PAGE IMAGE SEARCH -->
  <!-- ========================================================= -->
  <div class="page-container" id="page-imagesearch">
    <button class="back-btn" onclick="backToDashboard()">⬅️ Kembali</button>
    <h3>🖼️ Image Search</h3>
    <div class="input-group">
      <input type="text" id="img-keyword" placeholder="kucing lucu, onlinejkt48, ...">
      <button class="btn" onclick="searchImage()">▶ Cari</button>
    </div>
    <div id="img-loading" class="loading-indicator" style="display:none;"><div class="spinner"></div><p>FETCHING IMAGES...</p></div>
    <div id="img-result"></div>
  </div>

  <!-- ========================================================= -->
  <!-- PAGE CUACA -->
  <!-- ========================================================= -->
  <div class="page-container" id="page-weather">
    <button class="back-btn" onclick="backToDashboard()">⬅️ Kembali</button>
    <h3>🌤️ Cuaca</h3>
    <div class="input-group">
      <input type="text" id="weather-city" placeholder="Jakarta, Bandung, ...">
      <button class="btn" onclick="getWeather()">▶ Cek</button>
    </div>
    <div id="weather-loading" class="loading-indicator" style="display:none;"><div class="spinner"></div><p>FETCHING WEATHER...</p></div>
    <div id="weather-result"></div>
  </div>

  <!-- ========================================================= -->
  <!-- PAGE GEMPA -->
  <!-- ========================================================= -->
  <div class="page-container" id="page-gempa">
    <button class="back-btn" onclick="backToDashboard()">⬅️ Kembali</button>
    <h3>🌋 Gempa Terkini</h3>
    <button class="btn" onclick="getGempa()" style="margin:12px 0;">▶ Refresh Data</button>
    <div id="gempa-loading" class="loading-indicator" style="display:none;"><div class="spinner"></div><p>FETCHING DATA...</p></div>
    <div id="gempa-result"></div>
  </div>

  <!-- ========================================================= -->
  <!-- PAGE KOMIK -->
  <!-- ========================================================= -->
  <div class="page-container" id="page-komik">
    <button class="back-btn" onclick="backToDashboard()">⬅️ Kembali</button>
    <h3>📚 Baca Komik</h3>
    <p style="opacity:0.4;font-size:14px;margin:6px 0 12px;">Cari manga/manhwa/manhua (hasil dari Komiku API)</p>
    <div class="input-group">
      <input type="text" id="komik-keyword" placeholder="Judul komik...">
      <button class="btn" onclick="searchKomik()">▶ Cari</button>
    </div>
    <div id="komik-loading" class="loading-indicator" style="display:none;"><div class="spinner"></div><p>FETCHING COMIC...</p></div>
    <div id="komik-result"></div>
  </div>

  <!-- ========================================================= -->
  <!-- PAGE TIKTOK -->
  <!-- ========================================================= -->
  <div class="page-container" id="page-tiktok">
    <button class="back-btn" onclick="backToDashboard()">⬅️ Kembali</button>
    <h3>🎵 TikTok Downloader</h3>
    <p style="opacity:0.4;font-size:14px;margin:6px 0 12px;">Download video TikTok tanpa watermark</p>
    <div class="input-group">
      <input type="text" id="tiktok-url" placeholder="Link TikTok...">
      <button class="btn" onclick="downloadTiktok()">▶ Download</button>
    </div>
    <div id="tiktok-loading" class="loading-indicator" style="display:none;"><div class="spinner"></div><p>FETCHING VIDEO...</p></div>
    <div id="tiktok-result"></div>
  </div>

  <!-- ========================================================= -->
  <!-- PAGE INSTAGRAM -->
  <!-- ========================================================= -->
  <div class="page-container" id="page-instagram">
    <button class="back-btn" onclick="backToDashboard()">⬅️ Kembali</button>
    <h3>📸 Instagram Downloader</h3>
    <p style="opacity:0.4;font-size:14px;margin:6px 0 12px;">Download foto/video dari Instagram</p>
    <div class="input-group">
      <input type="text" id="instagram-url" placeholder="Link Instagram...">
      <button class="btn" onclick="downloadInstagram()">▶ Download</button>
    </div>
    <div id="instagram-loading" class="loading-indicator" style="display:none;"><div class="spinner"></div><p>FETCHING MEDIA...</p></div>
    <div id="instagram-result"></div>
  </div>

  <div class="footer">● FAWNTOOLS ● NEXUS ● v7.0 ● ENCRYPTED ●</div>
</div>

<script>
  // ==========================================================
  // NAVIGASI
  // ==========================================================
  function showPage(pageId) {
    document.querySelectorAll('.page-container').forEach(el => el.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    document.querySelector('.tools-grid').style.display = 'none';
    document.querySelector('.status-bar').style.display = 'none';
    document.querySelector('h2').style.display = 'none';
  }
  function backToDashboard() {
    document.querySelectorAll('.page-container').forEach(el => el.classList.remove('active'));
    document.querySelector('.tools-grid').style.display = 'grid';
    document.querySelector('.status-bar').style.display = 'flex';
    document.querySelector('h2').style.display = 'block';
  }

  document.querySelectorAll('.tool-card[data-page]').forEach(card => {
    card.addEventListener('click', function(e) {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        const page = this.dataset.page;
        showPage(page);
        if (page === 'gempa' && !document.getElementById('gempa-result').innerHTML) {
          getGempa();
        }
      }
    });
  });

  // ==========================================================
  // IQC
  // ==========================================================
  async function generateIQC() {
    const text = document.getElementById('iqc-text').value.trim();
    if (!text) return alert('Isi pesannya dulu bro!');
    const params = new URLSearchParams({
      text: text,
      bubbleColor: document.getElementById('iqc-bubble').value || '#34C759',
      menuColor: document.getElementById('iqc-menu').value || '#1C1C1E',
      textColor: document.getElementById('iqc-textcolor').value || '#FFFFFF',
      fontName: document.getElementById('iqc-font').value || 'Poppins',
      chatTime: document.getElementById('iqc-chattime').value || '12.20',
      statusBarTime: document.getElementById('iqc-statustime').value || '12.20',
      signalName: document.getElementById('iqc-provider').value || 'Telkomsel'
    });
    const loading = document.getElementById('iqc-loading');
    const resultDiv = document.getElementById('iqc-result');
    loading.style.display = 'block';
    resultDiv.innerHTML = '';
    try {
      const response = await fetch('/api/iqc?' + params.toString());
      if (!response.ok) throw new Error('Gagal generate');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      resultDiv.innerHTML = `
        <div class="result-box">
          <div class="line"><span class="label">PESAN</span><span class="value highlight">${text}</span></div>
          <div class="line"><span class="label">BUBBLE</span><span class="value">${params.get('bubbleColor')}</span></div>
          <div class="line"><span class="label">PROVIDER</span><span class="value">${params.get('signalName')}</span></div>
          <div class="line"><span class="label">WAKTU</span><span class="value">${params.get('chatTime')}</span></div>
          <img src="${url}" class="iqc-result-img" />
          <p style="margin-top:10px;opacity:0.3;font-size:12px;">Klik kanan → Save Image</p>
        </div>
      `;
    } catch (err) {
      resultDiv.innerHTML = `<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">${err.message}</span></div></div>`;
    } finally {
      loading.style.display = 'none';
    }
  }

  // ==========================================================
  // IMAGE SEARCH
  // ==========================================================
  async function searchImage() {
    const q = document.getElementById('img-keyword').value.trim();
    if (!q) return alert('Masukin keyword!');
    const loading = document.getElementById('img-loading');
    const resultDiv = document.getElementById('img-result');
    loading.style.display = 'block';
    resultDiv.innerHTML = '';
    try {
      const res = await fetch('/api/imagesearch?q=' + encodeURIComponent(q));
      const data = await res.json();
      if (data.status === 'error') {
        resultDiv.innerHTML = `<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">${data.message}</span></div></div>`;
        return;
      }
      let html = '<div class="image-grid">';
      data.images.forEach(url => {
        html += `<img src="${url}" loading="lazy" onerror="this.style.display='none'" />`;
      });
      html += '</div>';
      resultDiv.innerHTML = html;
    } catch (e) {
      resultDiv.innerHTML = `<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">Gagal ambil gambar</span></div></div>`;
    } finally {
      loading.style.display = 'none';
    }
  }

  // ==========================================================
  // CUACA
  // ==========================================================
  async function getWeather() {
    const city = document.getElementById('weather-city').value.trim();
    if (!city) return alert('Masukin kota!');
    const loading = document.getElementById('weather-loading');
    const resultDiv = document.getElementById('weather-result');
    loading.style.display = 'block';
    resultDiv.innerHTML = '';
    try {
      const res = await fetch('/api/weather?city=' + encodeURIComponent(city));
      const data = await res.json();
      if (data.status === 'error') {
        resultDiv.innerHTML = `<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">${data.message}</span></div></div>`;
        return;
      }
      resultDiv.innerHTML = `
        <div class="result-box">
          <div class="line"><span class="label">KOTA</span><span class="value highlight">${data.city}, ${data.country}</span></div>
          <div class="line"><span class="label">SUHU</span><span class="value">${data.temp}°C (terasa ${data.feels_like}°C)</span></div>
          <div class="line"><span class="label">KONDISI</span><span class="value">${data.description}</span></div>
          <div class="line"><span class="label">KELEMBABAN</span><span class="value">${data.humidity}%</span></div>
          <div class="line"><span class="label">ANGIN</span><span class="value">${data.wind_speed} m/s</span></div>
          <div class="line"><span class="label">TEKANAN</span><span class="value">${data.pressure} hPa</span></div>
          <div style="margin-top:12px;"><img src="${data.icon}" /></div>
        </div>
      `;
    } catch (e) {
      resultDiv.innerHTML = `<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">Gagal cek cuaca</span></div></div>`;
    } finally {
      loading.style.display = 'none';
    }
  }

  // ==========================================================
  // GEMPA
  // ==========================================================
  async function getGempa() {
    const loading = document.getElementById('gempa-loading');
    const resultDiv = document.getElementById('gempa-result');
    loading.style.display = 'block';
    resultDiv.innerHTML = '';
    try {
      const res = await fetch('/api/gempa');
      const data = await res.json();
      if (data.status === 'error') {
        resultDiv.innerHTML = `<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">${data.message}</span></div></div>`;
        return;
      }
      resultDiv.innerHTML = `
        <div class="result-box">
          <div class="line"><span class="label">TANGGAL</span><span class="value">${data.tanggal} ${data.jam}</span></div>
          <div class="line"><span class="label">MAGNITUDO</span><span class="value highlight">${data.magnitudo}</span></div>
          <div class="line"><span class="label">KEDALAMAN</span><span class="value">${data.kedalaman}</span></div>
          <div class="line"><span class="label">WILAYAH</span><span class="value">${data.wilayah}</span></div>
          <div class="line"><span class="label">POTENSI</span><span class="value">${data.potensi}</span></div>
          <div class="line"><span class="label">DIRASAKAN</span><span class="value">${data.dirasakan}</span></div>
          <div class="line"><span class="label">KOORDINAT</span><span class="value">${data.koordinat}</span></div>
        </div>
      `;
    } catch (e) {
      resultDiv.innerHTML = `<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">Gagal ambil data gempa</span></div></div>`;
    } finally {
      loading.style.display = 'none';
    }
  }

  // ==========================================================
  // KOMIK
  // ==========================================================
  async function searchKomik() {
    const q = document.getElementById('komik-keyword').value.trim();
    if (!q) return alert('Masukin judul komik!');
    const loading = document.getElementById('komik-loading');
    const resultDiv = document.getElementById('komik-result');
    loading.style.display = 'block';
    resultDiv.innerHTML = '';
    try {
      const res = await fetch('/api/komik?q=' + encodeURIComponent(q));
      const data = await res.json();
      if (data.status === 'error') {
        resultDiv.innerHTML = `<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">${data.message}</span></div></div>`;
        return;
      }
      resultDiv.innerHTML = `
        <div class="result-box">
          <div class="line"><span class="label">JUDUL</span><span class="value highlight">${data.title}</span></div>
          <div class="line"><span class="label">CHAPTER</span><span class="value">${data.chapter}</span></div>
          ${data.thumbnail ? `<div class="line"><span class="label">THUMBNAIL</span><span class="value"><img src="${data.thumbnail}" style="max-width:150px;border-radius:8px;margin-top:8px;" /></span></div>` : ''}
          ${data.link ? `<div class="line"><span class="label">LINK</span><span class="value"><a href="${data.link}" target="_blank" style="color:#ff66ff;">Baca Komik</a></span></div>` : ''}
        </div>
      `;
    } catch (e) {
      resultDiv.innerHTML = `<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">Gagal ambil komik</span></div></div>`;
    } finally {
      loading.style.display = 'none';
    }
  }

  // ==========================================================
  // TIKTOK
  // ==========================================================
  async function downloadTiktok() {
    const url = document.getElementById('tiktok-url').value.trim();
    if (!url) return alert('Masukin link TikTok!');
    const loading = document.getElementById('tiktok-loading');
    const resultDiv = document.getElementById('tiktok-result');
    loading.style.display = 'block';
    resultDiv.innerHTML = '';
    try {
      const res = await fetch('/api/tiktok?url=' + encodeURIComponent(url));
      const data = await res.json();
      if (data.status === 'error') {
        resultDiv.innerHTML = `<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">${data.message}</span></div></div>`;
        return;
      }
      resultDiv.innerHTML = `
        <div class="result-box">
          <div class="line"><span class="label">JUDUL</span><span class="value highlight">${data.title}</span></div>
          <div class="line"><span class="label">DURASI</span><span class="value">${data.duration}</span></div>
          ${data.thumbnail ? `<div class="line"><span class="label">THUMBNAIL</span><span class="value"><img src="${data.thumbnail}" style="max-width:150px;border-radius:8px;margin-top:8px;" /></span></div>` : ''}
          <div class="line"><span class="label">DOWNLOAD</span><span class="value"><a href="${data.video}" target="_blank" class="video-link" download>▶ Klik untuk download video</a></span></div>
        </div>
      `;
    } catch (e) {
      resultDiv.innerHTML = `<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">Gagal download TikTok</span></div></div>`;
    } finally {
      loading.style.display = 'none';
    }
  }

  // ==========================================================
  // INSTAGRAM
  // ==========================================================
  async function downloadInstagram() {
    const url = document.getElementById('instagram-url').value.trim();
    if (!url) return alert('Masukin link Instagram!');
    const loading = document.getElementById('instagram-loading');
    const resultDiv = document.getElementById('instagram-result');
    loading.style.display = 'block';
    resultDiv.innerHTML = '';
    try {
      const res = await fetch('/api/instagram?url=' + encodeURIComponent(url));
      const data = await res.json();
      if (data.status === 'error') {
        resultDiv.innerHTML = `<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">${data.message}</span></div></div>`;
        return;
      }
      resultDiv.innerHTML = `
        <div class="result-box">
          <div class="line"><span class="label">JUDUL</span><span class="value highlight">${data.title}</span></div>
          <div class="line"><span class="label">AUTHOR</span><span class="value">${data.author}</span></div>
          ${data.author_url ? `<div class="line"><span class="label">PROFIL</span><span class="value"><a href="${data.author_url}" target="_blank" style="color:#ff66ff;">${data.author_url}</a></span></div>` : ''}
          <div class="line"><span class="label">THUMBNAIL</span><span class="value"><img src="${data.thumbnail}" style="max-width:100%;border-radius:8px;margin-top:8px;" /></span></div>
        </div>
      `;
    } catch (e) {
      resultDiv.innerHTML = `<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">Gagal download Instagram</span></div></div>`;
    } finally {
      loading.style.display = 'none';
    }
  }
</script>
</body>
</html>
  `);
});

// ============================================================
// EXPORT
// ============================================================
module.exports = app;
