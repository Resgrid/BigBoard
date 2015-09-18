(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('HomeController', homeController);

    homeController.$inject = ['$scope', '$timeout'];
    function homeController($scope, $timeout) {
        $scope.gridsterOptions = {
            margins: [20, 20],
            columns: 4,
            draggable: {
                handle: 'h3'
            }
        };

        $scope.dashboards = {
            '1': {
                id: '1',
                name: 'Home',
                widgets: [{
                    col: 0,
                    row: 0,
                    sizeY: 1,
                    sizeX: 1,
                    id: 1,
                    name: "Personnel",
                    templateUrl: "widgets/personnel/personnel.html",
                    controller: "PersonnelWidgetCtrl"
                }, {
                    col: 2,
                    row: 1,
                    sizeY: 1,
                    sizeX: 1,
                    id: 2,
                    name: "Widget 2",
                    controller: "PersonnelWidgetCtrl"
                }]
            },
            '2': {
                id: '2',
                name: 'Other',
                widgets: [{
                    col: 1,
                    row: 1,
                    sizeY: 1,
                    sizeX: 2,
                    id: 1,
                    name: "Other Widget 1",
                    controller: "PersonnelWidgetCtrl"
                }, {
                    col: 1,
                    row: 3,
                    sizeY: 1,
                    sizeX: 1,
                    id: 2,
                    name: "Other Widget 2",
                    controller: "PersonnelWidgetCtrl"
                }]
            }
        };

        $scope.clear = function() {
            $scope.dashboard.widgets = [];
        };

        $scope.addWidget = function() {
            $scope.dashboard.widgets.push({
                name: "New Widget",
                sizeX: 1,
                sizeY: 1
            });
        };

        $scope.$watch('vm.selectedDashboardId', function(newVal, oldVal) {
            if (newVal !== oldVal) {
                $scope.dashboard = $scope.dashboards[newVal];
            } else {
                $scope.dashboard = $scope.dashboards[1];
            }
        });

        // init dashboard
        $scope.selectedDashboardId = '1';
    }

})();