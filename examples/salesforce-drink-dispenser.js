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

    var dispenserId = 1;
    var drinkId = 1;

    my.button.on('push', function() {
      var date = new Date(),
          dateStr = date.toISOString(),
          toSend = { dispenserId: dispenserId,
                     drinkId: drinkId,
                     event: 'dispense',
                     eventTimestamp: dateStr,
                     details: 'dispenserId:' + dispenserId + ', drinkId:' + drinkId};

      my.salesforce.post('/Drink/', toSend, function(err, data) {
        cylon.Logger.info('Drink served and stored in salesforce');
        console.log('Err:', err);
        console.log('Data:', data);
      });
    });
  }
});

cylon.start();
