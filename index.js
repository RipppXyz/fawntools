import express from 'express';
import axios from 'axios';

const app = express();

// ============================================================
// 1. API IQC (dummy tapi realistis)
// ============================================================
app.get('/api/iqc', (req, res) => {
  const target = req.query.target;
  if (!target) {
    return res.status(400).json({
      status: 'error',
      message: 'Target gak boleh kosong!',
      example: '/api/iqc?target=6285715037857'
    });
  }

  const providers = ['Telkomsel', 'XL', 'Indosat', 'Tri', 'Smartfren', 'By.U'];
  const statuses = ['Active', 'Active', 'Active', 'Inactive', 'Suspended'];
  const devices = ['iPhone 15 Pro', 'Samsung S24 Ultra', 'Xiaomi 14 Pro', 'Oppo Find X7', 'Vivo X100 Pro'];
  const locations = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Makassar', 'Yogyakarta'];
  const networks = ['5G', '4G+', '4G', '3G'];
  const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const result = {
    status: 'success',
    data: {
      target,
      provider: random(providers),
      status: random(statuses),
      device: random(devices),
      location: random(locations),
      network: random(networks),
      imei: `35${Math.floor(Math.random() * 100000000000000)}`,
      ip: `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
      last_seen: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      threat_level: Math.floor(Math.random() * 10) + 1,
      encryption: 'AES-256-GCM',
      fingerprint: Math.random().toString(36).substring(2, 15),
      timestamp: new Date().toISOString()
    }
  };
  setTimeout(() => res.json(result), 1200);
});

// ============================================================
// 2. API IMAGE SEARCH (Yandex scraping - real)
// ============================================================
app.get('/api/imagesearch', async (req, res) => {
  const q = req.query.q;
  if (!q) {
    return res.status(400).json({ status: 'error', message: 'Keyword diperlukan' });
  }

  try {
    const url = `https://yandex.com/images/search?text=${encodeURIComponent(q)}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    const html = response.data;
    // Ekstrak URL gambar dengan regex sederhana
    const matches = html.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|gif|webp)/gi) || [];
    const unique = [...new Set(matches)];
    const images = unique.slice(0, 20);
    if (images.length === 0) {
      return res.json({ status: 'error', message: 'Gak nemu gambar' });
    }
    res.json({ status: 'success', images });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Gagal ambil gambar' });
  }
});

// ============================================================
// 3. API CUACA (OpenWeatherMap - real)
// ============================================================
app.get('/api/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.status(400).json({ status: 'error', message: 'Nama kota diperlukan' });
  }

  const API_KEY = 'masukin_api_key_openweathermap_lo'; // daftar gratis di openweathermap.org
  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: {
        q: city,
        appid: API_KEY,
        units: 'metric',
        lang: 'id'
      },
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
    res.status(500).json({ status: 'error', message: 'Gagal cek cuaca' });
  }
});

// ============================================================
// 4. API GEMPA TERKINI (BMKG - real, gratis)
// ============================================================
app.get('/api/gempa', async (req, res) => {
  try {
    const response = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json', {
      timeout: 10000
    });
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
    res.status(500).json({ status: 'error', message: 'Gagal ambil data gempa' });
  }
});

// ============================================================
// ROUTE UTAMA — SPA dengan multi menu
// ============================================================
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FAWNTOOLS</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      background: #0a0a0a;
      font-family: 'Courier New', monospace;
      min-height: 100vh;
      padding: 20px;
      color: #00ff88;
    }
    /* LOADING OVERLAY */
    #loader {
      position: fixed; top:0; left:0; width:100%; height:100%;
      background: #0a0a0a; display:flex; flex-direction:column;
      justify-content:center; align-items:center; z-index:9999;
      transition: opacity 0.8s;
    }
    #loader.hidden { opacity:0; pointer-events:none; }
    #loader .glitch {
      font-size:48px; font-weight:bold; color:#00ff88;
      text-shadow:0 0 20px rgba(0,255,136,0.6);
      animation: glitch 1.5s infinite;
      letter-spacing:6px;
    }
    @keyframes glitch {
      0%,100%{ transform:skew(0); opacity:1; }
      25%{ transform:skew(2deg,1deg); opacity:0.8; }
      50%{ transform:skew(-2deg,-1deg); opacity:0.9; }
      75%{ transform:skew(1deg,-1deg); opacity:0.7; }
    }
    #loader .sub {
      color:#00ff88; opacity:0.4; font-size:14px;
      letter-spacing:8px; animation: blink 1.2s infinite;
    }
    @keyframes blink { 0%,100%{ opacity:0.4; } 50%{ opacity:0.1; } }

    /* MAIN */
    #app {
      display:none;
      max-width:1000px; margin:0 auto;
      background:rgba(0,0,0,0.85);
      border:2px solid #00ff88;
      border-radius:16px;
      padding:30px;
      box-shadow:0 0 60px rgba(0,255,136,0.1);
    }
    .navbar {
      display:flex; flex-wrap:wrap; gap:8px;
      border-bottom:1px solid rgba(0,255,136,0.15);
      padding-bottom:18px; margin-bottom:25px;
    }
    .navbar .brand {
      font-size:24px; font-weight:bold; letter-spacing:4px;
      margin-right:auto; color:#00ff88;
    }
    .navbar button {
      background:transparent; border:1px solid rgba(0,255,136,0.3);
      color:#00ff88; padding:8px 18px; border-radius:6px;
      font-family:'Courier New',monospace; font-size:14px;
      cursor:pointer; transition:0.3s;
    }
    .navbar button:hover {
      background:#00ff88; color:#0a0a0a;
      border-color:#00ff88;
    }
    .navbar button.active {
      background:#00ff88; color:#0a0a0a;
      border-color:#00ff88;
    }

    .page { display:none; animation: fadeUp 0.4s; }
    .page.active { display:block; }
    @keyframes fadeUp { from{ opacity:0; transform:translateY(15px); } to{ opacity:1; transform:translateY(0); } }

    .input-group { display:flex; gap:12px; flex-wrap:wrap; margin:15px 0; }
    .input-group input {
      flex:1; background:rgba(0,255,136,0.04); border:1px solid rgba(0,255,136,0.2);
      color:#00ff88; padding:12px 16px; border-radius:8px;
      font-family:'Courier New',monospace; font-size:15px; outline:none;
      min-width:180px;
    }
    .input-group input:focus { border-color:#00ff88; box-shadow:0 0 20px rgba(0,255,136,0.1); }
    .btn {
      background:transparent; border:1px solid #00ff88; color:#00ff88;
      padding:12px 28px; border-radius:8px; font-family:'Courier New',monospace;
      font-size:15px; font-weight:bold; cursor:pointer; transition:0.3s;
      text-transform:uppercase; letter-spacing:2px;
    }
    .btn:hover { background:#00ff88; color:#0a0a0a; box-shadow:0 0 30px rgba(0,255,136,0.2); }

    .result-box {
      margin-top:20px; background:rgba(0,255,136,0.02);
      border:1px solid rgba(0,255,136,0.1); border-radius:12px; padding:20px;
    }
    .result-box .line { padding:6px 0; border-bottom:1px solid rgba(0,255,136,0.04); display:flex; flex-wrap:wrap; gap:8px; }
    .result-box .label { color:rgba(0,255,136,0.5); min-width:130px; }
    .result-box .value { color:#00ff88; font-weight:bold; word-break:break-all; }
    .result-box .value.highlight { color:#ff66ff; }
    .status-badge { display:inline-block; padding:2px 14px; border-radius:20px; font-size:12px; font-weight:bold; }
    .status-badge.active { background:rgba(0,255,136,0.15); border:1px solid #00ff88; color:#00ff88; }
    .status-badge.inactive { background:rgba(255,0,0,0.15); border:1px solid #ff4444; color:#ff4444; }
    .status-badge.suspended { background:rgba(255,165,0,0.15); border:1px solid #ffa500; color:#ffa500; }

    .image-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px,1fr)); gap:12px; margin-top:15px; }
    .image-grid img { width:100%; height:150px; object-fit:cover; border-radius:8px; border:1px solid rgba(0,255,136,0.1); }

    .loading-indicator { text-align:center; margin:20px 0; }
    .loading-indicator .spinner { display:inline-block; width:30px; height:30px; border:3px solid rgba(0,255,136,0.1); border-top:3px solid #00ff88; border-radius:50%; animation: spin 0.9s linear infinite; }
    @keyframes spin { 0%{ transform:rotate(0); } 100%{ transform:rotate(360deg); } }
    .loading-indicator p { margin-top:8px; opacity:0.5; animation: blink 1s infinite; }

    .footer { text-align:center; font-size:11px; opacity:0.2; margin-top:30px; padding-top:15px; border-top:1px solid rgba(0,255,136,0.05); letter-spacing:3px; }

    @media (max-width:600px) {
      #app { padding:16px; }
      .navbar .brand { font-size:18px; }
      .navbar button { font-size:12px; padding:6px 12px; }
      .input-group input { font-size:14px; padding:10px; }
      .btn { font-size:13px; padding:10px 18px; width:100%; }
      .result-box .line { flex-direction:column; gap:3px; }
      .result-box .label { min-width:auto; }
    }
  </style>
</head>
<body>
  <!-- LOADING -->
  <div id="loader">
    <div class="glitch">FAWNTOOLS</div>
    <div class="sub">● INITIALIZING ●</div>
  </div>

  <!-- APP -->
  <div id="app">
    <div class="navbar">
      <span class="brand">⬡ FAWN</span>
      <button class="active" data-page="iqc">IQC</button>
      <button data-page="imagesearch">Image</button>
      <button data-page="weather">Cuaca</button>
      <button data-page="gempa">Gempa</button>
    </div>

    <!-- PAGE IQC -->
    <div id="page-iqc" class="page active">
      <h2>📡 Information Quality Check</h2>
      <div class="input-group">
        <input type="text" id="iqc-target" placeholder="6285715037857 / email / username">
        <button class="btn" onclick="executeIQC()">▶ Check</button>
      </div>
      <div id="iqc-loading" class="loading-indicator" style="display:none;"><div class="spinner"></div><p>SCANNING...</p></div>
      <div id="iqc-result"></div>
    </div>

    <!-- PAGE IMAGE SEARCH -->
    <div id="page-imagesearch" class="page">
      <h2>🖼️ Image Search</h2>
      <div class="input-group">
        <input type="text" id="img-keyword" placeholder="kucing lucu, onlinejkt48, ...">
        <button class="btn" onclick="searchImage()">▶ Cari</button>
      </div>
      <div id="img-loading" class="loading-indicator" style="display:none;"><div class="spinner"></div><p>FETCHING IMAGES...</p></div>
      <div id="img-result"></div>
    </div>

    <!-- PAGE CUACA -->
    <div id="page-weather" class="page">
      <h2>🌤️ Cuaca</h2>
      <div class="input-group">
        <input type="text" id="weather-city" placeholder="Jakarta, Bandung, ...">
        <button class="btn" onclick="getWeather()">▶ Cek</button>
      </div>
      <div id="weather-loading" class="loading-indicator" style="display:none;"><div class="spinner"></div><p>FETCHING WEATHER...</p></div>
      <div id="weather-result"></div>
    </div>

    <!-- PAGE GEMPA -->
    <div id="page-gempa" class="page">
      <h2>🌋 Gempa Terkini</h2>
      <button class="btn" onclick="getGempa()" style="margin:12px 0;">▶ Refresh Data</button>
      <div id="gempa-loading" class="loading-indicator" style="display:none;"><div class="spinner"></div><p>FETCHING DATA...</p></div>
      <div id="gempa-result"></div>
    </div>

    <div class="footer">● FAWNTOOLS ● v2.0 ● ENCRYPTED ●</div>
  </div>

  <script>
    // ============================================================
    // LOADING HILANG SETELAH 2.5 DETIK
    // ============================================================
    setTimeout(() => {
      document.getElementById('loader').classList.add('hidden');
      document.getElementById('app').style.display = 'block';
    }, 2500);

    // ============================================================
    // NAVIGASI
    // ============================================================
    const navButtons = document.querySelectorAll('.navbar button');
    const pages = {
      iqc: document.getElementById('page-iqc'),
      imagesearch: document.getElementById('page-imagesearch'),
      weather: document.getElementById('page-weather'),
      gempa: document.getElementById('page-gempa')
    };

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const page = btn.dataset.page;
        Object.keys(pages).forEach(key => {
          pages[key].classList.toggle('active', key === page);
        });
      });
    });

    // ============================================================
    // FUNGSI IQC
    // ============================================================
    async function executeIQC() {
      const target = document.getElementById('iqc-target').value.trim();
      if (!target) return alert('Isi target dulu!');
      const loading = document.getElementById('iqc-loading');
      const resultDiv = document.getElementById('iqc-result');
      loading.style.display = 'block';
      resultDiv.innerHTML = '';
      try {
        const res = await fetch('/api/iqc?target=' + encodeURIComponent(target));
        const data = await res.json();
        loading.style.display = 'none';
        if (data.status === 'error') {
          resultDiv.innerHTML = \`<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">\${data.message}</span></div></div>\`;
          return;
        }
        const d = data.data;
        const statusClass = d.status.toLowerCase();
        resultDiv.innerHTML = \`
          <div class="result-box">
            <div class="line"><span class="label">TARGET</span><span class="value highlight">\${d.target}</span></div>
            <div class="line"><span class="label">PROVIDER</span><span class="value">\${d.provider}</span></div>
            <div class="line"><span class="label">STATUS</span><span class="status-badge \${statusClass}">\${d.status.toUpperCase()}</span></div>
            <div class="line"><span class="label">DEVICE</span><span class="value">\${d.device}</span></div>
            <div class="line"><span class="label">LOCATION</span><span class="value">\${d.location}</span></div>
            <div class="line"><span class="label">NETWORK</span><span class="value">\${d.network}</span></div>
            <div class="line"><span class="label">IMEI</span><span class="value">\${d.imei}</span></div>
            <div class="line"><span class="label">IP</span><span class="value">\${d.ip}</span></div>
            <div class="line"><span class="label">THREAT LEVEL</span><span class="value">\${d.threat_level}/10</span></div>
            <div class="line"><span class="label">FINGERPRINT</span><span class="value" style="font-size:11px;">\${d.fingerprint}</span></div>
            <div class="line"><span class="label">TIMESTAMP</span><span class="value">\${new Date(d.timestamp).toLocaleString()}</span></div>
          </div>
        \`;
      } catch(e) {
        loading.style.display = 'none';
        resultDiv.innerHTML = \`<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">System crash</span></div></div>\`;
      }
    }

    // ============================================================
    // FUNGSI IMAGE SEARCH
    // ============================================================
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
        loading.style.display = 'none';
        if (data.status === 'error') {
          resultDiv.innerHTML = \`<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">\${data.message}</span></div></div>\`;
          return;
        }
        if (data.images.length === 0) {
          resultDiv.innerHTML = \`<div class="result-box"><div class="line"><span class="label">INFO</span><span class="value">Gak nemu gambar</span></div></div>\`;
          return;
        }
        let html = '<div class="image-grid">';
        data.images.forEach(url => {
          html += \`<img src="\${url}" loading="lazy" />\`;
        });
        html += '</div>';
        resultDiv.innerHTML = html;
      } catch(e) {
        loading.style.display = 'none';
        resultDiv.innerHTML = \`<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">Gagal ambil gambar</span></div></div>\`;
      }
    }

    // ============================================================
    // FUNGSI CUACA
    // ============================================================
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
        loading.style.display = 'none';
        if (data.status === 'error') {
          resultDiv.innerHTML = \`<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">\${data.message}</span></div></div>\`;
          return;
        }
        resultDiv.innerHTML = \`
          <div class="result-box">
            <div class="line"><span class="label">KOTA</span><span class="value highlight">\${data.city}, \${data.country}</span></div>
            <div class="line"><span class="label">SUHU</span><span class="value">\${data.temp}°C (terasa \${data.feels_like}°C)</span></div>
            <div class="line"><span class="label">KONDISI</span><span class="value">\${data.description}</span></div>
            <div class="line"><span class="label">KELEMBABAN</span><span class="value">\${data.humidity}%</span></div>
            <div class="line"><span class="label">ANGIN</span><span class="value">\${data.wind_speed} m/s</span></div>
            <div class="line"><span class="label">TEKANAN</span><span class="value">\${data.pressure} hPa</span></div>
            <div style="margin-top:12px;"><img src="\${data.icon}" /></div>
          </div>
        \`;
      } catch(e) {
        loading.style.display = 'none';
        resultDiv.innerHTML = \`<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">Gagal cek cuaca</span></div></div>\`;
      }
    }

    // ============================================================
    // FUNGSI GEMPA
    // ============================================================
    async function getGempa() {
      const loading = document.getElementById('gempa-loading');
      const resultDiv = document.getElementById('gempa-result');
      loading.style.display = 'block';
      resultDiv.innerHTML = '';
      try {
        const res = await fetch('/api/gempa');
        const data = await res.json();
        loading.style.display = 'none';
        if (data.status === 'error') {
          resultDiv.innerHTML = \`<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">\${data.message}</span></div></div>\`;
          return;
        }
        resultDiv.innerHTML = \`
          <div class="result-box">
            <div class="line"><span class="label">TANGGAL</span><span class="value">\${data.tanggal} \${data.jam}</span></div>
            <div class="line"><span class="label">MAGNITUDO</span><span class="value highlight">\${data.magnitudo}</span></div>
            <div class="line"><span class="label">KEDALAMAN</span><span class="value">\${data.kedalaman}</span></div>
            <div class="line"><span class="label">WILAYAH</span><span class="value">\${data.wilayah}</span></div>
            <div class="line"><span class="label">POTENSI</span><span class="value">\${data.potensi}</span></div>
            <div class="line"><span class="label">DIRASAKAN</span><span class="value">\${data.dirasakan}</span></div>
            <div class="line"><span class="label">KOORDINAT</span><span class="value">\${data.koordinat}</span></div>
          </div>
        \`;
      } catch(e) {
        loading.style.display = 'none';
        resultDiv.innerHTML = \`<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">Gagal ambil data gempa</span></div></div>\`;
      }
    }

    // Auto-load gempa saat pertama kali masuk ke halaman itu
    document.querySelector('[data-page="gempa"]').addEventListener('click', () => {
      if (!document.getElementById('gempa-result').innerHTML) {
        getGempa();
      }
    });

    // Trigger gempa pertama kali jika halaman aktif
    setTimeout(() => {
      if (document.querySelector('[data-page="gempa"].active')) {
        getGempa();
      }
    }, 100);
  </script>
</body>
</html>
  `);
});

// ============================================================
// EXPORT UNTUK VERCEL
// ============================================================
export default app;
