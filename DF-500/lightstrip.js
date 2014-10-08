"use strict";

var LightStrip = module.exports = function LightStrip(lights) {
  this.lights = lights;
  this.lights.map(function(light) {
    light.turnOn();
    light.rgb(0,0,0);
  });
};

// Lights up some of the Hues
//
// num - number of Hues to light up
//       If not supplied, will light up all Hues green.
// color - RGB object to color the Hues with.
//          { r: 0, g: 255, b: 0 }
//
// Returns nothing
LightStrip.prototype.color = function(num, color) {
  var bulbs;

  if (num != null) {
    bulbs = this.lights.slice(0, num);
  } else {
    bulbs = this.lights;
  }

  this.lights.map(function(light) {
    if (!~bulbs.indexOf(light)) {
      light.rgb(0,0,0);
    }
  });

  bulbs.map(function(bulb) {
    bulb.rgb(color.r, color.g, color.b);
  });
}

LightStrip.prototype.green = function(num) {
  this.color(num, { r: 0, g: 255, b: 0 });
};

LightStrip.prototype.yellow = function(num) {
  this.color(num, { r: 255, g: 255, b: 0 });
};

LightStrip.prototype.red = function(num) {
  this.color(num, { r: 255, g: 0, b: 0 });
};
