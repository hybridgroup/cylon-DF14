var cylon = require('cylon');

cylon.robot({
  name: 'cylon1',
  connection: { name: 'edison', adaptor: 'intel-iot' },
  device: { name: 'led', driver: 'led', pin: 4, connection: 'edison' }
})
  .on('ready', function() {
    setInterval(function() {
      this.led.toggle();
    }.bind(this), 1000);
  })
  .start();
