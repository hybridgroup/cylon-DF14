var cylon = require('cylon');
var robotName = 'cylon01';
var username = 'user';
var password = 'password';
// Paste Cylon.js robot code below this line

cylon.robot({
  name: robotName,
  connection: { name: 'edison', adaptor: 'intel-iot' },
  device: { name: 'led', driver: 'led', pin: 4, connection: 'edison' }
})
  .on('ready', function(my) {
    setInterval(function() {
      my.led.toggle();
    }, 1000);
  })
  .start();
