const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
  const adminPass = process.env.ADMIN_PASS || 'password';
  const expected = 'Basic ' + Buffer.from(`admin:${adminPass}`).toString('base64');
  if (auth === expected) return next();
  res.set('WWW-Authenticate', 'Basic realm="Admin"');
  return res.status(401).send('Authentication required');
}

// serve public files
app.use(express.static(path.join(__dirname, 'public')));

// serve uploaded images statically
app.use('/uploads', express.static(uploadDir));

// list images
app.get('/images', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Unable to read uploads' });
    // filter common image extensions
    const images = files.filter(f => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(f));
    res.json(images);
  });
});

// upload endpoint (protected)
app.post('/upload', basicAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ filename: req.file.filename });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
