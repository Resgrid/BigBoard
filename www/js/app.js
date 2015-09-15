angular.module('bigBoard', ['ui.router', 'bigBoard.controllers', 'bigBoard.services', 'mobile-angular-ui'])
    .config(configure)
    .run(function() {

    });

angular.module('bigBoard.controllers', []);
angular.module('bigBoard.services', []);

configure.$inject = ['$stateProvider', '$urlRouterProvider'];
function configure ($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('app', {
            url: '/app',
            abstract: true,
            controller: 'AppController',
            controllerAs: 'vm'
        })
        .state('app.home', {
            url: '/home',
            templateUrl: 'views/home/home.html',
            controller: 'HomeController',
            controllerAs: 'vm'
        })
        .state('app.about', {
            url: '/home',
            templateUrl: 'views/about/about.html',
            controller: 'HomeController',
            controllerAs: 'vm'
        })
        .state('app.home', {
            url: '/home',
            templateUrl: 'views/home/home.html',
            controller: 'HomeController',
            controllerAs: 'vm'
        })
    ;
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/home');
}