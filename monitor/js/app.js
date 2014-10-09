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

var eventURI = "http://localhost:8080/robots/DF14-Game/events/update";

// var source = new EventSource(eventURI);

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

    if (msg.event === "game.start") {
      $scope.$apply(function() {
        $location.path("/game");
      });
    }
  });
};

var GameCtrl = function GameCtrl($scope) {
  // GameCtrl should:
  //
  // - display countdown as game is about to start (driven by events from game
  //   itself). This could display as full-background colors, with text
  //   front-center
  // - "power meters" (VU meters) for each player (based on events from game,
  // maybe at 200ms intervals?)
  // - shows winner after race finished
  //
  //
  // ~10s after the race finishes, should switch back to attract mode (redirect
  // to /attract
};
