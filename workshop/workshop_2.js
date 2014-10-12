var cylon = require('cylon');

cylon.robot({
  name: 'cylon1',
  connection: { name: 'edison', adaptor: 'intel-iot' },
  device: [
    { name: 'led', driver: 'led', pin: 4, connection: 'edison' },
    { name: 'touch', driver: 'button', pin: 3, connection: 'edison' },
  ]
})
  .on('ready', function() {
    this.touch.on('press', function() {
      this.led.turnOn();
    }.bind(this));

    this.touch.on('release', function() {
      this.led.turnOff();
    }.bind(this));
  })
  .start();
