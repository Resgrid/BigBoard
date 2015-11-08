angular.module('bigBoard', ['ui.router',
                            'bigBoard.controllers',
                            'bigBoard.services',
                            'bigBoard.utils',
                            'mobile-angular-ui',
                            'gridster',
                            'angular.filter',
                            'LocalStorageModule',
                            'ngCordova',
                            'ngToast',
                            'mdo-angular-cryptography',
                            'chromeStorage'])
    .config(configure)
    .config(configureToast)
    .config(configureCrypto)
    .run(function(settingsService, deviceUtils) {

        settingsService.init();
        if (deviceUtils.isChrome()) {
            settingsService.prime();
        }
    });

angular.module('bigBoard.controllers', []);
angular.module('bigBoard.services', []);
angular.module('bigBoard.utils', []);

// START Configure Angular
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
// END Configure Angular

// START Configure Toast
configureToast.$inject = ['ngToastProvider'];
function configureToast(ngToastProvider) {
    ngToastProvider.configure({
        verticalPosition: 'top',
        horizontalPosition: 'center',
        maxNumber: 3
    });
}
// END Configure Toast

// START Configure Config
configureCrypto.$inject = ['$cryptoProvider'];
function configureCrypto($cryptoProvider) {
    $cryptoProvider.setCryptographyKey(window.ENCRYPTION_KEY);
}
// END Configure Config