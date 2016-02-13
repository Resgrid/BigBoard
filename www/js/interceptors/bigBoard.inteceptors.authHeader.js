angular.module('bigBoard').factory('authHeader', ['settingsService', function(settingsService) {
    var sessionInjector = {
        request: function(config) {
            var authToken = settingsService.getAuthToken();
            if (authToken) {
                config.headers['Authorization'] = 'Basic ' + authToken;
            }
            return config;
        }
    };
    return sessionInjector;
}]);