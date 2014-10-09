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
  console.log(message);
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
    var msg = JSON.parse(message.data);

    if (msg.event === "game.starting") {
      $scope.$apply(function() {
        $location.path("/game");
      });
    }
  });
};

var GameCtrl = function GameCtrl($scope) {
  var currentState;

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
        $scope.spheros = {
          sphero1: { level: 1 },
          sphero2: { level: 1 },
        };
      }

      if (currentState === "game.start" && msg.event === "game.levelUp") {
        // msg.sphero should know which sphero levelled up
        // msg.level should tell you its new level
      }

      if (msg.event === 'game.end') {
        $scope.winner = msg.winner;
      }
    });
  });

  $scope.active = function(state) {
    return state === currentState;
  };
};
