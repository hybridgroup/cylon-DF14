var Cylon = require('cylon');

Cylon.config({
  api: {
    host: '0.0.0.0',
    port: '8080',
    ssl:  false
  }
})
 
Cylon.api();

Cylon.robot({
  name: 'pebble',
  served: 0,
  pumping: false,
  connections: [
    { name: 'pebble', adaptor: 'pebble' },
    { name: 'arduino', adaptor: 'firmata', port: '/dev/ttyACM0' },
    //{ 
    //  name: 'sfcon', 
    //  adaptor: 'force', 
    //  sfuser: process.env.SF_USERNAME, 
    //  sfpass: process.env.SF_SECURITY_TOKEN 
    //}
  ],
  devices: [
    { name: 'pump', driver: 'direct-pin', pin: 6, connection: 'arduino' },
    { name: 'tap', driver: 'button', pin: 4, connection: 'arduino' },
    { name: 'fault', driver: 'button', pin: 2, connection: 'arduino' },
    { name: 'pebble', driver: 'pebble', connection: 'pebble' },
    //{ name: 'salesforce', driver: 'force', connection: 'sfcon' }
  ],
  airDrop: function() {
      var data = {
        message: "Delivery sent by drone" 
      };
      this.pebble.send_notification(data.message);
      //this.salesforce.push('/CustomerServiceController/', data, function(err, data) {
      //  console.log(err);
      //});
  },
  commands: function() {
    return {
      air_drop: this.airDrop
    };
  },
  work: function() {
    this.tap.on('press', function() {
      if (!this.pumping) {
        this.pumping = true;
        this.pump.digitalWrite(1);
        this.served += 1;
        var data = {
          served:  this.served
        };
        console.log("Total customers served: " + data.served);
      this.pebble.send_notification("Total customers served: " + data.served);
        //this.salesforce.push('/PumpController/', data, function(err, data) {
        //  console.log(err);
        //});
        setTimeout(function() {
          this.pump.digitalWrite(0);
          this.pumping = false;
        }.bind(this), 2000);
      }
    }.bind(this));

    this.fault.on('press', function() {
      console.log("Pushing fault to SF.....");
      var data = {
        fault:  "There was a pump fault"
      };
      //this.salesforce.push('/FaultController/', data, function(err, data) {
      //  console.log(err);
      //});
      //this.salesforce.subscribe('FaultMsgOutbound', function(err, data) {
      // this.pebble.send_notification("There was a fault!");
      //}.bind(this));
      this.pebble.send_notification(data.fault);
    }.bind(this));
  }
}).start();
