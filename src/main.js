var wasm = require("./main.rs");

wasm.initialize({ noExitRuntime: true }).then(function(module) {
  var geodate = module.cwrap('geodate', 'string', ['number', 'number']);

  var microday = 100;
  var longitude;
  var latitude;

  var sync = function() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        longitude = position.coords.longitude;
        latitude = position.coords.latitude;
     });
    }
  };

  var render = function() {
    if (latitude && longitude) {
      if (microday >= 100) {
        microday = 0;
        var timestamp = new Date() / 1000;
        var parts = geodate(timestamp, longitude).split(":");

        document.getElementById("century").innerHTML   = parts[0];
        document.getElementById("year").innerHTML      = parts[1];
        document.getElementById("month").innerHTML     = parts[2];
        document.getElementById("day").innerHTML       = parts[3];
        document.getElementById("centiday").innerHTML  = parts[4];
        document.getElementById("dimiday").innerHTML   = parts[5];
        document.getElementById("longitude").innerHTML = longitude.toFixed(4);
        document.getElementById("latitude").innerHTML  = latitude.toFixed(4);
      }

      microday++;
      document.getElementById("microday").innerHTML = ("00" + (microday % 100)).slice(-2);
    }
  };

  // Update display
  sync();
  render();
  window.setInterval(render, 86.4);
  window.setInterval(sync, 100000);

  // Export function
  window.geodate = geodate;
});
