var wasm = require("./main.rs");

wasm.initialize({ noExitRuntime: true }).then(function(module) {
  var geodate = module.cwrap('geodate', 'string', ['number', 'number']);

  var updateGeodateDiv = function(id) {
    var el = document.getElementById(id);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var timestamp = new Date() / 1000;
        var longitude = position.coords.longitude;
        var res = geodate(timestamp, longitude);

        el.innerHTML = res.replace(/:/g, "<span>:</span>");
      });
    }
  };

  // Update display
  updateGeodateDiv("geodate");
  window.setInterval(updateGeodateDiv, 8640, "geodate");

  // Export function
  window.geodate = geodate;
});
