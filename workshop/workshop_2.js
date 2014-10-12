var cylon = require('cylon');
var robotName = 'cylon01';
var username = 'user';
var password = 'password';
// Paste Cylon.js robot code below this line

cylon.robot({
  name: robotName,
  connection: { name: 'edison', adaptor: 'intel-iot' },
  device: [
    { name: 'led', driver: 'led', pin: 4, connection: 'edison' },
    { name: 'touch', driver: 'button', pin: 3, connection: 'edison' },
  ]
})
  .on('ready', function(my) {
    my.touch.on('press', function() {
      my.led.turnOn();
    });

    my.touch.on('release', function() {
      my.led.turnOff();
    });
  })
  .start();
