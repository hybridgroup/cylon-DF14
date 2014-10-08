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

var AttractCtrl = function GameCtrl($scope) {
};

var GameCtrl = function GameCtrl($scope) {
};
