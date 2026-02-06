async function loadImages() {
  const res = await fetch('/images');
  const imgs = await res.json();
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';
  imgs.forEach(name => {
    const div = document.createElement('div');
    div.className = 'card';
    const img = document.createElement('img');
    img.src = '/uploads/' + encodeURIComponent(name);
    img.alt = name;
    div.appendChild(img);
    gallery.appendChild(div);
  });
}

window.addEventListener('load', loadImages);
