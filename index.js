import express from 'express';
import axios from 'axios';

const app = express();

// ============================================================
// 1. IQC FAKE CHAT iPHONE (anabot.my.id)
// ============================================================
app.get('/api/iqc', async (req, res) => {
  const {
    text,
    chatTime = '12.20',
    statusBarTime = '12.20',
    signalName = 'Telkomsel',
    bubbleColor = '#34C759',
    menuColor = '#1C1C1E',
    textColor = '#FFFFFF',
    fontName = 'Poppins'
  } = req.query;

  if (!text) {
    return res.status(400).json({
      status: 'error',
      message: 'Text-nya diisi dulu bro!'
    });
  }

  try {
    const response = await axios.get('https://anabot.my.id/api/maker/iqc', {
      params: {
        text,
        chatTime,
        statusBarTime,
        signalName,
        bubbleColor,
        menuColor,
        textColor,
        fontName,
        apikey: 'freeApikey'
      },
      responseType: 'arraybuffer',
      timeout: 15000
    });

    res.set('Content-Type', 'image/png');
    res.send(response.data);

  } catch (err) {
    console.error('IQC error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Gagal generate fake chat'
    });
  }
});

// ============================================================
// 2. IMAGE SEARCH (DUCKDUCKGO + REGEX)
// ============================================================
app.get('/api/imagesearch', async (req, res) => {
  const q = req.query.q;
  if (!q) {
    return res.status(400).json({ status: 'error', message: 'Keyword diperlukan' });
  }

  const blacklist = ['adult', 'xxx', 'porn', 'sex', 'nude', '18+', 'bikini', 'hot', 'sexy', 'erotic', 'porno', 'bokep', 'bugil', 'telanjang', 'memek', 'kontol', 'ngentot', 'coli'];
  const filterImages = (urls) => urls.filter(url => {
    const lower = url.toLowerCase();
    return !blacklist.some(word => lower.includes(word));
  });

  try {
    const url = `https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images&kp=1`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const html = response.data;

    // Regex ambil semua gambar
    const imageRegex = /https?:\/\/[^"'\s]+\.(jpg|jpeg|png|gif|webp)/gi;
    const matches = html.match(imageRegex) || [];
    const uniqueImages = [...new Set(matches)];
    const filteredImages = filterImages(uniqueImages);

    // Kalo kosong, coba cari di data-src
    if (filteredImages.length === 0) {
      const dataSrcRegex = /data-src="(https?:\/\/[^"]+\.(jpg|jpeg|png|gif|webp))"/gi;
      let dataMatches = [];
      let match;
      while ((match = dataSrcRegex.exec(html)) !== null) {
        dataMatches.push(match[1]);
      }
      const uniqueData = [...new Set(dataMatches)];
      const filteredData = filterImages(uniqueData);
      if (filteredData.length > 0) {
        return res.json({ status: 'success', images: filteredData.slice(0, 30) });
      }
    }

    if (filteredImages.length === 0) {
      return res.json({
        status: 'error',
        message: 'Gak nemu gambar aman, coba keyword lain'
      });
    }

    res.json({ status: 'success', images: filteredImages.slice(0, 30) });

  } catch (err) {
    console.error('Image search error:', err.message);
    res.status(500).json({ status: 'error', message: 'Gagal ambil gambar' });
  }
});

// ============================================================
// 3. CUACA (OpenWeatherMap)
// ============================================================
app.get('/api/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.status(400).json({ status: 'error', message: 'Nama kota diperlukan' });
  }
  const API_KEY = '577f7b744218443cec55394aa85208b3'; // Ganti pake punya lo
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
    res.status(500).json({ status: 'error', message: 'Gagal cek cuaca' });
  }
});

// ============================================================
// 4. GEMPA TERKINI (BMKG)
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
    res.status(500).json({ status: 'error', message: 'Gagal ambil data gempa' });
  }
});

// ============================================================
// ROUTE UTAMA — HTML
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
    body { background: #0a0a0a; font-family: 'Courier New', monospace; min-height: 100vh; padding: 20px; color: #00ff88; }
    #loader { position: fixed; top:0; left:0; width:100%; height:100%; background: #0a0a0a; display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:9999; transition: opacity 0.8s; }
    #loader.hidden { opacity:0; pointer-events:none; }
    #loader .glitch { font-size:48px; font-weight:bold; color:#00ff88; text-shadow:0 0 20px rgba(0,255,136,0.6); animation: glitch 1.5s infinite; letter-spacing:6px; }
    @keyframes glitch { 0%,100%{ transform:skew(0); opacity:1; } 25%{ transform:skew(2deg,1deg); opacity:0.8; } 50%{ transform:skew(-2deg,-1deg); opacity:0.9; } 75%{ transform:skew(1deg,-1deg); opacity:0.7; } }
    #loader .sub { color:#00ff88; opacity:0.4; font-size:14px; letter-spacing:8px; animation: blink 1.2s infinite; }
    @keyframes blink { 0%,100%{ opacity:0.4; } 50%{ opacity:0.1; } }
    #app { display:none; max-width:1000px; margin:0 auto; background:rgba(0,0,0,0.85); border:2px solid #00ff88; border-radius:16px; padding:30px; box-shadow:0 0 60px rgba(0,255,136,0.1); }
    .navbar { display:flex; flex-wrap:wrap; gap:8px; border-bottom:1px solid rgba(0,255,136,0.15); padding-bottom:18px; margin-bottom:25px; }
    .navbar .brand { font-size:24px; font-weight:bold; letter-spacing:4px; margin-right:auto; color:#00ff88; }
    .navbar button { background:transparent; border:1px solid rgba(0,255,136,0.3); color:#00ff88; padding:8px 18px; border-radius:6px; font-family:'Courier New',monospace; font-size:14px; cursor:pointer; transition:0.3s; }
    .navbar button:hover { background:#00ff88; color:#0a0a0a; border-color:#00ff88; }
    .navbar button.active { background:#00ff88; color:#0a0a0a; border-color:#00ff88; }
    .page { display:none; animation: fadeUp 0.4s; }
    .page.active { display:block; }
    @keyframes fadeUp { from{ opacity:0; transform:translateY(15px); } to{ opacity:1; transform:translateY(0); } }
    .input-group { display:flex; gap:12px; flex-wrap:wrap; margin:15px 0; }
    .input-group input, .input-group select { flex:1; background:rgba(0,255,136,0.04); border:1px solid rgba(0,255,136,0.2); color:#00ff88; padding:12px 16px; border-radius:8px; font-family:'Courier New',monospace; font-size:15px; outline:none; min-width:180px; }
    .input-group input:focus, .input-group select:focus { border-color:#00ff88; box-shadow:0 0 20px rgba(0,255,136,0.1); }
    .input-group select option { background:#0a0a0a; color:#00ff88; }
    .btn { background:transparent; border:1px solid #00ff88; color:#00ff88; padding:12px 28px; border-radius:8px; font-family:'Courier New',monospace; font-size:15px; font-weight:bold; cursor:pointer; transition:0.3s; text-transform:uppercase; letter-spacing:2px; }
    .btn:hover { background:#00ff88; color:#0a0a0a; box-shadow:0 0 30px rgba(0,255,136,0.2); }
    .result-box { margin-top:20px; background:rgba(0,255,136,0.02); border:1px solid rgba(0,255,136,0.1); border-radius:12px; padding:20px; }
    .result-box .line { padding:6px 0; border-bottom:1px solid rgba(0,255,136,0.04); display:flex; flex-wrap:wrap; gap:8px; }
    .result-box .label { color:rgba(0,255,136,0.5); min-width:130px; }
    .result-box .value { color:#00ff88; font-weight:bold; word-break:break-all; }
    .result-box .value.highlight { color:#ff66ff; }
    .image-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px,1fr)); gap:12px; margin-top:15px; }
    .image-grid img { width:100%; height:150px; object-fit:cover; border-radius:8px; border:1px solid rgba(0,255,136,0.1); }
    .loading-indicator { text-align:center; margin:20px 0; }
    .loading-indicator .spinner { display:inline-block; width:30px; height:30px; border:3px solid rgba(0,255,136,0.1); border-top:3px solid #00ff88; border-radius:50%; animation: spin 0.9s linear infinite; }
    @keyframes spin { 0%{ transform:rotate(0); } 100%{ transform:rotate(360deg); } }
    .loading-indicator p { margin-top:8px; opacity:0.5; animation: blink 1s infinite; }
    .iqc-result-img { max-width:100%; border-radius:12px; border:1px solid rgba(0,255,136,0.15); margin-top:15px; }
    .iqc-settings { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:15px 0; }
    .iqc-settings label { color:rgba(0,255,136,0.6); font-size:13px; display:flex; flex-direction:column; gap:4px; }
    .iqc-settings input, .iqc-settings select { background:rgba(0,255,136,0.04); border:1px solid rgba(0,255,136,0.2); color:#00ff88; padding:8px 12px; border-radius:6px; font-family:'Courier New',monospace; font-size:13px; outline:none; }
    .iqc-settings input:focus, .iqc-settings select:focus { border-color:#00ff88; }
    .footer { text-align:center; font-size:11px; opacity:0.2; margin-top:30px; padding-top:15px; border-top:1px solid rgba(0,255,136,0.05); letter-spacing:3px; }
    @media (max-width:600px) { #app { padding:16px; } .navbar .brand { font-size:18px; } .navbar button { font-size:12px; padding:6px 12px; } .input-group input { font-size:14px; padding:10px; } .btn { font-size:13px; padding:10px 18px; width:100%; } .result-box .line { flex-direction:column; gap:3px; } .result-box .label { min-width:auto; } .iqc-settings { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <div id="loader">
    <div class="glitch">FAWNTOOLS</div>
    <div class="sub">● INITIALIZING ●</div>
  </div>
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
      <h2>📱 Fake Chat iPhone</h2>
      <p style="opacity:0.5;font-size:14px;margin:8px 0;">Ketik pesan (bisa pake emoji 😂) dan atur warna, jam, provider.</p>
      <div class="input-group">
        <input type="text" id="iqc-text" placeholder="Pesan...">
        <button class="btn" onclick="generateIQC()">▶ Generate</button>
      </div>
      <div class="iqc-settings">
        <label>Warna Bubble <input type="text" id="iqc-bubble" value="#34C759"></label>
        <label>Warna Menu <input type="text" id="iqc-menu" value="#1C1C1E"></label>
        <label>Warna Teks <input type="text" id="iqc-textcolor" value="#FFFFFF"></label>
        <label>Font <input type="text" id="iqc-font" value="Poppins"></label>
        <label>Jam Chat <input type="text" id="iqc-chattime" value="12.20"></label>
        <label>Jam Status Bar <input type="text" id="iqc-statustime" value="12.20"></label>
        <label>Provider <input type="text" id="iqc-provider" value="Telkomsel"></label>
      </div>
      <div id="iqc-loading" class="loading-indicator" style="display:none;"><div class="spinner"></div><p>GENERATING...</p></div>
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

    <div class="footer">● FAWNTOOLS ● v3.0 ● ENCRYPTED ●</div>
  </div>

  <script>
    // LOADING HILANG
    setTimeout(() => {
      document.getElementById('loader').classList.add('hidden');
      document.getElementById('app').style.display = 'block';
    }, 2500);

    // NAVIGASI
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

    // ==========================================================
    // IQC GENERATE
    // ==========================================================
    async function generateIQC() {
      const text = document.getElementById('iqc-text').value.trim();
      if (!text) return alert('Isi pesannya dulu bro!');

      const params = new URLSearchParams({
        text,
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
        resultDiv.innerHTML = \`
          <div class="result-box">
            <div class="line"><span class="label">PESAN</span><span class="value highlight">\${text}</span></div>
            <div class="line"><span class="label">BUBBLE</span><span class="value">\${params.get('bubbleColor')}</span></div>
            <div class="line"><span class="label">PROVIDER</span><span class="value">\${params.get('signalName')}</span></div>
            <div class="line"><span class="label">WAKTU</span><span class="value">\${params.get('chatTime')}</span></div>
            <img src="\${url}" class="iqc-result-img" />
            <p style="margin-top:10px;opacity:0.3;font-size:12px;">Klik kanan → Save Image</p>
          </div>
        \`;
      } catch (err) {
        resultDiv.innerHTML = \`<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">\${err.message}</span></div></div>\`;
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
          resultDiv.innerHTML = \`<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">\${data.message}</span></div></div>\`;
          return;
        }
        let html = '<div class="image-grid">';
        data.images.forEach(url => {
          html += \`<img src="\${url}" loading="lazy" onerror="this.style.display='none'" />\`;
        });
        html += '</div>';
        resultDiv.innerHTML = html;
      } catch (e) {
        resultDiv.innerHTML = \`<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">Gagal ambil gambar</span></div></div>\`;
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
      } catch (e) {
        resultDiv.innerHTML = \`<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">Gagal cek cuaca</span></div></div>\`;
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
      } catch (e) {
        resultDiv.innerHTML = \`<div class="result-box"><div class="line"><span class="label">ERROR</span><span class="value highlight">Gagal ambil data gempa</span></div></div>\`;
      } finally {
        loading.style.display = 'none';
      }
    }

    // Auto-load gempa
    document.querySelector('[data-page="gempa"]').addEventListener('click', () => {
      if (!document.getElementById('gempa-result').innerHTML) {
        getGempa();
      }
    });
  </script>
</body>
</html>
  `);
});

// ============================================================
// EXPORT UNTUK VERCEL
// ============================================================
export default app;
