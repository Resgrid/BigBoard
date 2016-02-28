(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('UnitSettingsCtrl', unitSettingsCtrl);

    unitSettingsCtrl.$inject = ['$scope', '$rootScope', 'settingsService', 'dataService'];
    function unitSettingsCtrl($scope, $rootScope, settingsService, dataService) {

        $scope.dynamicHtml = "";
        $scope.groups = [];
        $scope.widgetSettings = settingsService.getUnitWidgetSettings();
        $scope.saveSettings = function() {
            settingsService.setUnitWidgetSettings($scope.widgetSettings);
            $rootScope.$broadcast(CONSTS.EVENTS.UNIT_SETTINGS_UPDATED);
            $rootScope.Ui.turnOff('unitSettings');
        };

        loadData();
        function loadData() {
            dataService.getGroups().then(
                function successCallback(response) {
                    if (response && response.data && response.data.Groups) {
                        $scope.groups = response.data.Groups;

                        for (var i = 0; i < $scope.groups.length; i++) {
                            //if (!$scope.widgetSettings['settingGroupSort_' + $scope.groups[i].Gid]) {
                                var currentValue = $scope.widgetSettings['settingGroupSort_' + $scope.groups[i].Gid];

                                if (!currentValue || currentValue === 0)
                                    currentValue = 10;

                                if (i === 0)
                                    addHtmlForGroupBlockTable();

                                addHtmlGroupBlock($scope.groups[i].Gid, $scope.groups[i].Nme, currentValue);

                                if (i === ($scope.groups.length - 1))
                                    addHtmlForGroupBlockTableEnd();
                            //}

                            if (!$scope.widgetSettings['settingGroupSort_' + $scope.groups[i].Gid] || $scope.widgetSettings['settingGroupSort_' + $scope.groups[i].Gid] === 0)
                                $scope.widgetSettings['settingGroupSort_' + $scope.groups[i].Gid] = 10;
                        }
                    }
                }, function errorCallback(response) {

                });
        }

        function addHtmlForGroupBlockTable() {
            $scope.dynamicHtml = "<table class='table table-striped table-condensed'><thead><tr><th></th><th>Group</th></tr></thead><tbody>";
        }

        function addHtmlForGroupBlockTableEnd() {
            $scope.dynamicHtml = $scope.dynamicHtml + "</tbody></table>";
        }

        function addHtmlGroupBlock(id, name, value) {
            var text = '<tr animate-on-change my-anim><td><input type="number" ng-model="widgetSettings.settingGroupSort_' + id + '" min="0" max="999"></td><td style="font-size: 8pt;" >' + name + '</td></tr>';

            $scope.dynamicHtml = $scope.dynamicHtml + text;
        }
    }
})();