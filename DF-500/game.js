// SF_USERNAME=cylon-df-2014@yopmail.com SF_SECURITY_TOKEN=Passw0rdE0n1sDlQOoelDlYwmnRsALSa HUE_HOST=192.168.1.85 HUE_USERNAME=35dacee025cd94cf3f50bb301ad8b4bf node game.js
"use strict";

var Cylon = require('cylon'),
    async = require('async');

var LightStrip = require('./lightstrip');

function rgbToHex(r, g, b) {
  return ((1 << 24) + (r << 16) + (g << 8) + (b)) & 0xffffff;
}

function randomNumber() {
  return Math.floor(Math.random() * 255)
}

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
      if (err != null) {
        console.log('RaceMsgOutbound error: ', err);
      } else {
        my.pebble.send_notification("Player " + data.sobject.player_id__c + " won with a game time of " + data.sobject.seconds__c + " seconds");
      }
    });

    my.events.on('update', function(msg) {
      if (msg.event === "game.end") {
        my.salesforce.query('SELECT Id, Name, game_id__c, player_id__c, collisions__c, seconds__c FROM Race__c ORDER BY seconds__c ASC LIMIT 10', function(err, records) {
          my.events.emit('update', { event: 'leaderboard.update', records: records });
        });
      }
    });

    my.pebble.on('button', function() {
      if (my.players[0] === '' || my.players[1] === '') {
        console.log("Player ID's are not set");
      } else {
        console.log("Starting game.");
        my.events.emit('update', { event: 'game.starting' });

        my.running = false;
        my.maxLevel = 6;

        my.spheros.map(function(sphero) {
          sphero.removeAllListeners('levelUp');
          sphero.removeAllListeners('data');
        });

        my.startGame(my);
      }
    });
  },
  startGame: function(my) {
    my.countdown(my, function() {
      my.startDate = process.hrtime();

      my.events.emit('update', { event: 'game.start' });

      my.spheros.map(function(sphero) {
        sphero.detectCollisions();

        sphero.updateColor = function() {
          if (!my.running) {
            return;
          }

          sphero.setRGB(rgbToHex(sphero.red, sphero.green, sphero.blue));
        };

        sphero.checkPower = function() {
          if (my.running && sphero.green > 255) {
            sphero.blue = 0;
            sphero.red = 255;
            sphero.green = 0;

            sphero.emit('levelUp', sphero);
          }
        };

        every(400, function() {
          if (my.running) {
            sphero.checkPower();
            sphero.updateColor();
          }         
        });
      });

      my.running = true,

      my.spheros.map(function(sphero) {
        sphero.level = 1;

        sphero.red = 255;
        sphero.green = 0;
        sphero.blue = 0;

        sphero.on('collision', function(data) {
          sphero.green += 2;
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

      sphero.lights.yellow(sphero.level);

      this.emit('update', { event: 'game.levelUp', sphero: sphero.name, level: sphero.level });

      if (sphero.level === this.maxLevel) {
        this.running = false;
        this.updateSF(process.hrtime(this.startDate), sphero);
        this.emit('update', { event: 'game.end', winner: sphero.name });
        this.players = ['',''];
        var fns = [];
        for (var i = 0; i < 20; i++) {
          fns.push(function(cb) {
            setTimeout(function() {
              sphero.lights.random();
              sphero.setRGB(rgbToHex(randomNumber(), randomNumber(), randomNumber()));
              cb(null, true);
            }, 400);
          });
        }
        async.series(
          fns, 
          function(err, results) { 
            if (err != null) { 
              console.log(err); 
            }           
          }
        );
      }
    }.bind(this);
  },

  updateSF: function(diff, sphero) {
    var playerIndex = parseInt(sphero.name.slice(-1)) - 1;
    var data = {
      gameId: (this.startDate[0] * 1e9 + this.startDate[1]),
      playerId: this.players[playerIndex],
      seconds:  (diff[0]* 1e9 + diff[1]) / 1000000000.0,
      collisions: 100
    };

    this.salesforce.push('/RaceController/', data, function(err, data) {
      if (err != null) {
        console.log("/RaceController/ error: ", err);
      } else {
        console.log('Race Stored:' + (this.startDate[0] * 1e9 + this.startDate[1]) + ' has been sent to Salesforce.');
      }
    }.bind(this));
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
              my.strip1.orange();
              c(null, true)
            },
            function(c) {
              my.strip2.orange();
              c(null, true)
            },
            function(c) {
              my.spheros.map(function(sphero) { sphero.setColor('orange'); });
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
              my.strip1.yellow();
              c(null, true)
            },
            function(c) {
              my.strip2.yellow();
              c(null, true)
            },
            function(c) {
              my.spheros.map(function(sphero) { sphero.setColor('yellow'); });
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
              my.strip1.yellow(1);
              c(null, true)
            },
            function(c) {
              my.strip2.yellow(1);
              c(null, true)
            },
            function(c) {
              my.spheros.map(function(sphero) { sphero.setColor('yellow'); });
              c(null, true)
            }
          ], function(err, results) { cb(null, true); })
        });
      },
    ], callback);
  },
  setPlayer1: function(id) {
    this.players[0] = id;
    console.log("Player 1: " + this.players[0]);
  },
  setPlayer2: function(id) {
    this.players[1] = id;
    console.log("Player 2: " + this.players[1]);
  },
  commands: function() {
    return {
      setPlayer1: this.setPlayer1,
      setPlayer2: this.setPlayer2
    };
  }
});

Cylon.start();
