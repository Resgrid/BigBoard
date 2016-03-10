(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('HomeController', homeController);

    homeController.$inject = ['$scope', '$rootScope', 'settingsService', 'ngToast'];
    function homeController($scope, $rootScope, settingsService, ngToast) {
        $scope.gridsterOptions = {
            margins: [10, 10],
            columns: 48,
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
                    id: 1,
                    name: "Personnel",
                    templateUrl: "widgets/personnel/personnel.html",
                    controller: "PersonnelWidgetCtrl",
                    sizeX: 30,
                    sizeY: 14
                });
            } else if (type === 2) {
                $scope.dashboard.widgets.push({
                    id: 2,
                    name: "Map",
                    templateUrl: "widgets/map/map.html",
                    controller: "MapWidgetCtrl",
                    sizeX: 18,
                    sizeY: 15
                });
            } else if (type === 3) {
                $scope.dashboard.widgets.push({
                    id: 3,
                    name: "Weather",
                    templateUrl: "widgets/weather/weather.html",
                    controller: "WeatherWidgetCtrl",
                    sizeX: 18,
                    sizeY: 9
                });
            } else if (type === 4) {
                $scope.dashboard.widgets.push({
                    id: 4,
                    name: "Units",
                    templateUrl: "widgets/units/units.html",
                    controller: "UnitsWidgetCtrl",
                    sizeX: 14,
                    sizeY: 10
                });
            } else if (type === 5) {
                $scope.dashboard.widgets.push({
                    id: 5,
                    name: "Calls",
                    templateUrl: "widgets/calls/calls.html",
                    controller: "CallsWidgetCtrl",
                    sizeX: 16,
                    sizeY: 10
                });
            }
        };

        $scope.isWidgetActive = function(id) {
            for (var i = 0; i < $scope.dashboard.widgets.length; i++) {
                if ($scope.dashboard.widgets[i].id == id)
                    return true;
            }

            return false;
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
                } else if (widget.controller === "CallsWidgetCtrl") {
                    $rootScope.Ui.turnOn('callSettings');
                } else if (widget.controller === "WeatherWidgetCtrl") {
                    $rootScope.Ui.turnOn('weatherSettings');
                } else if (widget.controller === "MapWidgetCtrl") {
                    $rootScope.Ui.turnOn('mapSettings');
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
            $scope.dashboard = {
                id: '1',
                name: 'Home',
                widgets: []
            };

            if (settingsService.areSettingsSet()) {
                var layout = settingsService.getLayout();

                if (layout && layout.length > 0) {
                    $scope.dashboard.widgets = layout
                } else {
                    ngToast.warning({
                        content: 'You have not added any widgets. Use the 3 dot menu in the upper right hand corner to add widgets, then use that menu to save the layout you created.'
                    });
                }
            } else {
                ngToast.warning({
                    content: 'You have not set your username or password. Please set those in the Settings area before adding any widgets.'
                });
            }
        }
    }

})();