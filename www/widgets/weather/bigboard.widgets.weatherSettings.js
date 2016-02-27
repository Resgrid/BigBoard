(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('WeatherSettingsCtrl', weatherSettingsCtrl);

    weatherSettingsCtrl.$inject = ['$scope', '$rootScope', 'settingsService'];
    function weatherSettingsCtrl($scope, $rootScope, settingsService) {

        $scope.widgetSettings = settingsService.getWeatherWidgetSettings();
        $scope.saveSettings = function() {
            settingsService.setMapWidgetSettings($scope.widgetSettings);
            $rootScope.$broadcast(CONSTS.EVENTS.WEATHER_SETTINGS_UPDATED);
            $rootScope.Ui.turnOff('weatherSettings');
        };
    }
})();