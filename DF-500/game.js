var Cylon = require('cylon');
var async = require('async');

var LightStrip = require('./lightstrip');

Cylon.config({
  api: {
    ssl: false,
    port: '8080',
    host: '0.0.0.0',
  }
});

Cylon.api();

Cylon.robot({
  name: "DF14-Game",
  red: 0,
  green: 0,
  blue: 255,
  shakePower: 0,
  running: false,
  connections: [
    { name: 'sphero1', adaptor: 'sphero', port: '/dev/rfcomm0' },
    { name: 'arduino', adaptor: 'firmata', port: '/dev/ttyACM0'},
    //{ name: 'sphero2', adaptor: 'sphero', port: '/dev/rfcomm1' },

    { name: 'pebble', adaptor: 'pebble' },

    {
      name: 'sfcon',
      adaptor: 'force',
      sfuser: process.env.SF_USERNAME,
      sfpass: process.env.SF_SECURITY_TOKEN
    }

    //{ name: 'hue', adaptor: 'hue', host: process.argv[2], username: process.argv[3] }
  ],

  devices: [
    { name: 'sphero1', driver: 'sphero', connection: 'sphero1' },
    //{ name: 'sphero2', driver: 'sphero', connection: 'sphero2' },

    { name: 'pebble', driver: 'pebble', connection: 'pebble' },

    { name: 'salesforce', driver: 'force', connection: 'sfcon' },
    
    { name: 'bulb1', driver: 'led', connection: 'arduino', pin: 2 },
    { name: 'bulb2', driver: 'led', connection: 'arduino', pin: 3 },
    { name: 'bulb3', driver: 'led', connection: 'arduino', pin: 4 },
    { name: 'bulb4', driver: 'led', connection: 'arduino', pin: 5 },
    { name: 'bulb5', driver: 'led', connection: 'arduino', pin: 6 },
    { name: 'bulb6', driver: 'led', connection: 'arduino', pin: 7 }

    //{ name: 'bulb1', driver: 'hue-light', connection: 'hue', lightId: 1 },
    //{ name: 'bulb2', driver: 'hue-light', connection: 'hue', lightId: 2 },
    //{ name: 'bulb3', driver: 'hue-light', connection: 'hue', lightId: 3 },
    //{ name: 'bulb4', driver: 'hue-light', connection: 'hue', lightId: 4 },
    //{ name: 'bulb5', driver: 'hue-light', connection: 'hue', lightId: 5 },
    //{ name: 'bulb6', driver: 'hue-light', connection: 'hue', lightId: 6 },

    //{ name: 'bulb7',  driver: 'hue-light', connection: 'hue', lightId: 7 },
    //{ name: 'bulb8',  driver: 'hue-light', connection: 'hue', lightId: 8 },
    //{ name: 'bulb9',  driver: 'hue-light', connection: 'hue', lightId: 9 },
    //{ name: 'bulb10', driver: 'hue-light', connection: 'hue', lightId: 10 },
    //{ name: 'bulb11', driver: 'hue-light', connection: 'hue', lightId: 11 },
    //{ name: 'bulb12', driver: 'hue-light', connection: 'hue', lightId: 12 }
  ],

  work: function(my) {
    my.pebble.send_notification("initialized");
    my.sphero1.lights = my.strip1 = new LightStrip([
      my.bulb1, my.bulb2, my.bulb3, my.bulb4, my.bulb5, my.bulb6,
    ]);

    //my.sphero2.lights = my.strip2 = new LightStrip([
    //  my.bulb7, my.bulb8, my.bulb9, my.bulb10, my.bulb11, my.bulb12,
    //]);

    my.salesforce.subscribe('RaceMsgOutbound', function(err, data) {
      console.log('arguments: ', arguments);
      console.log('err received:', err);
      console.log('data received:', data);
      my.pebble.send_notification("Game Time: " + err.sobject.seconds__c + " seconds");
    });

    my.pebble.on('button', function() {
    //after((1).seconds(), function() {
      console.log("Starting game.")
      my.running = false;

      my.sphero1.removeAllListeners('levelUp');
      //my.sphero2.removeAllListeners('levelUp');

      my.startGame(my);
    });
  },

  startGame: function(my) {
    var gameStartDate = new Date();
    my.countdown(my, function() {
      var maxLevel = 6;
      my.running = true

      my.sphero1.level = 1;
      //my.sphero2.level = 1;

      // sphero code goes somewhere around here, emits 'levelUp' event when
      // shaken enough to kick things up a level.

      var listener = function() {
        if (!my.running) {
          return;
        }

        this.level++;

        this.lights.green(this.level);

        if (this.level === maxLevel) {
          my.running = false;
          //this.setRGB(0, 255, 0);
          var endTime = new Date();
          var toSend = { 
            gameId: gameStartDate.getTime()/ 1000, 
            playerId: 'player' + Math.random(1), 
            seconds:  (endTime.getTime() - gameStartDate.getTime()) / 1000,
            collisions: 100
          };
          my.salesforce.push('/RaceController/', toSend, function(err, data) {
            console.log(err);
            console.log('Race Stored:' + gameStartDate.getTime() + ' has been sent to Salesforce.');
          });
        }
      };

      my.sphero1.setDataStreaming(['velocity'], { n: 40, m: 1, pcnt: 0 });
   
      my.sphero1.on('data', function(data) {
        my.addShakeDelta(data[0],data[1]);
      });

      every((0.4).second(), function() {
        if (my.running) {
          my.verifyMaxPowerReached(my.sphero1);
          my.updateColor(my.sphero1);
        } else {
          my.sphero1.setColor('yellow');
        }
      });

      my.sphero1.on('levelUp', listener.bind(my.sphero1));
      //my.sphero2.on('levelUp', listener.bind(my.sphero2));
    });
  },

  countdown: function(my, callback) {
    //my.sphero1.setRGB(255, 255, 255);
    my.sphero1.setRGB(0xffffff);
    //my.sphero2.setRGB(255, 255, 255);

    my.strip1.red();
    my.sphero1.setColor('red');
    //my.strip2.red();

    async.series([
      function(cb) {
        after((1).second(), function() {
          my.strip1.yellow();
          my.sphero1.setColor('yellow');
          //my.strip2.yellow();
          cb(null, true);
        });
      },
      function(cb) {
        after((1).second(), function() {
          my.strip1.green();
          my.sphero1.setColor('green');
          //  //my.strip2.green();
          cb(null, true);
        });
      },
      function(cb) {
        after((1).second(), function() {
          my.strip1.green(1);
          my.sphero1.setColor('blue');
          //  //my.strip2.green(1);
          cb(null, true);
        });
      }
    ], function(){
      callback()
    })
  },
  addShakeDelta: function(x, y) {
    var shakeDelta = Math.max(Math.abs(x), Math.abs(y))/50 | 0;
    this.shakePower += shakeDelta;
    this.red = this.shakePower;
  },
  verifyMaxPowerReached: function(sphero) {
    if(this.shakePower > 255) {
      this.blue = 255;
      this.red = 0;
      this.green = 0;
      this.shakePower = 0;
      sphero.emit('levelUp');
    }
  },
  updateColor: function(sphero) {
    var hexColor = ((1 << 24) + (this.red << 16) + (this.green << 8) + (this.blue - this.red)) & 0xffffff;
    sphero.setRGB(hexColor);
  },
}).start();
