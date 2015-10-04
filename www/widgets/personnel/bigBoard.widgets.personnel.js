(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('PersonnelWidgetCtrl', personnelWidgetCtrl);

    personnelWidgetCtrl.$inject = ['$scope'];
    function personnelWidgetCtrl($scope) {
        $scope.remove = function(widget) {
            $scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
        };

        $scope.openSettings = function(widget) {
            /*
            $modal.open({
                scope: $scope,
                templateUrl: 'demo/dashboard/widget_settings.html',
                controller: 'WidgetSettingsCtrl',
                resolve: {
                    widget: function() {
                        return widget;
                    }
                }
            });
            */
        };

        $scope.personnel = [
            {
                name: "Test User 1",
                group: "Station 1"
            },
            {
                name: "Test User 2",
                group: "Station 1"
            },
            {
                name: "Test User 3",
                group: "Station 1"
            },
            {
                name: "Test User 4",
                group: "Station 2"
            },
            {
                name: "Test User 5",
                group: "Station 2"
            }
        ];
    }

})();