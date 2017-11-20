var wasm = require("./main.rs");

var interpolate = function(x, x0, x1, y0, y1) {
  return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
};

var leftpad = function(num, pad) {
  //return ("0".repeat(pad) + num).slice(-pad);
  return (Array(pad + 1).join("0") + num).slice(-pad);
};

var unixToDate = function(timestamp) {
  var date = new Date(timestamp * 1000);

  return [leftpad(date.getFullYear(), 4), leftpad(date.getMonth(), 2), leftpad(date.getDate(), 2)].join("-");
};

var unixToTime = function(timestamp) {
  var date = new Date(timestamp * 1000);

  return [leftpad(date.getHours(), 2), leftpad(date.getMinutes(), 2), leftpad(date.getSeconds(), 2)].join(":");
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

  var background = localStorage.getItem("background") || "animated";
  var clock = localStorage.getItem("clock") || "full";
  var format = localStorage.getItem("format") || "human";

  var updateClockSetting = function() {
    localStorage.setItem("clock", clock);
    document.getElementById("settings-clock").innerHTML = clock;
    switch (clock) {
    case "full":
      document.documentElement.classList.add("clock-full");
      document.documentElement.classList.remove("clock-compact");
      break;
    case "compact":
      document.documentElement.classList.add("clock-compact");
      document.documentElement.classList.remove("clock-full");
      break;
    }
  };

  var updateFormatSetting = function() {
    localStorage.setItem("format", format);
    document.getElementById("settings-format").innerHTML = format;
    switch (format) {
    case "human":
      document.documentElement.classList.add("format-human");
      document.documentElement.classList.remove("format-machine");
      document.documentElement.classList.remove("format-legacy");
      break;
    case "machine":
      document.documentElement.classList.add("format-machine");
      document.documentElement.classList.remove("format-human");
      document.documentElement.classList.remove("format-legacy");
      break;
    case "legacy":
      document.documentElement.classList.add("format-legacy");
      document.documentElement.classList.remove("format-human");
      document.documentElement.classList.remove("format-machine");
      break;
    }
    sync();
  };

  var menu = false;
  document.getElementById("menu-button").addEventListener("click", function() {
    menu = !menu;
    if (menu) {
      document.documentElement.classList.add("menu");
    } else {
      document.documentElement.classList.remove("menu");
    }
  });

  document.getElementById("alert").innerHTML = "accessing geolocation";
  var sync = function(callback) {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        document.getElementById("alert").innerHTML = "";
        longitude = position.coords.longitude;
        latitude = position.coords.latitude;

        document.getElementById("longitude").innerHTML = longitude.toFixed(4);
        document.getElementById("latitude").innerHTML  = latitude.toFixed(4);

        if (background === "animated") {
          var timestamp = Date.now() / 1000;
          sunrise = getSunrise(timestamp, longitude, latitude);
          sunset = getSunset(timestamp, longitude, latitude);

          switch (format) {
          case "human":
            var sunriseTime = geodate(sunrise, longitude);
            var sunsetTime = geodate(sunset, longitude);
            document.getElementById("sunrise-time").innerHTML = sunriseTime.slice(12, 17);
            document.getElementById("sunset-time").innerHTML = sunsetTime.slice(12, 17);
            break;
          case "machine":
            document.getElementById("sunrise-time").innerHTML = sunrise;
            document.getElementById("sunset-time").innerHTML = sunset;
            break;
          case "legacy":
            document.getElementById("sunrise-time").innerHTML = unixToTime(sunrise);
            document.getElementById("sunset-time").innerHTML = unixToTime(sunset);
            break;
          }
        }

        if (callback) {
          callback();
        }
     }, function() {
       document.getElementById("alert").innerHTML = "geolocation is required to compute geodate";
     });
    } else {
      document.getElementById("alert").innerHTML = "geolocation is required to compute geodate";
    }
  };

  var renderSky = function() {
    if (background === "animated" && sunrise && sunset) {
      var timestamp = Date.now() / 1000;
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
          brightness = interpolate(timestamp, noon, sunset, 0.0, 1.0);
          redish = interpolate(timestamp, sunset - twilight, sunset, 0.0, 1.0);
        }
        sun = "radial-gradient(circle at 105% " + alt + "%, #FFF, #FFC 10%, transparent 80%)";
      } else if (timestamp > sunrise + twilight) { // day
        daylight = 1.0;
        redish = 0.0;
        var loc;
        if (timestamp > noon) {
          loc = 105;
          alt = interpolate(timestamp, noon, sunset, zenith, horizon);
          brightness = interpolate(timestamp, noon, sunset, 0.0, 1.0);
        } else {
          loc = -5;
          alt = interpolate(timestamp, sunrise, noon, horizon, zenith);
          brightness = interpolate(timestamp, sunrise, noon, 1.0, 0.0);
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
          brightness = interpolate(timestamp, sunrise, noon, 1.0, 0.0);
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
    }
  };

  var renderClock = function() {
    if (latitude && longitude) {
      var timestamp = Date.now() / 1000;

      if (microday >= 100) {
        microday = 0;
        setTimeout(function() {
          var parts = geodate(timestamp, longitude).split(":");

          // Render clock
          document.getElementById("century").innerHTML   = parts[0];
          document.getElementById("year").innerHTML      = parts[1];
          document.getElementById("month").innerHTML     = parts[2];
          document.getElementById("day").innerHTML       = parts[3];
          document.getElementById("centiday").innerHTML  = parts[4];
          document.getElementById("dimiday").innerHTML   = parts[5];
        }, 0);
      }

      switch (format) {
      case "human":
        document.getElementById("microday").innerHTML = leftpad(microday % 100, 2);
        microday++;
        break;
      case "machine":
        document.getElementById("timestamp").innerHTML = timestamp.toFixed(0);
        microday = 0;
        break;
      case "legacy":
        document.getElementById("legacy-date").innerHTML = unixToDate(timestamp);
        document.getElementById("legacy-time").innerHTML = unixToTime(timestamp);
        microday = 0;
        break;
      }
    }
  };

  // Update display
  updateClockSetting();
  document.getElementById("settings-clock").addEventListener("click", function() {
    switch (clock) {
      case "full":    clock = "compact"; break;
      case "compact": clock = "full";    break;
    }
    updateClockSetting();
  });
  updateFormatSetting();
  document.getElementById("settings-format").addEventListener("click", function() {
    switch (format) {
      case "human":   format = "machine"; break;
      case "machine": format = "legacy";  break;
      case "legacy":  format = "human";   break;
    }
    updateFormatSetting();
  });
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
