// index.js
import express from "express";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

// IQC Checker
app.get("/api/iqc", async (req, res) => {
  const target = req.query.target;
  
  if (!target) {
    return res.status(400).json({
      status: "error",
      message: "Target gak boleh kosong bro!",
      example: "/api/iqc?target=6285715037857"
    });
  }

  try {
    // Simulasi pengecekan dengan delay (biar kaya hacker)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Random results (buat demo)
    const providers = ["Telkomsel", "XL", "Indosat", "Tri", "Smartfren", "By.U"];
    const statuses = ["Active", "Active", "Active", "Inactive", "Suspended"];
    const devices = ["iPhone 15 Pro", "Samsung S24 Ultra", "Xiaomi 14 Pro", "Oppo Find X7", "Vivo X100 Pro"];
    const locations = ["Jakarta", "Bandung", "Surabaya", "Medan", "Makassar", "Yogyakarta"];
    const networks = ["5G", "4G+", "4G", "3G"];

    const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const result = {
      status: "success",
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
        encryption: "AES-256-GCM",
        fingerprint: Math.random().toString(36).substring(2, 15),
        timestamp: new Date().toISOString()
      }
    };

    res.json(result);

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "System failure! Coba lagi nanti."
    });
  }
});

// Root
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>IQC Tools</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            background: #0a0a0a;
            color: #00ff88;
            font-family: 'Courier New', monospace;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            overflow: hidden;
          }

          /* Matrix rain effect */
          .matrix-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.05;
            z-index: 0;
            pointer-events: none;
            background: repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff88 2px, #00ff88 4px);
            background-size: 100% 20px;
            animation: matrix 20s linear infinite;
          }

          @keyframes matrix {
            0% { transform: translateY(0); }
            100% { transform: translateY(20px); }
          }

          .container {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 800px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ff88;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 0 50px rgba(0, 255, 136, 0.2), inset 0 0 50px rgba(0, 255, 136, 0.05);
          }

          /* Glitch effect */
          .glitch {
            position: relative;
            font-size: 32px;
            font-weight: bold;
            text-transform: uppercase;
            color: #00ff88;
            text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
            animation: glitch 3s infinite;
          }

          @keyframes glitch {
            0%, 100% { transform: none; opacity: 1; }
            25% { transform: translate(-2px, 2px); opacity: 0.8; }
            50% { transform: translate(2px, -2px); opacity: 0.9; }
            75% { transform: translate(-1px, 1px); opacity: 0.7; }
          }

          .glitch::before,
          .glitch::after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }

          .glitch::before {
            color: #ff00ff;
            animation: glitch-before 2s infinite linear;
            opacity: 0.5;
          }

          .glitch::after {
            color: #00ffff;
            animation: glitch-after 3s infinite linear;
            opacity: 0.5;
          }

          @keyframes glitch-before {
            0%, 100% { transform: translate(0); }
            20% { transform: translate(-3px, 3px); }
            40% { transform: translate(3px, -3px); }
            60% { transform: translate(-2px, 2px); }
            80% { transform: translate(2px, -2px); }
          }

          @keyframes glitch-after {
            0%, 100% { transform: translate(0); }
            25% { transform: translate(4px, -4px); }
            50% { transform: translate(-4px, 4px); }
            75% { transform: translate(2px, -2px); }
          }

          .subtitle {
            color: #00ff88;
            opacity: 0.6;
            font-size: 14px;
            margin-top: 8px;
            letter-spacing: 4px;
          }

          .input-group {
            margin: 30px 0;
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }

          .input-group input {
            flex: 1;
            background: rgba(0, 255, 136, 0.05);
            border: 1px solid #00ff88;
            color: #00ff88;
            padding: 14px 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            outline: none;
            transition: all 0.3s;
            min-width: 200px;
          }

          .input-group input:focus {
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
            background: rgba(0, 255, 136, 0.1);
          }

          .input-group input::placeholder {
            color: rgba(0, 255, 136, 0.3);
          }

          .btn {
            background: transparent;
            border: 1px solid #00ff88;
            color: #00ff88;
            padding: 14px 30px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 2px;
          }

          .btn:hover {
            background: #00ff88;
            color: #0a0a0a;
            box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
          }

          .btn:active {
            transform: scale(0.95);
          }

          /* Result box */
          #result {
            margin-top: 30px;
            display: none;
            animation: fadeIn 0.5s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .result-box {
            background: rgba(0, 255, 136, 0.03);
            border: 1px solid rgba(0, 255, 136, 0.2);
            border-radius: 12px;
            padding: 24px;
            font-size: 14px;
          }

          .result-box .line {
            padding: 8px 0;
            border-bottom: 1px solid rgba(0, 255, 136, 0.05);
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .result-box .line:last-child {
            border-bottom: none;
          }

          .result-box .label {
            color: rgba(0, 255, 136, 0.5);
            min-width: 140px;
          }

          .result-box .value {
            color: #00ff88;
            font-weight: bold;
            word-break: break-all;
          }

          .result-box .value.highlight {
            color: #ff00ff;
            text-shadow: 0 0 10px rgba(255, 0, 255, 0.3);
          }

          .status-badge {
            display: inline-block;
            padding: 2px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
          }

          .status-badge.active {
            background: rgba(0, 255, 136, 0.2);
            color: #00ff88;
            border: 1px solid #00ff88;
          }

          .status-badge.inactive {
            background: rgba(255, 0, 0, 0.2);
            color: #ff4444;
            border: 1px solid #ff4444;
          }

          .status-badge.suspended {
            background: rgba(255, 165, 0, 0.2);
            color: #ffa500;
            border: 1px solid #ffa500;
          }

          /* Loading */
          .loading {
            margin-top: 30px;
            display: none;
            text-align: center;
          }

          .loading .spinner {
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 3px solid rgba(0, 255, 136, 0.1);
            border-top: 3px solid #00ff88;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .loading p {
            margin-top: 12px;
            opacity: 0.6;
            font-size: 14px;
            animation: blink 1s infinite;
          }

          @keyframes blink {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.2; }
          }

          /* Footer */
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(0, 255, 136, 0.1);
            text-align: center;
            font-size: 12px;
            opacity: 0.3;
            letter-spacing: 1px;
          }

          /* Responsive */
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            .glitch {
              font-size: 24px;
            }
            .input-group input {
              font-size: 14px;
              padding: 12px 16px;
            }
            .btn {
              font-size: 14px;
              padding: 12px 24px;
              width: 100%;
            }
            .result-box .line {
              flex-direction: column;
              gap: 4px;
            }
            .result-box .label {
              min-width: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="matrix-bg"></div>

        <div class="container">
          <div class="glitch" data-text="IQC TOOLS">IQC TOOLS</div>
          <div class="subtitle">● INFORMATION QUALITY CHECKER ●</div>

          <div class="input-group">
            <input type="text" id="targetInput" placeholder="target@domain.com / 6285715037857" />
            <button class="btn" onclick="startIQC()">▶ EXECUTE</button>
          </div>

          <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>INITIALIZING SCAN...</p>
          </div>

          <div id="result"></div>

          <div class="footer">● SECURE CONNECTION ● ENCRYPTED ●</div>
        </div>

        <script>
          async function startIQC() {
            const target = document.getElementById('targetInput').value.trim();
            if (!target) {
              alert('Masukin target dulu bro!');
              return;
            }

            const resultDiv = document.getElementById('result');
            const loadingDiv = document.getElementById('loading');

            // Show loading
            loadingDiv.style.display = 'block';
            resultDiv.style.display = 'none';
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
                  <div class="line">
                    <span class="label">● TARGET</span>
                    <span class="value highlight">\${d.target}</span>
                  </div>
                  <div class="line">
                    <span class="label">● PROVIDER</span>
                    <span class="value">\${d.provider}</span>
                  </div>
                  <div class="line">
                    <span class="label">● STATUS</span>
                    <span class="status-badge \${statusClass}">\${d.status.toUpperCase()}</span>
                  </div>
                  <div class="line">
                    <span class="label">● DEVICE</span>
                    <span class="value">\${d.device}</span>
                  </div>
                  <div class="line">
                    <span class="label">● LOCATION</span>
                    <span class="value">\${d.location}</span>
                  </div>
                  <div class="line">
                    <span class="label">● NETWORK</span>
                    <span class="value">\${d.network}</span>
                  </div>
                  <div class="line">
                    <span class="label">● IMEI</span>
                    <span class="value">\${d.imei}</span>
                  </div>
                  <div class="line">
                    <span class="label">● IP ADDRESS</span>
                    <span class="value">\${d.ip}</span>
                  </div>
                  <div class="line">
                    <span class="label">● LAST SEEN</span>
                    <span class="value">\${new Date(d.last_seen).toLocaleString()}</span>
                  </div>
                  <div class="line">
                    <span class="label">● THREAT LEVEL</span>
                    <span class="value">\${d.threat_level}/10</span>
                  </div>
                  <div class="line">
                    <span class="label">● ENCRYPTION</span>
                    <span class="value">\${d.encryption}</span>
                  </div>
                  <div class="line">
                    <span class="label">● FINGERPRINT</span>
                    <span class="value" style="font-size:11px;">\${d.fingerprint}</span>
                  </div>
                  <div class="line">
                    <span class="label">● TIMESTAMP</span>
                    <span class="value">\${new Date(d.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              \`;

              resultDiv.innerHTML = html;
              resultDiv.style.display = 'block';

            } catch (error) {
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
            if (e.key === 'Enter') startIQC();
          });

          // Auto focus
          document.getElementById('targetInput').focus();
        </script>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(\`✅ IQC Tools running on http://localhost:\${PORT}\`);
});
