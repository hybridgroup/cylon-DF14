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
    my.salesforce.subscribe('BoardMsgOutbound', function(err, data) {
      cylon.Logger.info('err received:', err);
      cylon.Logger.info('data received:', data);
    });

    my.button.on('push', function() {
      var analog1 = Math.floor(Math.random() * 10),
          analog2 = Math.floor(Math.random() * 10),
          analog3 = Math.floor(Math.random() * 10),
          message = 'Some message not required 255 chars',
          event = 'Some event not required 255 chars';

      var toSend = { boardId: 1, // not required just to identify board if needed
                     analog1: analog1,
                     analog2: analog2,
                     analog3: analog3,
                     message: message,
                     event: event
                   };

      my.salesforce.post('/Boards/', toSend, function(err, data) {
        cylon.Logger.info('Board Msg has been sent to Salesforce.');
        console.log('Err:', err);
        console.log('Data:', data);
      });
    });
  }
});

cylon.start();
