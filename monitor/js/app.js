var app = angular.module("monitor", ["ngRoute"]);

app.config(function($routeProvider) {
  $routeProvider

    .when("/attract", {
      controller: "AttractCtrl",
      templateUrl: "/partials/attract.html"
    })

    .when("/game", {
      controller: "GameCtrl",
      templateUrl: "/partials/game.html"
    })

    .otherwise({
      redirectTo: "/attract"
    });
});

var eventURI = "http://localhost:8080/api/robots/DF14-Game/devices/events/events/update";

var source = new EventSource(eventURI);

source.addEventListener('message', function(message) {
  msg = JSON.parse(message.data);

  if (msg.event === "game.starting") {
    var e = document.getElementById('monitor'),
        $injector = angular.element(e).injector(),
        $scope = $injector.get('$rootScope');
        $location = $injector.get('$location');

    $scope.$apply(function() {
      $location.path("/game");
    })
  }
});

var AttractCtrl = function AttractCtrl($scope, $location) {
  sections = ["display", "leaderboard", "diagram"];

  var rotate = setInterval(function() {
    $scope.$apply(function() {
      sections.push(sections.shift());
    });
  }, 15000);

  $scope.active = function(section) {
    return section === sections[0];
  };

  source.addEventListener('message', function(message) {
    msg = JSON.parse(message.data);

    if (msg.event === "leaderboard.update") {
      $scope.$apply(function() {
        var leaderboard = [];

        for (var i = 0; i < msg.records.records.length; i++) {
          var record = msg.records.records[i];
          leaderboard.push({
            name: record.player_id__c,
            game: record.game_id__c,
            collisions: record.collisions__c,
            seconds: record.seconds__c
          });
        }

        $scope.leaderboard = leaderboard;
      });
    }
  });
};

var GameCtrl = function GameCtrl($scope, $location) {
  var currentState, playing = false;

  var states = [
    "game.countdown.3",
    "game.countdown.2",
    "game.countdown.1",
    "game.start",
    "game.end"
  ];

  source.addEventListener('message', function(message) {
    $scope.$apply(function() {
      var msg = JSON.parse(message.data);

      // check if event is a game state change
      if (~states.indexOf(msg.event)) {
        currentState = msg.event;
      }

      if (msg.event === 'game.start') {
        playing = true;
        $scope.spheros = {
          sphero1: { level: 1 },
          sphero2: { level: 1 },
        };
      }

      if (currentState === "game.start" && msg.event === "game.levelUp") {
        $scope.spheros[msg.sphero].level = msg.level;
      }

      if (msg.event === 'game.end') {
        $scope.winner = msg.winner;
        playing = false;

        setTimeout(function() {
          $scope.$apply(function() {
            if (!playing) {
              $location.path("/attract");
            }
          });
        }, 10000)
      }
    });
  });

  $scope.active = function(state) {
    return state === currentState;
  };
};
