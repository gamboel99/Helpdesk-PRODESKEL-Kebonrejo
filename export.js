function exportToExcel(){
  const key = 'prodeskel_kebonrejo_v1';
  const data = JSON.parse(localStorage.getItem(key)||'[]');
  if(!data || data.length===0){ alert('Belum ada data untuk diekspor'); return; }
  // normalize to flat rows
  const rows = data.map((r, i)=>{
    const out = Object.assign({}, r);
    out._index = i;
    out._timestamp = r._timestamp || '';
    out._score = r._score || '';
    out._category = r._category || '';
    // ensure lat/lng fields exist
    out.lat = r.lat || r.latitude || '';
    out.lng = r.lng || r.longitude || '';
    return out;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data_KK');
  XLSX.writeFile(wb, 'prodeskel_kebonrejo.xlsx');
}