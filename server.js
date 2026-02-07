const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// storage for uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, safe);
  }
});
const upload = multer({ storage });

// simple basic auth middleware for admin routes
function basicAuth(req, res, next) {
  const auth = req.headers.authorization;
  const adminPass = process.env.ADMIN_PASS || 'JavonBates1234';
  const expected = 'Basic ' + Buffer.from(`admin:${adminPass}`).toString('base64');
  if (auth === expected) return next();
  res.set('WWW-Authenticate', 'Basic realm="Admin"');
  return res.status(401).send('Authentication required');
}

// serve public files
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// serve uploaded images statically
app.use('/uploads', express.static(uploadDir));

// list images and videos
app.get('/images', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Unable to read uploads' });
    // filter common image and video extensions
    const media = files.filter(f => /\.(png|jpe?g|gif|webp|bmp|svg|mp4|webm|mov|avi|mkv)$/i.test(f));
    // return with type info
    const items = media.map(f => ({
      name: f,
      type: /\.(mp4|webm|mov|avi|mkv)$/i.test(f) ? 'video' : 'image'
    }));
    res.json(items);
  });
});

// upload endpoint (protected)
app.post('/upload', basicAuth, upload.fields([{ name: 'media', maxCount: 1 }, { name: 'image', maxCount: 1 }]), (req, res) => {
  const file = (req.files && (req.files.media?.[0] || req.files.image?.[0])) || req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const isVideo = file.mimetype && file.mimetype.startsWith('video/');
  if (!isVideo) return res.json({ filename: file.filename });

  const inputPath = path.join(uploadDir, file.filename);
  const parsed = path.parse(file.filename);
  const outputName = `${parsed.name}-compressed.mp4`;
  const outputPath = path.join(uploadDir, outputName);

  compressVideo(inputPath, outputPath)
    .then(() => {
      fs.unlink(inputPath, () => res.json({ filename: outputName }));
    })
    .catch((err) => {
      console.error('ffmpeg error:', err);
      return res.status(500).json({ error: 'Video compression failed' });
    });
});

function compressVideo(inputPath, outputPath) {
  // Target: smaller files (720p, ~1.5Mbps video, 128kbps audio)
  const args = [
    '-y',
    '-i', inputPath,
    '-vf', 'scale=-2:720',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-b:v', '1500k',
    '-maxrate', '2000k',
    '-bufsize', '3000k',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    outputPath
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('error', reject);
    proc.on('close', code => {
      if (code === 0) return resolve();
      reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}

// delete endpoint (protected)
app.post('/delete', basicAuth, (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'No filename provided' });
  
  // sanitize filename to prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  const filepath = path.join(uploadDir, filename);
  fs.unlink(filepath, (err) => {
    if (err) return res.status(500).json({ error: 'Unable to delete file' });
    res.json({ success: true });
  });
});

// admin check endpoint (for keyboard shortcut auth)
app.get('/admin-check', basicAuth, (req, res) => {
  res.json({ authenticated: true });
});

// --- Simple in-memory chat (persist to file for durability) ---
const chatFile = path.join(__dirname, 'chat.json');
function loadChat() {
  try {
    return JSON.parse(fs.readFileSync(chatFile, 'utf8'));
  } catch { return []; }
}
function saveChat(msgs) {
  fs.writeFileSync(chatFile, JSON.stringify(msgs));
}
let chatMessages = loadChat();
let chatNextId = chatMessages.length ? Math.max(...chatMessages.map(m=>m.id))+1 : 1;

// Get chat messages
app.get('/chat-messages', (req, res) => {
  res.json(chatMessages.slice(-100));
});
// Post chat message
app.post('/chat-message', (req, res) => {
  const { user, text } = req.body;
  if (!user || !text) return res.status(400).json({ error: 'Missing user or text' });
  const msg = { id: chatNextId++, user: user.slice(0,32), text: text.slice(0,300), time: Date.now() };
  chatMessages.push(msg);
  if (chatMessages.length > 200) chatMessages = chatMessages.slice(-200);
  saveChat(chatMessages);
  res.json({ ok: true });
});
// Admin delete chat message
app.post('/chat-delete', basicAuth, (req, res) => {
  const { id } = req.body;
  const idx = chatMessages.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  chatMessages.splice(idx, 1);
  saveChat(chatMessages);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
