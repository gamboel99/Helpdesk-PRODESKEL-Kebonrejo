// app.js - Prodeskel Kebonrejo (skeleton)
const STORAGE_KEY = 'prodeskel_kebonrejo_v1';
const form = document.getElementById('prodeskelForm');
const mapContainer = document.getElementById('map');
let map, marker;

// tab behavior
document.querySelectorAll('.tabbtn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tabbtn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tabpane').forEach(p=>p.classList.add('hidden'));
    document.getElementById(btn.dataset.tab).classList.remove('hidden');
  });
});
// show first tab by default
document.querySelectorAll('.tabpane').forEach((p,i)=>{ if(i===0) p.classList.remove('hidden'); });

// prefill from URL query string
function prefillFromQuery(){
  const params = new URLSearchParams(window.location.search);
  ['dusun','rw','rt','no_kk','nama','latitude','longitude','editIndex'].forEach(k=>{
    if(params.has(k)){
      const el = document.getElementsByName(k)[0] || document.getElementById(k);
      if(el) el.value = params.get(k) || '';
    }
  });
  // set simple fields for convenience
  if(params.get('dusun')) document.getElementById('dusun').value = params.get('dusun');
  if(params.get('rw')) document.getElementById('rw').value = params.get('rw');
  if(params.get('rt')) document.getElementById('rt').value = params.get('rt');
  if(params.get('nama')) document.getElementById('nama').value = params.get('nama');
  if(params.get('no_kk')) document.getElementById('no_kk').value = params.get('no_kk');
}
prefillFromQuery();

// compute average score across numeric/select inputs (values 1..5)
function computeScore(obj){
  let sum=0,count=0;
  for(const k in obj){
    const v = obj[k];
    if(!v) continue;
    // numeric-like values
    const n = Number(v);
    if(!isNaN(n) && n>0){
      sum+=n; count++;
    }
  }
  return count? (sum/count):0;
}

function classify(avg){
  if(avg>=4.5) return 'Mandiri';
  if(avg>=3.5) return 'Maju';
  if(avg>=2.5) return 'Berkembang';
  if(avg>=1.5) return 'Tertinggal';
  return 'Sangat Tertinggal';
}

// attach GPS and show on map
document.getElementById('btnCapture').addEventListener('click', async ()=>{
  if(!navigator.geolocation){ alert('Browser tidak mendukung geolocation'); return; }
  navigator.geolocation.getCurrentPosition(pos=>{
    const lat = pos.coords.latitude, lng = pos.coords.longitude;
    document.getElementById('latText').textContent = lat.toFixed(6);
    document.getElementById('lngText').textContent = lng.toFixed(6);
    // set hidden inputs
    const latEl = document.getElementsByName('lat')[0];
    const lngEl = document.getElementsByName('lng')[0];
    if(latEl) latEl.value = lat; if(lngEl) lngEl.value = lng;
    // init map
    if(!map){ map = L.map('map').setView([lat,lng],15); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors'}).addTo(map); }
    if(marker) marker.remove();
    marker = L.marker([lat,lng]).addTo(map).bindPopup('Lokasi pengisian').openPopup();
  }, err=>{ alert('Gagal ambil lokasi: '+ (err.message||err.code)); }, {enableHighAccuracy:true, timeout:8000});
});

// save handler
form.addEventListener('submit', function(e){
  e.preventDefault();
  const fd = new FormData(form);
  const rec = {};
  fd.forEach((v,k)=> rec[k]=v);
  // compute score
  const avg = computeScore(rec);
  rec._score = Number(avg.toFixed(2));
  rec._category = classify(avg);
  rec._timestamp = new Date().toISOString();
  // store
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
  // if editIndex provided in query, replace
  const params = new URLSearchParams(window.location.search);
  const editIndex = params.get('editIndex');
  if(editIndex !== null && editIndex !== undefined && editIndex !== ''){
    const idx = Number(editIndex);
    if(!isNaN(idx) && idx>=0 && idx < existing.length){ existing[idx]=rec; localStorage.setItem(STORAGE_KEY, JSON.stringify(existing)); alert('Data diperbarui.'); location.href='index.html'; return; }
  }
  existing.push(rec);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  alert('Data tersimpan. Terima kasih.');
  // optionally redirect to dashboard
  // location.href = 'index.html';
});

document.getElementById('btnReset')?.addEventListener('click', ()=>{ if(confirm('Reset form?')) form.reset(); });

document.getElementById('openDashboard')?.addEventListener('click', ()=>{ location.href='index.html'; });
