// SF_USERNAME=cylon-df-2014@yopmail.com SF_SECURITY_TOKEN=Passw0rdE0n1sDlQOoelDlYwmnRsALSa HUE_HOST=192.168.1.85 HUE_USERNAME=35dacee025cd94cf3f50bb301ad8b4bf node game.js
"use strict";

var Cylon = require('cylon'),
    async = require('async');

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

  running: false,
  players: ['',''],

  connections: [
    { name: 'sphero1', adaptor: 'sphero', port: '/dev/rfcomm0' },
    { name: 'sphero2', adaptor: 'sphero', port: '/dev/rfcomm1' },

    { name: 'pebble', adaptor: 'pebble' },

    {
      name: 'hue',
      adaptor: 'hue',
      host: process.env.HUE_HOST,
      username: process.env.HUE_USERNAME
    },

    {
      name: 'sfcon',
      adaptor: 'force',
      sfuser: process.env.SF_USERNAME,
      sfpass: process.env.SF_SECURITY_TOKEN
    }
  ],

  devices: [
    { name: 'sphero1', driver: 'sphero', connection: 'sphero1' },
    { name: 'sphero2', driver: 'sphero', connection: 'sphero2' },

    { name: 'pebble', driver: 'pebble', connection: 'pebble' },

    { name: 'events', driver: 'ping' }, // used for events

    { name: 'salesforce', driver: 'force', connection: 'sfcon' },

    { name: 'bulb1', driver: 'hue-light', connection: 'hue', lightId: 1 },
    { name: 'bulb2', driver: 'hue-light', connection: 'hue', lightId: 2 },
    { name: 'bulb3', driver: 'hue-light', connection: 'hue', lightId: 3 },
    { name: 'bulb4', driver: 'hue-light', connection: 'hue', lightId: 4 },
    { name: 'bulb5', driver: 'hue-light', connection: 'hue', lightId: 5 },
    { name: 'bulb6', driver: 'hue-light', connection: 'hue', lightId: 6 },

    { name: 'bulb7',  driver: 'hue-light', connection: 'hue', lightId: 7 },
    { name: 'bulb8',  driver: 'hue-light', connection: 'hue', lightId: 8 },
    { name: 'bulb9',  driver: 'hue-light', connection: 'hue', lightId: 9 },
    { name: 'bulb10', driver: 'hue-light', connection: 'hue', lightId: 10 },
    { name: 'bulb11', driver: 'hue-light', connection: 'hue', lightId: 11 },
    { name: 'bulb12', driver: 'hue-light', connection: 'hue', lightId: 12 }
  ],

  work: function(my) {
    my.sphero1.lights = my.strip1 = new LightStrip([
      my.bulb1, my.bulb2, my.bulb3, my.bulb4, my.bulb5, my.bulb6,
    ]);

    my.sphero2.lights = my.strip2 = new LightStrip([
      my.bulb7, my.bulb8, my.bulb9, my.bulb10, my.bulb11, my.bulb12,
    ]);

    my.spheros = [
      my.sphero1,
      my.sphero2
    ];

    my.pebble.send_notification('Initialized.');

    my.salesforce.subscribe('RaceMsgOutbound', function(err, data) {
      console.log('arguments: ', arguments);
      console.log('err received:', err);
      console.log('data received:', data);
      my.pebble.send_notification("Game Time: " + data.sobject.seconds__c + " seconds");
    });

    my.events.on('update', function(msg) {
      if (msg.event === "game.end") {
        my.salesforce.query('SELECT Id, Name, game_id__c, player_id__c, collisions__c, seconds__c FROM Race__c ORDER BY seconds__c ASC LIMIT 10', function(err, records) {
          my.events.emit('update', { event: 'leaderboard.update', records: records });
        });
      }
    });

    my.pebble.on('button', function() {
      console.log("Starting game.");
      my.events.emit('update', { event: 'game.starting' });

      my.running = false;
      my.maxLevel = 6;

      my.spheros.map(function(sphero) {
        sphero.removeAllListeners('levelUp');
        sphero.removeAllListeners('data');
      });

      my.startGame(my);
    });
  },

  startGame: function(my) {
    my.countdown(my, function() {
      my.startDate = new Date();

      my.events.emit('update', { event: 'game.start' });

      my.spheros.map(function(sphero) {
        sphero.setDataStreaming(['velocity'], { n: 40, m: 1, pcnt: 0 });

        sphero.updateColor = function() {
          if (!my.running) {
            return;
          }

          var hexColor = ((1 << 24) + (sphero.red << 16) + (sphero.green << 8) + (sphero.blue - sphero.red)) & 0xffffff;
          sphero.setRGB(hexColor);
        };

        sphero.checkPower = function() {
          if (my.running && sphero.shakePower > 255) {
            sphero.blue = 255;
            sphero.red = 0;
            sphero.green = 0;

            sphero.shakePower = 0;

            sphero.emit('levelUp', sphero);
          }
        };

        every(400, function() {
          if (my.running) {
            sphero.checkPower();
            sphero.updateColor();
          } else {
            sphero.setColor('yellow');
          }
        });
      });

      my.running = true,

      my.spheros.map(function(sphero) {
        sphero.level = 1;

        sphero.red = 0;
        sphero.green = 0;
        sphero.blue = 0;

        sphero.shakePower = 0;

        sphero.on('data', function(data) {
          var delta = Math.max(Math.abs(data[0]), Math.abs(data[1])) / 50 | 0;
          sphero.shakePower += delta;
          sphero.red = sphero.shakePower;
        });

        sphero.on('levelUp', my.levelUp());
      });
    });
  },

  levelUp: function() {
    return function(sphero) {
      if (!this.running) {
        return;
      }

      sphero.level++;

      sphero.lights.green(sphero.level);

      this.emit('update', { event: 'game.levelUp', sphero: sphero.name, level: sphero.level });

      if (sphero.level === this.maxLevel) {
        this.running = false;
        this.updateSF(this.startDate, new Date(), sphero);
        this.emit('update', { event: 'game.end', winner: sphero.name });
        sphero.setRGB(0, 255, 0);
      }
    }.bind(this);
  },

  updateSF: function(start, end, sphero) {
    var playerIndex = parseInt(sphero.name.slice(-1)) - 1;
    var data = {
      gameId: start.getTime() / 1000,
      playerId: this.players[playerIndex],
      seconds:  (end.getTime() - start.getTime()) / 1000,
      collisions: 100
    };

    this.salesforce.push('/RaceController/', data, function(err, data) {
      console.log(err);
      console.log('Race Stored:' + start.getTime() + ' has been sent to Salesforce.');
    });
  },

  countdown: function(my, callback) {
    async.series([
      function(cb) {
        after((1).second(), function() {
          async.parallel([
            function(c) {
              my.strip1.red();
              c(null, true)
            },
            function(c) {
              my.strip2.red();
              c(null, true)
            },
            function(c) {
              my.spheros.map(function(sphero) { sphero.setColor('red'); });
              my.events.emit('update', { event: 'game.countdown.3' });
              c(null, true)
            }
          ], function(err, results) { cb(null, true); })
        });
      },
      function(cb) {
        after((1).second(), function() {
          async.parallel([
            function(c) {
              my.strip1.yellow();
              c(null, true)
            },
            function(c) {
              my.strip2.yellow();
              c(null, true)
            },
            function(c) {
              my.spheros.map(function(sphero) { sphero.setColor('yellow'); });
              my.events.emit('update', { event: 'game.countdown.2' });
              c(null, true)
            }
          ], function(err, results) { cb(null, true); })
        });
      },

      function(cb) {
        after((1).second(), function() {
          async.parallel([
            function(c) {
              my.strip1.green();
              c(null, true)
            },
            function(c) {
              my.strip2.green();
              c(null, true)
            },
            function(c) {
              my.spheros.map(function(sphero) { sphero.setColor('green'); });
              my.events.emit('update', { event: 'game.countdown.1' });
              c(null, true)
            }
          ], function(err, results) { cb(null, true); })
        });
      },

      function(cb) {
        after((1).second(), function() {
          async.parallel([
            function(c) {
              my.strip1.green(1);
              c(null, true)
            },
            function(c) {
              my.strip2.green(1);
              c(null, true)
            },
            function(c) {
              my.spheros.map(function(sphero) { sphero.setColor('blue'); });
              c(null, true)
            }
          ], function(err, results) { cb(null, true); })
        });
      },
    ], callback);
  },
  setPlayer1: function(id) {
    this.players[0] = id;
  },
  setPlayer2: function(id) {
    this.players[1] = id;
  },
  commands: function() {
    return {
      setPlayer1: this.setPlayer1,
      setPlayer2: this.setPlayer2
    };
  }
});

Cylon.start();
