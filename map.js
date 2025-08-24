if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(function(pos){
    var lat = pos.coords.latitude;
    var lng = pos.coords.longitude;
    document.getElementById('lat').value = lat;
    document.getElementById('lng').value = lng;

    var map = L.map('map').setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.marker([lat,lng]).addTo(map).bindPopup("Lokasi Anda").openPopup();
  });
}