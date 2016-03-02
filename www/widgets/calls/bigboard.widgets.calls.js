(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('CallsWidgetCtrl', callsWidgetCtrl);

    callsWidgetCtrl.$inject = ['$scope', 'dataService', '$rootScope', '$timeout', 'settingsService'];
    function callsWidgetCtrl($scope, dataService, $rootScope, $timeout, settingsService) {
        $scope.remove = function(widget) {
            $scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
        };

        $scope.calls = [];
        $scope.widgetSettings = settingsService.getCallWidgetSettings();

        $rootScope.$on(CONSTS.EVENTS.CALLS_UPDATED, function (event, data) {
            $scope.widgetSettings = settingsService.getCallWidgetSettings();
            loadData();
        });

        loadData();
        function loadData() {
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