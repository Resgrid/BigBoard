(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('HomeController', homeController);

    homeController.$inject = ['$scope', '$timeout', '$rootScope', 'settingsService'];
    function homeController($scope, $timeout, $rootScope, settingsService) {
        $scope.gridsterOptions = {
            margins: [20, 20],
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
                    //var elem = angular.element(document.querySelector('[ng-app]'));
                    //var injector = elem.injector();
                    //var controller = injector.get(widget.controller);
                    //controller.resize(event, $element, widget);

                    //angular.element($element).scope().resize(event, $element, widget);

                    var ele = $element[0];
                    $rootScope.$broadcast(CONSTS.MAP_RESIZED, {
                        width: ele.clientWidth,
                        height: ele.clientHeight
                    })

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
                    sizeX: 4,
                    sizeY: 4
                });
            } else if (type === 2) {

            } else if (type === 3) {

            } else if (type === 4) {

            } else if (type === 5) {

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