// Prodeskel Lite v2 – Kebonrejo
const LS_DATA = 'prodeskel_data_v2';
const LS_CFG  = 'prodeskel_cfg_v2';

const defaultConfig = {
  weights: { ekonomi: 20, pendidikan: 20, kesehatan: 20, sanitasi: 20, partisipasi: 20 },
  thresholds: { low: 39, mid: 60, high: 80 }
};

let config = loadConfig();
let data = loadData(); // array of records
let INDICATORS = [];   // loaded from data/indicators.json

// ===== Load indicators =====
fetch('data/indicators.json').then(r=>{
  if(!r.ok) throw new Error('Gagal memuat indicators.json');
  return r.json();
}).then(json=>{
  INDICATORS = json;
  renderIndicatorControls();
  applyURLPrefill();      // NEW: prefill from URL
  renderAll();
}).catch(err=>{
  document.getElementById('dynamicIndicators').innerHTML = `<div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">Tidak bisa memuat daftar indikator. Pastikan folder <code>/data/indicators.json</code> tersedia di hosting.</div>`;
  console.error(err);
  renderAll();
});

function loadConfig(){ try { return JSON.parse(localStorage.getItem(LS_CFG)) || structuredClone(defaultConfig); } catch(e){ return structuredClone(defaultConfig);} }
function saveConfig(){ localStorage.setItem(LS_CFG, JSON.stringify(config)); syncConfigUI(); renderAll(); }

function loadData(){ try { return JSON.parse(localStorage.getItem(LS_DATA)) || []; } catch(e){ return []; } }
function persistData(){ localStorage.setItem(LS_DATA, JSON.stringify(data)); renderAll(); }

function clamp(n, min, max){ return Math.max(min, Math.min(max, Number(n||0))); }

// Compute per-dimension average from indicators
function computeDimensionScores(rec){
  const dims = ['ekonomi','pendidikan','kesehatan','sanitasi','partisipasi'];
  const dimScores = { ekonomi:[], pendidikan:[], kesehatan:[], sanitasi:[], partisipasi:[] };
  INDICATORS.forEach(ind => {
    const v = rec.ind && rec.ind[ind.id];
    if(v==null) return;
    const opt = (ind.options || []).find(o=> String(o.label) === String(v));
    const score = opt ? Number(opt.score) : Number(v);
    if(!isNaN(score)) dimScores[ind.dim].push(clamp(score,0,4));
  });
  // average per dimension 0..4
  let result = {};
  dims.forEach(d => {
    if(dimScores[d].length===0) result[d] = 0;
    else result[d] = dimScores[d].reduce((a,b)=>a+b,0) / dimScores[d].length;
  });
  return result;
}

function computeTotalScore(rec){
  const w = config.weights;
  const dims = computeDimensionScores(rec);
  let score = 0, totalW = 0;
  Object.keys(dims).forEach(k=>{
    const part = (dims[k]/4)*100 * (clamp(w[k],0,100)/100);
    score += part; totalW += clamp(w[k],0,100);
  });
  if(totalW<=0) return 0;
  return Math.round(score * 10) / 10;
}

function classify(score){
  const { low, mid, high } = config.thresholds;
  if(score >= high) return 'Mandiri';
  if(score >= mid) return 'Maju';
  if(score > low) return 'Berkembang';
  return 'Tertinggal';
}

// ===== Tabs =====
const tabs = document.querySelectorAll('.tab-btn');
const panels = {
  input: document.getElementById('panel-input'),
  rekap: document.getElementById('panel-rekap'),
  pengaturan: document.getElementById('panel-pengaturan'),
  bantuan: document.getElementById('panel-bantuan')
};
tabs.forEach(btn => btn.addEventListener('click', () => {
  const tab = btn.getAttribute('data-tab');
  tabs.forEach(b => b.classList.remove('bg-indigo-600','text-white'));
  tabs.forEach(b => b.classList.add('bg-white'));
  btn.classList.add('bg-indigo-600','text-white');
  Object.values(panels).forEach(p => p.classList.add('hidden'));
  panels[tab].classList.remove('hidden');
}));

// ===== Indicator Controls =====
function renderIndicatorControls(){
  const wrap = document.getElementById('dynamicIndicators');
  wrap.innerHTML = '';
  const groups = [
    ['ekonomi','Ekonomi'],['pendidikan','Pendidikan'],['kesehatan','Kesehatan'],
    ['sanitasi','Sanitasi/Lingkungan'],['partisipasi','Partisipasi/Kelembagaan']
  ];
  groups.forEach(([key, title])=>{
    const items = INDICATORS.filter(i=>i.dim===key);
    const fieldset = document.createElement('div');
    fieldset.className = 'p-3 rounded-xl border';
    fieldset.innerHTML = `<div class="font-medium mb-2">${title}</div>`;
    items.forEach(ind => {
      const id = `ind_${ind.id}`;
      const row = document.createElement('div');
      row.className = 'grid grid-cols-1 md:grid-cols-2 gap-2 items-center';
      const label = document.createElement('label');
      label.className = 'text-sm';
      label.setAttribute('for', id);
      label.textContent = ind.label;
      const control = document.createElement('select');
      control.className = 'w-full px-3 py-2 rounded-xl border';
      control.name = id;
      control.id = id;
      ind.options.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt.label;
        o.textContent = `${opt.label}`;
        control.appendChild(o);
      });
      row.append(label, control);
      fieldset.appendChild(row);
    });
    wrap.appendChild(fieldset);
  });
}

// ===== URL Prefill =====
function applyURLPrefill(){
  const params = new URLSearchParams(window.location.search);
  const form = document.getElementById('formKK');
  const fields = ['dusun','rw','rt','kk','nama'];
  let any = false;
  fields.forEach(k=>{
    const v = params.get(k);
    if(v){ form[k].value = v; any = true; }
  });
  if(params.has('editIndex')) form.editIndex.value = params.get('editIndex')||'';
  if(any){
    document.getElementById('prefillHint').textContent = 'Form terisi otomatis dari URL. Silakan lengkapi indikator di bawah ini lalu Simpan.';
    // pastikan tab input aktif
    tabs.forEach(b => b.classList.remove('bg-indigo-600','text-white')); 
    tabs[0].classList.add('bg-indigo-600','text-white');
    Object.values(panels).forEach(p => p.classList.add('hidden'));
    panels.input.classList.remove('hidden');
  }
}

// ===== Form handling =====
const form = document.getElementById('formKK');
const btnResetForm = document.getElementById('btnResetForm');

function attachGPS(rec){
  return new Promise(resolve=>{
    if(!navigator.geolocation){ rec.latitude=null; rec.longitude=null; return resolve(rec); }
    const opts = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 };
    navigator.geolocation.getCurrentPosition(pos=>{
      rec.latitude = pos.coords.latitude;
      rec.longitude = pos.coords.longitude;
      // tampilkan ke input readonly
      if(form.latitude) form.latitude.value = rec.latitude ?? '';
      if(form.longitude) form.longitude.value = rec.longitude ?? '';
      resolve(rec);
    }, _err=>{
      rec.latitude = null; rec.longitude = null; resolve(rec);
    }, opts);
  });
}

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(form);
  const rec = Object.fromEntries(fd.entries());
  const ind = {};
  INDICATORS.forEach(x=>{
    const key = `ind_${x.id}`;
    ind[x.id] = rec[key];
    delete rec[key];
  });
  rec.ind = ind;
  // GPS attach before compute+save
  await attachGPS(rec);
  rec.score = computeTotalScore(rec);
  rec.klas = classify(rec.score);
  const idx = rec.editIndex !== '' ? Number(rec.editIndex) : -1;
  delete rec.editIndex;
  if(idx>=0 && data[idx]) data[idx] = rec; else data.push(rec);
  persistData();
  form.reset();
  if(form.latitude) form.latitude.value=''; if(form.longitude) form.longitude.value='';
});

btnResetForm.addEventListener('click', ()=> form.reset());

function editRow(i){
  const r = data[i]; if(!r) return;
  form.dusun.value = r.dusun||'';
  form.rw.value = r.rw||'';
  form.rt.value = r.rt||'';
  form.kk.value = r.kk||'';
  form.nama.value = r.nama||'';
  form.latitude.value = r.latitude ?? '';
  form.longitude.value = r.longitude ?? '';
  // indicators
  INDICATORS.forEach(x=>{
    const el = document.getElementById(`ind_${x.id}`);
    if(el && r.ind) el.value = r.ind[x.id] ?? el.options[0]?.value;
  });
  form.editIndex.value = i;
  window.scrollTo({top:0, behavior:'smooth'});
}
function deleteRow(i){ if(confirm('Hapus data ini?')){ data.splice(i,1); persistData(); } }

document.getElementById('btnHapusSemua').addEventListener('click', ()=>{
  if(confirm('Hapus semua data KK?')){ data = []; persistData(); }
});

// ===== Search =====
const search = document.getElementById('search');
search.addEventListener('input', renderTable);

// ===== Sample =====
document.getElementById('btnSample').addEventListener('click', ()=>{
  const sample = [
    { dusun:'Keling', rw:'02', rt:'07', kk:'3517-001', nama:'Eko Wahyudi Antoro' },
    { dusun:'Krajan', rw:'01', rt:'02', kk:'3517-002', nama:'Siti' },
    { dusun:'Krajan', rw:'02', rt:'01', kk:'3517-003', nama:'Budi' },
    { dusun:'Gedangan', rw:'01', rt:'01', kk:'3517-004', nama:'Wati' }
  ];
  // default indicator values to last (optimistic)
  sample.forEach(r=>{
    r.ind = {};
    INDICATORS.forEach(ind=> r.ind[ind.id] = ind.options[ind.options.length-1].label);
  });
  sample.forEach(r=>{
    r.score = computeTotalScore(r);
    r.klas = classify(r.score);
    r.latitude = null; r.longitude = null;
  });
  data = data.concat(sample);
  persistData();
});

// ===== Render =====
function renderAll(){
  syncConfigUI();
  renderTable();
  renderAggregations();
  updateStats();
}
function updateStats(){
  document.getElementById('statCount').textContent = String(data.length);
  const cats = { Tertinggal:0, Berkembang:0, Maju:0, Mandiri:0 };
  data.forEach(r=> cats[r.klas] = (cats[r.klas]||0)+1);
  document.getElementById('statCategories').textContent = Object.entries(cats).map(([k,v])=> `${k}: ${v}`).join(' • ');
}

function renderTable(){
  const q = (search.value||'').toLowerCase();
  const tbody = document.getElementById('tbodyData');
  tbody.innerHTML = '';
  data.map((r,i)=>({...r,i})).filter(r=>{
    const hay = [r.dusun,r.rw,r.rt,r.kk,r.nama].join(' ').toLowerCase();
    return hay.includes(q);
  }).forEach(r=>{
    const tr = document.createElement('tr');
    const coord = (r.latitude!=null && r.longitude!=null) ? `${r.latitude.toFixed ? r.latitude.toFixed(5) : r.latitude}, ${r.longitude.toFixed ? r.longitude.toFixed(5) : r.longitude}` : '—';
    tr.innerHTML = `
      <td class="p-2">${r.dusun||''}</td>
      <td class="p-2">${r.rw||''}</td>
      <td class="p-2">${r.rt||''}</td>
      <td class="p-2">${r.kk||''}</td>
      <td class="p-2">${r.nama||''}</td>
      <td class="p-2 text-right">${r.score?.toFixed?.(1) ?? r.score}</td>
      <td class="p-2">${r.klas||''}</td>
      <td class="p-2">${coord}</td>
      <td class="p-2">
        <button class="text-indigo-600 underline mr-2" onclick="editRow(${r.i})">Edit</button>
        <button class="text-rose-600 underline" onclick="deleteRow(${r.i})">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== Aggregations =====
function groupBy(list, keyFn){
  return list.reduce((acc, item)=>{
    const key = keyFn(item);
    (acc[key] = acc[key] || []).push(item);
    return acc;
  },{});
}

function avgScore(arr){ if(arr.length===0) return 0; return Math.round((arr.reduce((a,b)=>a+Number(b.score||0),0)/arr.length)*10)/10; }

function renderAggregations(){
  const rekapDesa = document.getElementById('rekapDesa');
  const thres = config.thresholds;
  const desaScore = avgScore(data);
  const desaClass = classify(desaScore);
  rekapDesa.innerHTML = `Rata skor desa: <b>${desaScore.toFixed(1)}</b> • Klasifikasi: <b>${desaClass}</b> • (Tertinggal ≤ ${thres.low}, Maju ≥ ${thres.mid}, Mandiri ≥ ${thres.high})`;

  // Dusun
  const tbodyDusun = document.getElementById('tbodyDusun'); tbodyDusun.innerHTML='';
  const perDusun = groupBy(data, r=> r.dusun||'-');
  Object.entries(perDusun).forEach(([dusun, arr])=>{
    const s = avgScore(arr);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2">${dusun}</td>
      <td class="p-2 text-right">${s.toFixed(1)}</td>
      <td class="p-2">${classify(s)}</td>
      <td class="p-2 text-right">${arr.length}</td>
    `;
    tbodyDusun.appendChild(tr);
  });

  // Filters
  const fDusun = document.getElementById('filterDusun').value||'';
  const fRW = document.getElementById('filterRW').value||'';
  const filtered = data.filter(r=> (fDusun? (r.dusun||'').includes(fDusun):true) && (fRW? (r.rw||'').includes(fRW):true));

  // RW
  const tbodyRW = document.getElementById('tbodyRW'); tbodyRW.innerHTML='';
  const perRW = groupBy(filtered, r=> `${r.dusun||'-'}|${r.rw||'-'}`);
  Object.entries(perRW).forEach(([key, arr])=>{
    const [dusun, rw] = key.split('|');
    const s = avgScore(arr);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2">${dusun}</td>
      <td class="p-2">${rw}</td>
      <td class="p-2 text-right">${s.toFixed(1)}</td>
      <td class="p-2">${classify(s)}</td>
      <td class="p-2 text-right">${arr.length}</td>
    `;
    tbodyRW.appendChild(tr);
  });

  // RT
  const tbodyRT = document.getElementById('tbodyRT'); tbodyRT.innerHTML='';
  const perRT = groupBy(filtered, r=> `${r.dusun||'-'}|${r.rw||'-'}|${r.rt||'-'}`);
  Object.entries(perRT).forEach(([key, arr])=>{
    const [dusun, rw, rt] = key.split('|');
    const s = avgScore(arr);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2">${dusun}</td>
      <td class="p-2">${rw}</td>
      <td class="p-2">${rt}</td>
      <td class="p-2 text-right">${s.toFixed(1)}</td>
      <td class="p-2">${classify(s)}</td>
      <td class="p-2 text-right">${arr.length}</td>
    `;
    tbodyRT.appendChild(tr);
  });
}

document.getElementById('filterDusun').addEventListener('input', renderAggregations);
document.getElementById('filterRW').addEventListener('input', renderAggregations);

// ===== Config UI =====
function syncConfigUI(){
  const form = document.getElementById('formConfig');
  form.wEkonomi.value = config.weights.ekonomi;
  form.wPendidikan.value = config.weights.pendidikan;
  form.wKesehatan.value = config.weights.kesehatan;
  form.wSanitasi.value = config.weights.sanitasi;
  form.wPartisipasi.value = config.weights.partisipasi;
  form.thresLow.value = config.thresholds.low;
  form.thresMid.value = config.thresholds.mid;
  form.thresHigh.value = config.thresholds.high;
  document.getElementById('thresLow').textContent = config.thresholds.low;
  document.getElementById('thresMid').textContent = config.thresholds.mid;
  document.getElementById('thresHigh').textContent = config.thresholds.high;
}

document.getElementById('formConfig').addEventListener('submit', (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  config.weights.ekonomi = clamp(fd.get('wEkonomi'),0,100);
  config.weights.pendidikan = clamp(fd.get('wPendidikan'),0,100);
  config.weights.kesehatan = clamp(fd.get('wKesehatan'),0,100);
  config.weights.sanitasi = clamp(fd.get('wSanitasi'),0,100);
  config.weights.partisipasi = clamp(fd.get('wPartisipasi'),0,100);
  config.thresholds.low = clamp(fd.get('thresLow'),0,100);
  config.thresholds.mid = clamp(fd.get('thresMid'),0,100);
  config.thresholds.high = clamp(fd.get('thresHigh'),0,100);
  saveConfig();
});

document.getElementById('btnResetConfig').addEventListener('click', ()=>{
  if(confirm('Kembalikan ke bawaan?')){ config = structuredClone(defaultConfig); saveConfig(); }
});

// ===== Import/Export JSON =====
document.getElementById('btnExportJson')?.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify({config, data}, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'prodeskel-lite.json'; a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('importJson')?.addEventListener('change', (e)=>{
  const file = e.target.files?.[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result);
      if(obj.config) config = obj.config;
      if(obj.data) data = obj.data;
      saveConfig(); persistData();
      alert('Import selesai.');
    } catch(err){ alert('File tidak valid.'); }
  };
  reader.readAsText(file);
});

// ===== Export Excel =====
document.getElementById('btnExportExcel').addEventListener('click', ()=>{
  const wb = XLSX.utils.book_new();

  // Data_KK
  const rows = data.map(r=>{
    const base = { Dusun: r.dusun, RW: r.rw, RT: r.rt, KK: r.kk, Kepala_Keluarga: r.nama, Latitude: r.latitude, Longitude: r.longitude, Skor: r.score, Klasifikasi: r.klas };
    INDICATORS.forEach(ind=>{ base[`IND_${ind.id}`] = r.ind?.[ind.id] ?? ''; });
    return base;
  });
  const ws1 = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws1, 'Data_KK');

  function avgScore(arr){ if(arr.length===0) return 0; return Math.round((arr.reduce((a,b)=>a+Number(b.score||0),0)/arr.length)*10)/10; }
  function classify(score){
    const { low, mid, high } = config.thresholds;
    if(score >= high) return 'Mandiri';
    if(score >= mid) return 'Maju';
    if(score > low) return 'Berkembang';
    return 'Tertinggal';
  }
  function rekapSheet(groupKeys, title){
    const g = {};
    data.forEach(r=>{
      const key = groupKeys.map(k=>r[k]||'-').join('|');
      g[key] = g[key] || []; g[key].push(r);
    });
    const out = Object.entries(g).map(([key, arr])=>{
      const parts = key.split('|');
      const o = {};
      groupKeys.forEach((k,i)=> o[k.toUpperCase()] = parts[i]);
      const s = avgScore(arr);
      o.Rata_Skor = s;
      o.Klasifikasi = classify(s);
      o.Jumlah_KK = arr.length;
      return o;
    });
    const ws = XLSX.utils.json_to_sheet(out);
    XLSX.utils.book_append_sheet(wb, ws, title);
  }

  rekapSheet(['dusun'], 'Rekap_Dusun');
  rekapSheet(['dusun','rw'], 'Rekap_RW');
  rekapSheet(['dusun','rw','rt'], 'Rekap_RT');

  const desa = [{ Rata_Skor: avgScore(data), Klasifikasi: classify(avgScore(data)), Jumlah_KK: data.length }];
  const ws4 = XLSX.utils.json_to_sheet(desa);
  XLSX.utils.book_append_sheet(wb, ws4, 'Rekap_Desa');

  XLSX.writeFile(wb, 'Prodeskel_Lite.xlsx');
});
