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
    my.button.on('push', function() {
      console.log('Button has been pushed retrieving leaderboard:');
      /*
      my.salesforce.get('/Leaderboard/', function(err, data) {
        cylon.Logger.info('Leaderboard stored in Salesforce.');
        cylon.Logger.info('Data:', data);
      });
      */

      my.salesforce.query('SELECT Id, Name, game_id__c, player_id__c, collisions__c, seconds__c FROM Race__c ORDER BY seconds__c ASC LIMIT 10', function(err, records) {
        cylon.Logger.info('Leaderboard stored in Salesforce:');
        cylon.Logger.info('Records:', records);
      });

    });
  }
});

cylon.start();
