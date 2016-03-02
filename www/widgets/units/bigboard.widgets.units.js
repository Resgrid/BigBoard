(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('UnitWidgetCtrl', unitWidgetCtrl);

    unitWidgetCtrl.$inject = ['$scope', 'dataService', '$rootScope', '$filter', 'settingsService'];
    function unitWidgetCtrl($scope, dataService, $rootScope, $filter, settingsService) {

        $rootScope.$on(CONSTS.EVENTS.UNIT_SETTINGS_UPDATED, function (event, data) {
            $scope.widgetSettings = settingsService.getUnitWidgetSettings();
            loadData();
        });

        $rootScope.$on(CONSTS.EVENTS.UNITS_UPDATED, function (event, data) {
            $scope.widgetSettings = settingsService.getUnitWidgetSettings();
            loadData();
        });

        $scope.widgetSettings = settingsService.getUnitWidgetSettings();
        $scope.units = [];

        $scope.isGroupHidden = function (value) {
            var result = $filter('filter')($scope.widgetSettings.settingHiddenGroups, value, true);

            if (result && result.length)
                return true;

            return false;
        };

        $scope.orderUnit = function (value) {
            if (value && value.GroupId) {
                if ($scope.widgetSettings['settingGroupSort_' + value.GroupId]) {
                    var result = $scope.widgetSettings['settingGroupSort_' + value.GroupId];
                    return result;
                }
            }

            return 10;
        };

        loadData();
        function loadData() {
            dataService.getUnitStatuses().then(
                function successCallback(response) {
                    if (response && response.data) {
                        $scope.units = response.data;

                        for (var i = 0; i < $scope.units.length; i++) {
                            if (!$scope.units[i].StateCss || $scope.units[i].StateCss.length === 0) {
                                $scope.units[i].StateCss = "label-default";
                            }
                        }
                    }
                }, function errorCallback(response) {

                });
        }
    }

})();