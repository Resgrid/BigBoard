(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('PersonnelSettingsCtrl', personnelSettingsCtrl);

    personnelSettingsCtrl.$inject = ['$scope', '$rootScope', 'settingsService'];
    function personnelSettingsCtrl($scope, $rootScope, settingsService) {

        $scope.widgetSettings = settingsService.getPersonnelWidgetSettings();
        $scope.saveSettings = function() {
            settingsService.setPersonnelWidgetSettings($scope.widgetSettings);
            $rootScope.$broadcast(CONSTS.EVENTS.PERSONNEL_SETTINGS_UPDATED);
            $rootScope.Ui.turnOff('personnelSettings');
        };
    }
})();