var cylon = require('cylon');

cylon.robot({
  name: 'cylon01',
  connection: { name: 'edison', adaptor: 'intel-iot' },
  device: { name: 'led', driver: 'led', pin: 4, connection: 'edison' }
})
  .on('ready', function(my) {
    setInterval(function() {
      my.led.toggle();
    }, 1000);
  })
  .start();
