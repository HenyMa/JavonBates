let currentSize = 280;
const sizeSlider = document.getElementById('sizeSlider');
const sizeValue = document.getElementById('sizeValue');
const sizeControl = document.getElementById('sizeControl');
if (sizeSlider && sizeValue) {
  sizeSlider.value = String(currentSize);
  sizeValue.textContent = currentSize + 'px';
  document.documentElement.style.setProperty('--media-size', currentSize + 'px');
}

async function loadMedia() {
  const res = await fetch('/images');
  const items = await res.json();
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';
  
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'card';
    div.dataset.filename = item.name;
    
    if (item.type === 'video') {
      const video = document.createElement('video');
      video.className = 'media-video';
      video.src = '/uploads/' + encodeURIComponent(item.name);
      video.controls = true;
      video.style.maxWidth = '100%';
      video.style.objectFit = 'cover';
      video.style.borderRadius = '4px';
      div.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = '/uploads/' + encodeURIComponent(item.name);
      img.alt = item.name;
      div.appendChild(img);
    }
    
    gallery.appendChild(div);
  });
}

// Size control
if (sizeSlider) {
  sizeSlider.addEventListener('input', (e) => {
    currentSize = parseInt(e.target.value);
    if (sizeValue) sizeValue.textContent = currentSize + 'px';
    document.documentElement.style.setProperty('--media-size', currentSize + 'px');
  });
}

// Edit mode toggle - show admin panel with keyboard shortcut or URL param
const isAdminMode = new URLSearchParams(window.location.search).has('admin');
if (isAdminMode) {
  showAdminPanel();
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault();
    const pass = prompt('Admin password:');
    if (!pass) return;
    fetch('/admin-check', {
      headers: { 'Authorization': 'Basic ' + btoa('admin:' + pass) }
    }).then(r => r.ok ? showAdminPanel() : alert('Wrong password'));
  }
});

function showAdminPanel() {
  document.querySelectorAll('.card').forEach(card => {
    const btn = document.createElement('button');
    btn.textContent = '🗑';
    btn.style.position = 'absolute';
    btn.style.top = '4px';
    btn.style.right = '4px';
    btn.style.background = '#ff4444';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.padding = '4px 8px';
    btn.style.borderRadius = '4px';
    btn.style.cursor = 'pointer';
    btn.onclick = () => deleteMedia(card.dataset.filename);
    card.style.position = 'relative';
    card.appendChild(btn);
  });
}

async function deleteMedia(filename) {
  const pass = prompt('Admin password to confirm delete:');
  if (!pass) return;
  
  try {
    const res = await fetch('/delete', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa('admin:' + pass),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filename })
    });
    
    if (res.ok) {
      loadMedia();
    } else {
      alert('Delete failed: ' + await res.text());
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

window.addEventListener('load', loadMedia);

document.addEventListener('fullscreenchange', () => {
  const fsEl = document.fullscreenElement;
  const videos = document.querySelectorAll('video.media-video');
  videos.forEach(v => {
    if (fsEl === v) {
      v.style.objectFit = 'contain';
      v.style.background = '#000';
    } else {
      v.style.objectFit = 'cover';
      v.style.background = '';
    }
  });
});
