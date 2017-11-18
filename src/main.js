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
  var sunrise;
  var sunset;

  var sync = function(callback) {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        longitude = position.coords.longitude;
        latitude = position.coords.latitude;

        var timestamp = new Date() / 1000;
        sunrise = getSunrise(timestamp, longitude, latitude);
        sunset = getSunset(timestamp, longitude, latitude);

        if (callback) {
          callback();
        }
     });
    }
  };

  var renderSky = function() {
    var timestamp = new Date() / 1000;
    var sun = "transparent";
    var zenith = -300; // percent of the screen
    var horizon = 100; // percent of the screen
    var nadir = 300; // percent of the screen
    var brightness = 0.0; // opacity
    var noon = sunrise + ((sunset - sunrise) / 2);
    var halfday = 86400 / 2;
    var twilight = 3000; // duration in seconds
    var daylight = 1.0; // opacity
    var redish = 0.0;
    if (timestamp > sunset + twilight) { // night
      daylight = 0.0;
      brightness = 0.0;
      redish = 0.0;
      sun = "transparent";
    } else if (timestamp > sunset - twilight) { // dusk
      daylight = interpolate(timestamp, sunset + twilight, sunset - twilight, 0.0, 1.0);
      if (timestamp > sunset) {
        alt = interpolate(timestamp, sunset, noon + halfday, horizon, nadir);
        brightness = interpolate(timestamp, sunset, sunset + twilight, 1.0, 0.0);
        redish = interpolate(timestamp, sunset, sunset + twilight, 1.0, 0.0);
      } else {
        alt = interpolate(timestamp, noon, sunset, zenith, horizon);
        brightness = 1.0;
        redish = interpolate(timestamp, sunset - twilight, sunset, 0.0, 1.0);
      }
      sun = "radial-gradient(circle at 105% " + alt + "%, #FFF, #FFC 10%, transparent 80%)";
    } else if (timestamp > sunrise + twilight) { // day
      daylight = 1.0;
      brightness = 1.0;
      redish = 0.0;
      var loc;
      if (timestamp > noon) {
        loc = 105;
        alt = interpolate(timestamp, noon, sunset, zenith, horizon);
      } else {
        loc = -5;
        alt = interpolate(timestamp, sunrise, noon, horizon, zenith);
      }
      // Around noon the sun move from the left to the right of the screen
      var delta = (sunset - sunrise) / 4;
      if (noon - delta < timestamp && timestamp < noon + delta) {
        loc = interpolate(timestamp, noon - delta, noon + delta, -5, 105);
      }
      sun = "radial-gradient(circle at " + loc + "% " + alt + "%, #FFF, #FFC 10%, transparent 80%)";
    } else if (timestamp > sunrise - twilight) { // dawn
      daylight = interpolate(timestamp, sunrise + twilight, sunrise - twilight, 1.0, 0.0);
      if (timestamp > sunrise) {
        alt = interpolate(timestamp, sunrise, noon, horizon, zenith);
        brightness = 1.0;
        redish = interpolate(timestamp, sunrise, sunrise + twilight, 1.0, 0.0);
      } else {
        alt = interpolate(timestamp, noon - halfday, sunrise, nadir, horizon);
        brightness = interpolate(timestamp, sunrise - twilight, sunrise, 0.0, 1.0);
        redish = interpolate(timestamp, sunrise - twilight, sunrise, 0.0, 1.0);
      }
      sun = "radial-gradient(circle at -5% " + alt + "%, #FFF, #FFC 10%, transparent 80%)";
    } else { // night
      daylight = 0.0;
      brightness = 0.0;
      redish = 0.0;
      sun = "transparent";
    }
    //console.log("timestamp: " + timestamp);
    //console.log("sunrise: " + sunrise);
    //console.log("noon: " + noon);
    //console.log("sunset: " + sunset);
    document.getElementById("sun").style.background = sun;
    document.getElementById("sun").style.opacity = brightness;
    document.getElementById("sky").style.opacity = daylight;
    if (timestamp > noon) {
      document.getElementById("sunrise").style.opacity = 0.0;
      document.getElementById("sunset").style.opacity = redish;
    } else {
      document.getElementById("sunrise").style.opacity = redish;
      document.getElementById("sunset").style.opacity = 0.0;
    }
  };

  var renderClock = function() {
    if (latitude && longitude) {
      if (microday >= 100) {
        microday = 0;
        setTimeout(function() {
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
        }, 0);
      }

      microday++;
      document.getElementById("microday").innerHTML = ("00" + (microday % 100)).slice(-2);
    }
  };

  // Update display
  sync(function() {
    renderSky();
    renderClock();
  });
  window.setInterval(renderClock, 86.4);
  window.setInterval(renderSky, 2000);
  window.setInterval(sync, 5 * 60 * 1000); // 5 minutes

  // Export function
  window.geodate = geodate;
});
