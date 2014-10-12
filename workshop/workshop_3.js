var cylon = require('cylon');
var robotName = 'cylon01';
var username = 'user';
var password = 'password';
// Paste Cylon.js robot code below this line

cylon.robot({
  name: robotName,
  connections: [
    { name: 'edison', adaptor: 'intel-iot' },
    { name: 'sfcon', adaptor: 'force', sfuser: username, sfpass: password}
  ],
  device: [
    { name: 'salesforce', driver: 'force', connection: 'sfcon' },
    { name: 'led', driver: 'led', pin: 4, connection: 'edison' },
    { name: 'touch', driver: 'button', pin: 3, connection: 'edison' },
  ]
})
  .on('ready', function(my) {
    my.salesforce.subscribe('BoardMsgOutbound', function(err, data) {
      if (err != null) {
        console.log(err);
      } else if (data.sobject.board_id__c === my.name) {
        if (data.sobject.touch_sensor__c === true) {
          my.led.turnOn();
        } else if (data.sobject.touch_sensor__c === false) {
          my.led.turnOff();
        }
      }
    });

    my.touch.on('press', function() {
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
  })
  .start();
