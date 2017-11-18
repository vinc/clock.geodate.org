var wasm = require("./main.rs");

var interpolate = function(x, x0, x1, y0, y1) {
  return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
};

wasm.initialize({ noExitRuntime: true }).then(function(module) {
  var geodate = module.cwrap("geodate", "string", ["number", "number"]);
  var getSunrise = module.cwrap("sunrise", "number", ["number", "number", "number"]);
  var getSunset = module.cwrap("sunset", "number", ["number", "number", "number"]);

  var microday = 100;
  var longitude;
  var latitude;

  var sync = function(callback) {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        longitude = position.coords.longitude;
        latitude = position.coords.latitude;
        callback();
     });
    }
  };

  var render = function() {
    if (latitude && longitude) {
      if (microday >= 100) {
        microday = 0;
        var timestamp = new Date() / 1000;
        var parts = geodate(timestamp, longitude).split(":");

        // Render clock
        document.getElementById("century").innerHTML   = parts[0];
        document.getElementById("year").innerHTML      = parts[1];
        document.getElementById("month").innerHTML     = parts[2];
        document.getElementById("day").innerHTML       = parts[3];
        document.getElementById("centiday").innerHTML  = parts[4];
        document.getElementById("dimiday").innerHTML   = parts[5];
        document.getElementById("longitude").innerHTML = longitude.toFixed(4);
        document.getElementById("latitude").innerHTML  = latitude.toFixed(4);

        // Render background
        var sunrise = getSunrise(timestamp, longitude, latitude);
        var sunset = getSunset(timestamp, longitude, latitude);
        var twilight = 3000; // duration in seconds
        var daylight = 1.0; // opacity
        if (timestamp > sunset + twilight) {
          daylight = 0.0;
        } else if (timestamp > sunset - twilight) {
          daylight = interpolate(timestamp, sunset + twilight, sunset - twilight, 0.0, 1.0);
        } else if (timestamp > sunrise + twilight) {
          daylight = 1.0;
        } else if (timestamp > sunrise - twilight) {
          daylight = interpolate(timestamp, sunrise + twilight, sunrise - twilight, 1.0, 0.0);
        } else {
          daylight = 0.0;
        }
        document.getElementById("sky").style.opacity = daylight;
      }

      microday++;
      document.getElementById("microday").innerHTML = ("00" + (microday % 100)).slice(-2);
    }
  };

  // Update display
  sync(render);
  window.setInterval(render, 86.4);
  window.setInterval(sync, 100000);

  // Export function
  window.geodate = geodate;
});
