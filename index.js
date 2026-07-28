const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const app = express();

// ============================================================
// API IQC
// ============================================================
app.get('/api/iqc', async (req, res) => {
  const { text } = req.query;
  if (!text) return res.status(400).json({ status: 'error', message: 'Text-nya diisi dulu bro!' });
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
    res.status(500).json({ status: 'error', message: 'Gagal generate fake chat' });
  }
});

// ============================================================
// API IMAGE SEARCH
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
    res.status(500).json({ status: 'error', message: 'Gagal ambil gambar' });
  }
});

// ============================================================
// API CUACA
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
    res.status(500).json({ status: 'error', message: 'Gagal cek cuaca' });
  }
});

// ============================================================
// API GEMPA
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
// API KOMIK
// ============================================================
app.get('/api/komik', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ status: 'error', message: 'Judul komik diperlukan!' });
  try {
    const response = await axios.get(`https://komiku-api.vercel.app/api/search/${encodeURIComponent(q)}`, { timeout: 10000 });
    const data = response.data;
    if (!data || data.length === 0) return res.json({ status: 'error', message: 'Komik gak ditemukan' });
    const komik = data[0];
    res.json({ status: 'success', title: komik.title || 'N/A', chapter: komik.chapter || 'N/A', thumbnail: komik.thumb || '', link: komik.link || '' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Gagal ambil data komik' });
  }
});

// ============================================================
// API TIKTOK
// ============================================================
app.get('/api/tiktok', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ status: 'error', message: 'Link TikTok diperlukan!' });
  try {
    const response = await axios.get(`https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`, { timeout: 15000 });
    const data = response.data;
    if (!data || !data.video_url) return res.json({ status: 'error', message: 'Gagal ambil video TikTok' });
    res.json({ status: 'success', title: data.title || 'TikTok Video', video: data.video_url, thumbnail: data.thumbnail || '', duration: data.duration || 'N/A' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Gagal download TikTok' });
  }
});

// ============================================================
// API INSTAGRAM
// ============================================================
app.get('/api/instagram', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ status: 'error', message: 'Link Instagram diperlukan!' });
  try {
    const response = await axios.get(`https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`, { timeout: 10000 });
    const data = response.data;
    if (!data || !data.thumbnail_url) return res.json({ status: 'error', message: 'Gagal ambil data Instagram' });
    res.json({ status: 'success', title: data.title || 'Instagram Post', thumbnail: data.thumbnail_url, author: data.author_name || 'Unknown', author_url: data.author_url || '' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Gagal download Instagram' });
  }
});

// ============================================================
// SERVE HTML (tanpa public)
// ============================================================
app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'index.html');
  res.sendFile(htmlPath);
});

// ============================================================
// EXPORT
// ============================================================
module.exports = app;
