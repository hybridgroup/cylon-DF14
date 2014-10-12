var cylon = require('cylon');

cylon.robot({
  name: 'cylon01',
  connections: [
    { name: 'edison', adaptor: 'intel-iot' },
    {
      name: 'sfcon',
      adaptor: 'force',
      sfuser: '',
      sfpass: ''
    }
  ],
  device: [
    { name: 'salesforce', driver: 'force', connection: 'sfcon' },
    { name: 'led', driver: 'led', pin: 4, connection: 'edison' },
    { name: 'touch', driver: 'button', pin: 3, connection: 'edison' },
    { name: 'sensor', driver: 'analogSensor', pin: 0, connection: 'edison' }
  ]
})
  .on('ready', function(my) {
    var ready = false;
    var sensorVal = 0;
    my.salesforce.subscribe('BoardMsgOutbound', function(err, data) {
      if (err != null) {
        console.log(err);
      } else if (data.sobject.board_id__c === my.name) {
        if (data.sobject.touch_sensor__c === true) {
          my.led.turnOn();
        } else if (data.sobject.touch_sensor__c === false) {
          my.led.turnOff();
        }
        var sensor = data.sobject.analog_sensor__c;
        if (sensor != null) {
          console.log("Reading: " + sensor);
        }
      }
    });

    my.touch.on('press', function() {
      ready = true;
      var toSend = {
        boardId: my.name,
        touchSensor: true
      };
      my.salesforce.post('/Boards/', toSend, function(err, data) {
        if (err != null) {
          console.log("Error sending touch sensor information: " + err);
        } else {
          console.log('Board Msg has been sent to Salesforce.');
        }
      });
    });

    my.touch.on('release', function() {
      ready = false;
      var toSend = {
        boardId: my.name,
        touchSensor: false 
      };
      my.salesforce.post('/Boards/', toSend, function(err, data) {
        if (err != null) {
          console.log("Error sending touch sensor information: " + err);
        } else {
          console.log('Board Msg has been sent to Salesforce.');
        }
      });
    });

    my.sensor.on('analogRead', function(data) {
      sensorVal = data;
    });

    setInterval(function() {
      if (ready) {
        var toSend = {
          boardId: my.name,
          touchSensor: true,
          analogSensor: sensorVal
        };
        my.salesforce.post('/Boards/', toSend, function(err, data) {
        if (err != null) {
          console.log("Error sending analog sensor information: " + err);
        }
        });
      }
    }, 2000);
  })
  .start();

