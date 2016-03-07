(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('PersonnelWidgetCtrl', personnelWidgetCtrl);

    personnelWidgetCtrl.$inject = ['$scope', 'dataService', '$rootScope', 'settingsService', '$filter'];
    function personnelWidgetCtrl($scope, dataService, $rootScope, settingsService, $filter) {

        $rootScope.$on(CONSTS.EVENTS.PERSONNEL_SETTINGS_UPDATED, function (event, data) {
            $scope.widgetSettings = settingsService.getPersonnelWidgetSettings();
            loadData();
        });

        $rootScope.$on(CONSTS.EVENTS.PERSONNEL_UPDATED, function (event, data) {
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

        $scope.isPersonOrGroupHidden = function (value) {
            var result = $filter('filter')($scope.widgetSettings.settingHiddenGroups, value.GroupId, true);

            if (result && result.length)
                return true;

            if ($scope.widgetSettings.hideUnavailable && value.State === "Unavailable")
                return true;

            if ($scope.widgetSettings.hideNotResponding && value.Status === "Not Responding")
                return true;

            return false;
        };

        $scope.orderPerson = function (value) {
            var result = 10;
            if (value && value.GroupId) {
                if ($scope.widgetSettings['settingGroupSort_' + value.GroupId]) {
                    result = $scope.widgetSettings['settingGroupSort_' + value.GroupId];
                }
            }

            if ($scope.widgetSettings.sortRespondingToTop && value.Status.toLowerCase().indexOf("responding") > -1 && value.Status.toLowerCase().indexOf("not") <= -1)
                result = -result;

            return result;
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