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
    })
});

// Global EventSource to track events emitted by the 'robot' 

var AttractCtrl = function GameCtrl($scope) {
  // AttractCtrl should:
  // - display "Race in the Dreamforce 500 to WIN!"
  // - display a leaderboard of the top 5 players and their times (data from
  //   SalesForce)
  // - display a diagram showing how the demo works.
  //
  // Rotate between these three (15 seconds each?) until the game starts
  // (EventSource receives "gameStarting" event, then redirect to "/game"
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
