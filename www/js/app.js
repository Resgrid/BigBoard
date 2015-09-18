angular.module('bigBoard', ['ui.router', 'bigBoard.controllers', 'bigBoard.services', 'mobile-angular-ui', 'gridster', 'angular.filter'])
    .config(configure)
    .run(function() {

    });

angular.module('bigBoard.controllers', []);
angular.module('bigBoard.services', []);

// Configure Angular
configure.$inject = ['$stateProvider', '$urlRouterProvider'];
function configure ($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: 'views/home/home.html',
            controller: 'HomeController'
        })
        .state('about', {
            url: '/about',
            templateUrl: 'views/about/about.html',
            controller: 'AboutController',
            controllerAs: 'vm'
        })
        .state('settings', {
            url: '/settings',
            templateUrl: 'views/settings/settings.html',
            controller: 'SettingsController',
            controllerAs: 'vm'
        })
    ;
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/home');
}