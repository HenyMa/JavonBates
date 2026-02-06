document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = document.getElementById('username').value || 'admin';
  const pass = document.getElementById('password').value || '';
  const fileInput = document.getElementById('imageInput');
  const file = fileInput.files[0];
  const status = document.getElementById('status');
  if (!file) return status.textContent = 'Select a file first.';

  const form = new FormData();
  form.append('image', file);

  const auth = 'Basic ' + btoa(`${user}:${pass}`);
  try {
    const res = await fetch('/upload', { method: 'POST', body: form, headers: { 'Authorization': auth } });
    if (!res.ok) {
      const txt = await res.text();
      status.textContent = 'Upload failed: ' + txt;
      return;
    }
    const json = await res.json();
    status.textContent = 'Uploaded: ' + json.filename;
  } catch (err) {
    status.textContent = 'Error: ' + err.message;
  }
});
