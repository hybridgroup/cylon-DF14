var cylon = require('cylon');

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
  ]
})
  .on('ready', function() {
    this.salesforce.subscribe('BoardMsgOutbound', function(err, data) {
      if (err != null) {
        console.log(err);
      } else if (data.sobject.boardId__c === this.name) {
        if (data.sobject.touchSensor__c === 1) {
          this.led.turnOn();
        } else if (data.sobject.touchSensor__c === 0) {
          this.led.turnOff();
        }
      }
    }.bind(this));

    this.touch.on('press', function() {
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
  })
  .start();
