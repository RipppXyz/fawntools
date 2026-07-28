import express from 'express';

const app = express();

// ============================================================
// ROUTE IQC API
// ============================================================
app.get('/api/iqc', (req, res) => {
  const target = req.query.target;
  if (!target) {
    return res.status(400).json({
      status: 'error',
      message: 'Target gak boleh kosong bro!',
      example: '/api/iqc?target=6285715037857'
    });
  }

  // Simulasi data random (biar kaya hack)
  const providers = ['Telkomsel', 'XL', 'Indosat', 'Tri', 'Smartfren', 'By.U'];
  const statuses = ['Active', 'Active', 'Active', 'Inactive', 'Suspended'];
  const devices = ['iPhone 15 Pro', 'Samsung S24 Ultra', 'Xiaomi 14 Pro', 'Oppo Find X7', 'Vivo X100 Pro'];
  const locations = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Makassar', 'Yogyakarta'];
  const networks = ['5G', '4G+', '4G', '3G'];

  const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const result = {
    status: 'success',
    data: {
      target: target,
      provider: random(providers),
      status: random(statuses),
      device: random(devices),
      location: random(locations),
      network: random(networks),
      imei: `35${Math.floor(Math.random() * 100000000000000)}`,
      ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      last_seen: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      threat_level: Math.floor(Math.random() * 10) + 1,
      encryption: 'AES-256-GCM',
      fingerprint: Math.random().toString(36).substring(2, 15),
      timestamp: new Date().toISOString()
    }
  };

  // Simulasi delay (biar keliatan loading)
  setTimeout(() => res.json(result), 1200);
});

// ============================================================
// ROUTE UTAMA — Halaman Web dengan Animasi Loading Hacker
// ============================================================
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FAWNTOOLS · IQC</title>
        <style>
          /* RESET */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: #0a0a0a;
            font-family: 'Courier New', monospace;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            margin: 0;
            overflow: hidden;
          }

          /* ===== ANIMASI LOADING OVERLAY ===== */
          #loader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #0a0a0a;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            transition: opacity 1s ease, visibility 1s ease;
          }
          #loader.hidden {
            opacity: 0;
            visibility: hidden;
          }

          #loader .glitch {
            font-size: 48px;
            font-weight: bold;
            color: #00ff88;
            text-shadow: 0 0 20px rgba(0,255,136,0.6);
            animation: glitch 1.5s infinite;
            margin-bottom: 20px;
            letter-spacing: 6px;
          }
          @keyframes glitch {
            0%, 100% { transform: skew(0deg, 0deg); opacity: 1; }
            25% { transform: skew(2deg, 1deg); opacity: 0.8; }
            50% { transform: skew(-2deg, -1deg); opacity: 0.9; }
            75% { transform: skew(1deg, -1deg); opacity: 0.7; }
          }

          #loader .sub {
            color: #00ff88;
            opacity: 0.4;
            font-size: 14px;
            letter-spacing: 8px;
            animation: blink 1.2s infinite;
          }
          @keyframes blink {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.1; }
          }

          /* Matrix rain background (di loading) */
          #matrix-canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.08;
            z-index: -1;
          }

          /* ===== KONTEN UTAMA ===== */
          #main-content {
            display: none;
            width: 100%;
            max-width: 800px;
            background: rgba(0,0,0,0.85);
            border: 2px solid #00ff88;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 0 60px rgba(0,255,136,0.15);
            position: relative;
            animation: fadeUp 0.8s ease;
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(0,255,136,0.1);
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header .title {
            font-size: 28px;
            font-weight: bold;
            color: #00ff88;
            text-shadow: 0 0 15px rgba(0,255,136,0.3);
            letter-spacing: 4px;
          }
          .header .status {
            font-size: 12px;
            color: #00ff88;
            opacity: 0.5;
            letter-spacing: 2px;
          }

          .input-group {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin: 25px 0 30px;
          }
          .input-group input {
            flex: 1;
            background: rgba(0,255,136,0.04);
            border: 1px solid rgba(0,255,136,0.3);
            color: #00ff88;
            padding: 14px 18px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            outline: none;
            transition: 0.3s;
            min-width: 200px;
          }
          .input-group input:focus {
            border-color: #00ff88;
            box-shadow: 0 0 25px rgba(0,255,136,0.15);
            background: rgba(0,255,136,0.07);
          }
          .input-group input::placeholder {
            color: rgba(0,255,136,0.25);
          }
          .btn {
            background: transparent;
            border: 1px solid #00ff88;
            color: #00ff88;
            padding: 14px 32px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 2px;
            cursor: pointer;
            transition: 0.3s;
            text-transform: uppercase;
          }
          .btn:hover {
            background: #00ff88;
            color: #0a0a0a;
            box-shadow: 0 0 40px rgba(0,255,136,0.25);
          }
          .btn:active { transform: scale(0.96); }

          /* Loading indicator saat execute */
          #exec-loading {
            display: none;
            text-align: center;
            margin: 20px 0;
          }
          #exec-loading .spinner {
            display: inline-block;
            width: 30px;
            height: 30px;
            border: 3px solid rgba(0,255,136,0.1);
            border-top: 3px solid #00ff88;
            border-radius: 50%;
            animation: spin 0.9s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          #exec-loading p {
            color: rgba(0,255,136,0.5);
            font-size: 14px;
            margin-top: 10px;
            letter-spacing: 3px;
            animation: blink 1s infinite;
          }

          /* Result box */
          #result {
            margin-top: 25px;
            display: none;
            border-top: 1px solid rgba(0,255,136,0.08);
            padding-top: 25px;
          }
          .result-box {
            background: rgba(0,255,136,0.02);
            border: 1px solid rgba(0,255,136,0.12);
            border-radius: 12px;
            padding: 22px;
          }
          .result-box .line {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            padding: 8px 0;
            border-bottom: 1px solid rgba(0,255,136,0.04);
          }
          .result-box .line:last-child { border-bottom: none; }
          .result-box .label {
            color: rgba(0,255,136,0.4);
            min-width: 130px;
            font-size: 13px;
          }
          .result-box .value {
            color: #00ff88;
            font-weight: bold;
            word-break: break-all;
          }
          .result-box .value.highlight {
            color: #ff66ff;
            text-shadow: 0 0 12px rgba(255,0,255,0.2);
          }
          .status-badge {
            display: inline-block;
            padding: 2px 16px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-badge.active {
            background: rgba(0,255,136,0.15);
            color: #00ff88;
            border: 1px solid #00ff88;
          }
          .status-badge.inactive {
            background: rgba(255,0,0,0.15);
            color: #ff4444;
            border: 1px solid #ff4444;
          }
          .status-badge.suspended {
            background: rgba(255,165,0,0.15);
            color: #ffa500;
            border: 1px solid #ffa500;
          }

          .footer {
            margin-top: 30px;
            padding-top: 18px;
            border-top: 1px solid rgba(0,255,136,0.06);
            text-align: center;
            font-size: 11px;
            color: rgba(0,255,136,0.2);
            letter-spacing: 3px;
          }

          @media (max-width: 600px) {
            #loader .glitch { font-size: 32px; }
            #main-content { padding: 20px; }
            .header .title { font-size: 22px; }
            .input-group input { font-size: 14px; padding: 12px; }
            .btn { font-size: 14px; padding: 12px 20px; width: 100%; }
            .result-box .line { flex-direction: column; gap: 4px; }
            .result-box .label { min-width: auto; }
          }
        </style>
      </head>
      <body>

        <!-- ===== OVERLAY LOADING HACKER ===== -->
        <div id="loader">
          <canvas id="matrix-canvas"></canvas>
          <div class="glitch">FAWNTOOLS</div>
          <div class="sub">● INITIALIZING ●</div>
        </div>

        <!-- ===== KONTEN UTAMA ===== -->
        <div id="main-content">
          <div class="header">
            <span class="title">⬡ IQC</span>
            <span class="status">● SECURE ●</span>
          </div>

          <div class="input-group">
            <input type="text" id="targetInput" placeholder="target / nomor / email" />
            <button class="btn" onclick="executeIQC()">▶ EXECUTE</button>
          </div>

          <div id="exec-loading">
            <div class="spinner"></div>
            <p>SCANNING TARGET...</p>
          </div>

          <div id="result"></div>

          <div class="footer">● FAWNTOOLS ● v1.0 ● ENCRYPTED ●</div>
        </div>

        <script>
          // ============================================================
          // 1. ANIMASI LOADING (Matrix rain + hilang setelah 3 detik)
          // ============================================================
          const canvas = document.getElementById('matrix-canvas');
          const ctx = canvas.getContext('2d');

          function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
          }
          window.addEventListener('resize', resizeCanvas);
          resizeCanvas();

          const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const columns = Math.floor(canvas.width / 18);
          const drops = Array(columns).fill(1);

          function drawMatrix() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00ff88';
            ctx.font = '16px monospace';
            for (let i = 0; i < drops.length; i++) {
              const text = chars[Math.floor(Math.random() * chars.length)];
              ctx.fillText(text, i * 18, drops[i] * 18);
              if (drops[i] * 18 > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
              }
              drops[i]++;
            }
          }
          const matrixInterval = setInterval(drawMatrix, 45);

          // Hilangkan loading setelah 3 detik
          setTimeout(() => {
            document.getElementById('loader').classList.add('hidden');
            document.getElementById('main-content').style.display = 'block';
            clearInterval(matrixInterval);
          }, 3200);

          // ============================================================
          // 2. FUNGSI IQC
          // ============================================================
          async function executeIQC() {
            const target = document.getElementById('targetInput').value.trim();
            if (!target) {
              alert('Isi target dulu bro!');
              return;
            }

            const resultDiv = document.getElementById('result');
            const loadingDiv = document.getElementById('exec-loading');

            resultDiv.style.display = 'none';
            loadingDiv.style.display = 'block';
            resultDiv.innerHTML = '';

            try {
              const response = await fetch(\`/api/iqc?target=\${encodeURIComponent(target)}\`);
              const data = await response.json();

              loadingDiv.style.display = 'none';

              if (data.status === 'error') {
                resultDiv.innerHTML = \`
                  <div class="result-box">
                    <div class="line">
                      <span class="label">[ERROR]</span>
                      <span class="value highlight">\${data.message}</span>
                    </div>
                  </div>
                \`;
                resultDiv.style.display = 'block';
                return;
              }

              const d = data.data;
              const statusClass = d.status.toLowerCase();

              let html = \`
                <div class="result-box">
                  <div class="line"><span class="label">● TARGET</span><span class="value highlight">\${d.target}</span></div>
                  <div class="line"><span class="label">● PROVIDER</span><span class="value">\${d.provider}</span></div>
                  <div class="line"><span class="label">● STATUS</span><span class="status-badge \${statusClass}">\${d.status.toUpperCase()}</span></div>
                  <div class="line"><span class="label">● DEVICE</span><span class="value">\${d.device}</span></div>
                  <div class="line"><span class="label">● LOCATION</span><span class="value">\${d.location}</span></div>
                  <div class="line"><span class="label">● NETWORK</span><span class="value">\${d.network}</span></div>
                  <div class="line"><span class="label">● IMEI</span><span class="value">\${d.imei}</span></div>
                  <div class="line"><span class="label">● IP ADDRESS</span><span class="value">\${d.ip}</span></div>
                  <div class="line"><span class="label">● LAST SEEN</span><span class="value">\${new Date(d.last_seen).toLocaleString()}</span></div>
                  <div class="line"><span class="label">● THREAT LEVEL</span><span class="value">\${d.threat_level}/10</span></div>
                  <div class="line"><span class="label">● ENCRYPTION</span><span class="value">\${d.encryption}</span></div>
                  <div class="line"><span class="label">● FINGERPRINT</span><span class="value" style="font-size:11px;">\${d.fingerprint}</span></div>
                  <div class="line"><span class="label">● TIMESTAMP</span><span class="value">\${new Date(d.timestamp).toLocaleString()}</span></div>
                </div>
              \`;
              resultDiv.innerHTML = html;
              resultDiv.style.display = 'block';

            } catch (err) {
              loadingDiv.style.display = 'none';
              resultDiv.innerHTML = \`
                <div class="result-box">
                  <div class="line">
                    <span class="label">[FATAL]</span>
                    <span class="value highlight">System crash! Coba lagi nanti.</span>
                  </div>
                </div>
              \`;
              resultDiv.style.display = 'block';
            }
          }

          // Enter key support
          document.getElementById('targetInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') executeIQC();
          });
        </script>
      </body>
    </html>
  `);
});

// ============================================================
// EXPORT UNTUK VERCEL (WAJIB!)
// ============================================================
export default app;
