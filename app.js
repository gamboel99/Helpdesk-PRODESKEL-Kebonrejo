function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

document.getElementById('prodeskelForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const formData = new FormData(this);
  let data = {};
  formData.forEach((val,key)=>{data[key]=val;});
  let saved = JSON.parse(localStorage.getItem('prodeskel')||'[]');
  saved.push(data);
  localStorage.setItem('prodeskel', JSON.stringify(saved));
  alert('Data berhasil disimpan!');
});


window.onload = function(){
  if(document.getElementById('rekap')){
    let data = JSON.parse(localStorage.getItem('prodeskel')||'[]');
    let html = '<table border=1><tr><th>KK</th><th>Dusun</th><th>RW</th><th>RT</th><th>Skor</th><th>Kategori</th></tr>';
    data.forEach(d=>{
      let skor = 0, count=0;
      for (let k in d){
        if(!isNaN(d[k])){skor+=parseInt(d[k]);count++;}
      }
      let avg = count? (skor/count):0;
      let kategori = "Sangat Tertinggal";
      if(avg>=4.5) kategori="Mandiri";
      else if(avg>=3.5) kategori="Maju";
      else if(avg>=2.5) kategori="Berkembang";
      else if(avg>=1.5) kategori="Tertinggal";
      html+=`<tr><td>${d['no_kk']||''}</td><td>${d['dusun']||''}</td><td>${d['rw']||''}</td><td>${d['rt']||''}</td><td>${avg.toFixed(2)}</td><td>${kategori}</td></tr>`;
    });
    html+="</table>";
    document.getElementById('rekap').innerHTML=html;
  }
}
