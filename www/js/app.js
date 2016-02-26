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
                            'chromeStorage',
                            'angularMoment',
                            'uiGmapgoogle-maps'
])
    .config(configure)
    .config(configureInterceptors)
    .config(configureToast)
    //.config(configureGmapGoogleMapApi)
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

// START Configure Interceptors
    configureInterceptors.$inject = ['$httpProvider'];
    function configureInterceptors($httpProvider) {
        $httpProvider.interceptors.push('authHeader');
    }
// END Configure Interceptors

// START Configure GmapGoogleMapApi
configureGmapGoogleMapApi.$inject = ['uiGmapGoogleMapApiProvider'];
function configureGmapGoogleMapApi(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        //    key: 'your api key',
        v: '3.20', //defaults to latest 3.X anyhow
        libraries: 'weather,geometry,visualization'
    });
}
// END Configure GmapGoogleMapApi
