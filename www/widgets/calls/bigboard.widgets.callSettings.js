(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('CallSettingsCtrl', callSettingsCtrl);

    callSettingsCtrl.$inject = ['$scope', '$rootScope', 'settingsService'];
    function callSettingsCtrl($scope, $rootScope, settingsService) {

        $scope.widgetSettings = settingsService.getCallWidgetSettings();
        $scope.saveSettings = function() {
            settingsService.setCallWidgetSettings($scope.widgetSettings);
            $rootScope.$broadcast(CONSTS.EVENTS.CALL_SETTINGS_UPDATED);
            $rootScope.Ui.turnOff('callSettings');
        };
    }
})();