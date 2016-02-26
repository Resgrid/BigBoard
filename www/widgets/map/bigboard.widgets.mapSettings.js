(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('MapSettingsCtrl', mapSettingsCtrl);

    mapSettingsCtrl.$inject = ['$scope', '$rootScope', 'settingsService'];
    function mapSettingsCtrl($scope, $rootScope, settingsService) {

        $scope.widgetSettings = settingsService.getMapWidgetSettings();
        $scope.saveSettings = function() {
            settingsService.setMapWidgetSettings($scope.widgetSettings);
            $rootScope.$broadcast(CONSTS.EVENTS.MAP_SETTINGS_UPDATED);
            $rootScope.Ui.turnOff('mapSettings');
        };
    }
})();