# Bates Website — Image gallery with admin upload

Simple Node.js + Express app that allows image uploads (admin) and displays them in a public gallery.

Quick start

1. Install dependencies:

```bash
npm install
```

2. (Optional) set admin password (defaults to `password`):

Windows PowerShell:

```powershell
$env:ADMIN_PASS = "yourpassword"
npm start
```

Linux / macOS:

```bash
ADMIN_PASS=yourpassword npm start
```

3. Open `http://localhost:3000` to view the gallery.
4. Open `http://localhost:3000/admin.html` to upload images (username `admin`).

Files

- `server.js` — backend server, upload handling
- `public/` — frontend files (`index.html`, `admin.html`, client JS)
- `uploads/` — uploaded images (created at runtime)
