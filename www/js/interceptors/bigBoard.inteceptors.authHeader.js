angular.module('bigBoard').factory('authHeader', ['settingsService', function(settingsService) {
    var sessionInjector = {
        request: function(config) {
            if (settingsService.getAuthToken()) {
                config.headers['Authorization'] = 'Basic ' + settingsService.getAuthToken();
            }
            return config;
        }
    };
    return sessionInjector;
}]);