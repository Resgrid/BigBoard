(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('CallsWidgetCtrl', callsWidgetCtrl);

    callsWidgetCtrl.$inject = ['$scope', 'dataService', '$rootScope', '$timeout', 'settingsService', 'analyticsService'];
    function callsWidgetCtrl($scope, dataService, $rootScope, $timeout, settingsService, analyticsService) {
        $scope.remove = function(widget) {
            $scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
        };

        $scope.calls = [];
        $scope.widgetSettings = settingsService.getCallWidgetSettings();

        $rootScope.$on(CONSTS.EVENTS.CALLS_UPDATED, function (event, data) {
            $scope.widgetSettings = settingsService.getCallWidgetSettings();
            loadData();
        });

        $rootScope.$on(CONSTS.EVENTS.CALL_SETTINGS_UPDATED, function (event, data) {
            $scope.widgetSettings = settingsService.getCallWidgetSettings();
            loadData();
        });

        loadData();
        function loadData() {
            analyticsService.trackFeature("Calls Widget - Load Data");
            
            dataService.getCalls().then(
                function successCallback(response) {
                    if (response && response.data) {
                        $scope.calls = response.data;
                    }
                }, function errorCallback(response) {

                });
        }
    }

})();