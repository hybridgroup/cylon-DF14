var cylon = require('cylon');

cylon.robot({
  connections: [
    {
      name: 'sfcon',
      adaptor: 'force',
      sfuser: process.env.SF_USERNAME,
      sfpass: process.env.SF_SECURITY_TOKEN
    },
    { name: 'arduino', adaptor: 'firmata', port: '/dev/ttyACM0' }
  ],

  devices: [
    { name: 'salesforce', driver: 'force', connection: 'sfcon' },
    { name: 'button', driver: 'button', pin: '3', connection: 'arduino' }
  ],

  work: function(my) {
    // The streamming is disabled for the race.
    /*
    me.salesforce.subscribe('RaceMsgOutbound', function(err, data) {
      console.log('arguments: ', arguments);
      cylon.Logger.info('err received:', err);
      cylon.Logger.info('data received:', data);
    });
   */

    var counter = 10;

    my.button.on('push', function() {
      var collisions = Math.floor(Math.random() * 10);
      var seconds = Math.floor(Math.random() * 1000) / 100;
      var toSend = { gameId: counter, playerId: 'player' + Math.random(1), collisions: collisions, seconds: seconds };

      my.salesforce.push('/RaceController/', toSend, function(err, data) {
        cylon.Logger.info('Race Stored:' + counter + ' has been sent to Salesforce.');
      });

      counter++;
    });
  }
});

cylon.start();
