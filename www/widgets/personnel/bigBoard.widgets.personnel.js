(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('PersonnelWidgetCtrl', personnelWidgetCtrl);

    personnelWidgetCtrl.$inject = ['$scope', 'dataService', '$rootScope', 'settingsService'];
    function personnelWidgetCtrl($scope, dataService, $rootScope, settingsService) {

        $rootScope.$on(CONSTS.EVENTS.PERSONNEL_SETTINGS_UPDATED, function (event, data) {
            $scope.widgetSettings = settingsService.getPersonnelWidgetSettings();
            loadData();
        });

        $scope.remove = function(widget) {
            $scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
        };

        $scope.personnel = [];
        $scope.widgetSettings = settingsService.getPersonnelWidgetSettings();

        $scope.openSettings = function(widget) {
            $rootScope.Ui.turnOn('personnelSettings');
        };

        $scope.saveSettings = function() {
            settingsService.setPersonnelWidgetSettings($scope.widgetSettings);
            $rootScope.$broadcast(CONSTS.EVENTS.PERSONNEL_SETTINGS_UPDATED);
            $rootScope.Ui.turnOff('personnelSettings');
        };

        loadData();
        function loadData() {
            dataService.getPersonnelStatuses().then(
                function successCallback(response) {
                    if (response && response.data) {
                        $scope.personnel = response.data;
                    }
                }, function errorCallback(response) {

                });
        }
    }

})();