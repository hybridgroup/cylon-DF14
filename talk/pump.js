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
  name: 'brewforce',
  served: 0,
  pumping: false,
  dispenserId: 5,
  droneId: 4,
  connections: [
    { name: 'pebble', adaptor: 'pebble' },
    { name: 'edison', adaptor: 'intel-iot' },
    { 
      name: 'sfcon', 
      adaptor: 'force', 
      sfuser: process.env.SF_USERNAME, 
      sfpass: process.env.SF_SECURITY_TOKEN 
    }
  ],
  devices: [
    { name: 'pump', driver: 'direct-pin', pin: 6, connection: 'edison' },
    { name: 'tap', driver: 'button', pin: 4, connection: 'edison' },
    { name: 'fault', driver: 'button', pin: 2, connection: 'edison' },
    { name: 'pebble', driver: 'pebble', connection: 'pebble' },
    { name: 'salesforce', driver: 'force', connection: 'sfcon' }
  ],
  airDrop: function() {
    var date = new Date();
    var dateStr = date.toISOString();
    var toSend = { 
      dispenserId: this.droneId,
      drinkId: this.served,
      event: 'en route',
      eventTimestamp: dateStr,
      details: 'drone'
    };
    this.pebble.send_notification("delivery sent by drone");
    this.salesforce.post('/Drink/', toSend, function(err, data) {
      console.log('airDrop Err:', err);
      console.log('airDrop Data:', data);
    });
  },
  delivered: function() {
    var date = new Date();
    var dateStr = date.toISOString();
    var toSend = { 
      dispenserId: this.droneId,
      drinkId: this.served,
      event: 'delivery complete',
      eventTimestamp: dateStr,
      details: 'drone'
    };
    this.pebble.send_notification("delivery sent by drone");
    this.salesforce.post('/Drink/', toSend, function(err, data) {
      console.log('delivered Err:', err);
      console.log('delivered Data:', data);
    });
  },
  commands: function() {
    return {
      air_drop: this.airDrop,
      delivered: this.delivered,
      report_fault: this.reportFault,
      activate_pump: this.activatePump
    };
  },
  reportFault: function() {
    console.log("Pushing fault to SF.....");
    var date = new Date(),
        dateStr = date.toISOString(),
        toSend = { dispenserId: this.dispenserId,
                   drinkId: this.served,
                   event: 'error',
                   eventTimestamp: dateStr,
                   details: 'dispenser'
        };
    this.pebble.send_notification("there was an error");
    this.salesforce.post('/Drink/', toSend, function(err, data) {
      console.log('Err:', err);
      console.log('Data:', data);
    });
  },
  activatePump: function() {
    this.pumping = true;
    this.pump.digitalWrite(1);
    this.served += 1;
    var date = new Date(),
        dateStr = date.toISOString(),
        toSend = { 
          dispenserId: this.dispenserId,
          drinkId: this.served,
          event: 'online',
          eventTimestamp: dateStr,
          details: 'dispenser'
        };
    console.log("Total customers served: " + toSend.drinkId);
    this.pebble.send_notification("Total customers served: " + toSend.drinkId);
    this.salesforce.post('/Drink/', toSend, function(err, data) {
      console.log('Err:', err);
      console.log('Data:', data);
    });
    setTimeout(function() {
      this.pump.digitalWrite(0);
      this.pumping = false;
    }.bind(this), 2000);
  },
  work: function() {
    this.tap.on('press', function() {
      if (!this.pumping) {
        this.activatePump();
      }
    }.bind(this));

    this.fault.on('press', function() {
      this.reportFault();
    }.bind(this));
  }
}).start();
