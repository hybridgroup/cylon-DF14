var cylon = require('cylon');

function writeToScreen(screen, message) {
  screen.setCursor(0,0);
  screen.write(message);
}

cylon.robot({
  name: 'cylon1',
  connections: [
    { name: 'edison', adaptor: 'intel-iot' },
    {
      name: 'sfcon',
      adaptor: 'force',
      sfuser: SF_USERNAME,
      sfpass: SF_SECURITY_TOKEN
    }
  ],
  device: [
    { name: 'salesforce', driver: 'force', connection: 'sfcon' },
    { name: 'led', driver: 'led', pin: 4, connection: 'edison' },
    { name: 'touch', driver: 'button', pin: 3, connection: 'edison' },
    { name: 'sensor', driver: 'analogSensor', pin: 0, connection: 'edison' }
    { name: 'screen', driver: 'upm-jhd1313m1', connection: 'edison' }
  ]
})
  .on('ready', function() {
    var ready = false;
    var sensorVal = 0;

    writeToScreen(this.screen, "Ready!");

    this.salesforce.subscribe('BoardMsgOutbound', function(err, data) {
      if (err != null) {
        console.log(err);
      } else if (data.sobject.boardId__c === this.name) {
        if (data.sobject.touchSensor__c === 1) {
          this.led.turnOn();
        } else if (data.sobject.touchSensor__c === 0) {
          this.led.turnOff();
        }
        var sensor = data.sobject.analogSensor__c;
        if (sensor != null) {
          var pad = "0000";
          var message = "Reading: " + (pad+sensor.toString()).slice(-pad.length));
          writeToScreen(this.screen, message);
          console.log(message);
        }
      }
    }.bind(this));

    this.touch.on('press', function() {
      ready = true;
      var toSend = {
        boardId: this.name,
        touchSensor: 1
      };
      this.salesforce.post('/Boards/', toSend, function(err, data) {
        if (err != null) {
          console.log("Error sending touch sensor information: " + err);
        } else {
          console.log('Board Msg has been sent to Salesforce.');
        }
      });
    }.bind(this));

    this.touch.on('release', function() {
      ready = false;
      var toSend = {
        boardId: this.name,
        touchSensor: 0
      };
      this.salesforce.post('/Boards/', toSend, function(err, data) {
        if (err != null) {
          console.log("Error sending touch sensor information: " + err);
        } else {
          console.log('Board Msg has been sent to Salesforce.');
        }
      });
    }.bind(this));

    this.sensor.on('analogRead', function(data) {
      sensorVal = data;
    });

    setInterval(function() {
      if (ready) {
        var toSend = {
          message: this.name,
          analog2: sensorVal
        };
        this.salesforce.post('/Boards/', toSend, function(err, data) {
        if (err != null) {
          console.log("Error sending analog sensor information: " + err);
        }
        });
      }
    }.bind(this), 2000);
  })
  .start();
