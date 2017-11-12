var wasm = require("./main.rs");

wasm.initialize({ noExitRuntime: true }).then(function(module) {
  var geodate = module.cwrap('geodate', 'string', ['number', 'number']);

  var render = function() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var timestamp = new Date() / 1000;
        var longitude = position.coords.longitude;
        var latitude = position.coords.latitude;
        var parts = geodate(timestamp, longitude).split(":");

        document.getElementById("year").innerHTML      = parts[0];
        document.getElementById("month").innerHTML     = parts[1];
        document.getElementById("day").innerHTML       = parts[2];
        document.getElementById("centiday").innerHTML  = parts[3];
        document.getElementById("dimiday").innerHTML   = parts[4];
        document.getElementById("longitude").innerHTML = longitude.toFixed(4);
        document.getElementById("latitude").innerHTML  = latitude.toFixed(4);
     });
    }
  };

  // Update display
  render();
  window.setInterval(render, 8640);

  // Export function
  window.geodate = geodate;
});
