(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('HomeController', homeController);

    homeController.$inject = ['$scope', '$timeout', '$rootScope', 'settingsService'];
    function homeController($scope, $timeout, $rootScope, settingsService) {
        $scope.gridsterOptions = {
            margins: [10, 10],
            columns: 8,
            draggable: {
                handle: 'h3'
            },
            resizable: {
                enabled: true,
                handles: ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'],
                start: function(event, $element, widget) {}, // optional callback fired when resize is started,
                resize: function(event, $element, widget) {}, // optional callback fired when item is resized,
                stop: function(event, $element, widget) {
                    if (widget && widget.name === "Map") {
                        var ele = $element[0];
                        $rootScope.$broadcast(CONSTS.MAP_RESIZED, {
                            width: ele.clientWidth,
                            height: ele.clientHeight
                        });
                    }

                } // optional callback fired when item is finished resizing
            }
        };

        $scope.clear = function() {
            $scope.dashboard.widgets = [];
        };

        $scope.addWidget = function(type) {
            if (type === 1) {
                $scope.dashboard.widgets.push({
                    name: "Personnel",
                    templateUrl: "widgets/personnel/personnel.html",
                    controller: "PersonnelWidgetCtrl",
                    sizeX: 5,
                    sizeY: 5
                });
            } else if (type === 2) {
                $scope.dashboard.widgets.push({
                    name: "Map",
                    templateUrl: "widgets/map/map.html",
                    controller: "MapWidgetCtrl",
                    sizeX: 3,
                    sizeY: 3
                });
            } else if (type === 3) {
                $scope.dashboard.widgets.push({
                    name: "Weather",
                    templateUrl: "widgets/weather/weather.html",
                    controller: "WeatherWidgetCtrl",
                    sizeX: 3,
                    sizeY: 2
                });
            } else if (type === 4) {
                $scope.dashboard.widgets.push({
                    name: "Units",
                    templateUrl: "widgets/units/units.html",
                    controller: "UnitsWidgetCtrl",
                    sizeX: 3,
                    sizeY: 4
                });
            } else if (type === 5) {
                $scope.dashboard.widgets.push({
                    name: "Calls",
                    templateUrl: "widgets/calls/calls.html",
                    controller: "CallsWidgetCtrl",
                    sizeX: 5,
                    sizeY: 4
                });
            } else if (type === 6) {

            }
        };

        $scope.openWidgetMenu = function() {
            $rootScope.Ui.turnOn('addWidgetSettings');
        };

        $scope.openSettings = function(widget) {
            if (widget) {
                if (widget.controller === "PersonnelWidgetCtrl") {
                    $rootScope.Ui.turnOn('personnelSettings');
                } else if (widget.controller === "UnitsWidgetCtrl") {
                    $rootScope.Ui.turnOn('unitSettings');
                }
            }
        };

        $scope.saveLayout = function() {
            settingsService.setLayout($scope.dashboard.widgets);
        };

        $scope.loadLayout = function() {
            $scope.dashboard.widgets = settingsService.getLayout();
        };

        $scope.remove = function(widget) {
            if (widget) {
                var index = $scope.dashboard.widgets.indexOf(widget);
                if (index > -1) {
                    $scope.dashboard.widgets.splice(index, 1);
                }
            }
        };

        init();
        function init() {
            var layout = settingsService.getLayout();

            if (layout && layout.length > 0) {
                $scope.dashboard = {
                    id: '1',
                    name: 'Home',
                    widgets: layout
                }
            } else {
                $scope.dashboard = {
                    id: '1',
                    name: 'Home',
                    widgets: [{
                        col: 0,
                        row: 0,
                        sizeY: 4,
                        sizeX: 4,
                        id: 1,
                        name: "Personnel",
                        templateUrl: "widgets/personnel/personnel.html",
                        controller: "PersonnelWidgetCtrl"
                    }, {
                        col: 2,
                        row: 1,
                        sizeY: 2,
                        sizeX: 2,
                        id: 2,
                        name: "Map",
                        templateUrl: "widgets/map/map.html",
                        controller: "MapWidgetCtrl"
                    }]
                }
            }
        }
    }

})();