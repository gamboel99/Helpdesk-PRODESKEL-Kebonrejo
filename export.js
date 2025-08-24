function exportToExcel(){
  let data = JSON.parse(localStorage.getItem('prodeskel')||'[]');
  if(data.length==0){alert('Belum ada data');return;}
  let ws = XLSX.utils.json_to_sheet(data);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Prodeskel");
  XLSX.writeFile(wb, "prodeskel_kebonrejo.xlsx");
}