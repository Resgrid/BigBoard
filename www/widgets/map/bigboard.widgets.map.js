(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('MapWidgetCtrl', mapWidgetCtrl);

    mapWidgetCtrl.$inject = ['$scope', 'dataService', '$rootScope', '$timeout', 'settingsService'];
    function mapWidgetCtrl($scope, dataService, $rootScope, $timeout, settingsService) {
        $scope.remove = function(widget) {
            $scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
        };

        var map;
        $scope.mapData = {};
        $scope.markers = [];
        $scope.zoomLevel = 1;
        $scope.centerMapOnPins = 1;
        $scope.height = "250px";
        $scope.width = "100%";
        $scope.widgetSettings = settingsService.getPersonnelWidgetSettings();

        $scope.openSettings = function(widget) {
            $rootScope.Ui.turnOn('mapSettings');
        };

        $rootScope.$on(CONSTS.MAP_RESIZED, function (event, data) {
            var newHeight = data.height - 70;
            $scope.height = newHeight + "px";
            $scope.width = "100%";

            $timeout(function() {
                google.maps.event.trigger(map, "resize");
                map.setZoom(map.getZoom());
            }, 500);
        });

        $rootScope.$on(CONSTS.EVENTS.PERSONNEL_UPDATED, function (event, data) {
            $scope.widgetSettings = settingsService.getPersonnelWidgetSettings();
            loadData();
        });

        $rootScope.$on(CONSTS.EVENTS.CALLS_UPDATED, function (event, data) {
            $scope.widgetSettings = settingsService.getPersonnelWidgetSettings();
            loadData();
        });

        $rootScope.$on(CONSTS.EVENTS.UNITS_UPDATED, function (event, data) {
            $scope.widgetSettings = settingsService.getPersonnelWidgetSettings();
            loadData();
        });

        loadData();
        function loadData() {
            dataService.getMap().then(
                function successCallback(response) {
                    if (response && response.data) {
                        $scope.mapData = response.data;

                        var mapCenter = new google.maps.LatLng($scope.mapData.CenterLat, $scope.mapData.CenterLon);
                        var mapOptions = {
                            zoom: $scope.mapData.ZoomLevel,
                            center: mapCenter
                            //mapTypeId: google.maps.MapTypeId.ROADMAP
                        };

                        // Can be null during widget add/remove operations
                        var mapDom = document.getElementById('map');
                        if (mapDom) {
                            var widget = document.getElementById('map').parentNode.parentNode.parentNode.parentNode.parentNode;
                            var height = widget.clientHeight - 70;
                            $scope.height = height + "px";
                            $scope.width = "100%";
                        }
                        $scope.zoomLevel = $scope.mapData.ZoomLevel;
                        map = new google.maps.Map(document.getElementById('map'), mapOptions);

                        // clear map markers
                        if ($scope.markers && $scope.markers.length >= 0) {
                            // remove current markers.
                            for (var i = 0; i < $scope.markers.length; i++) {
                                $scope.markers[i].setMap(null);
                            }

                            $scope.markers = [];
                        }

                        if ($scope.mapData) {
                            var newMarkers = $scope.mapData.MapMakerInfos;
                            if (newMarkers && newMarkers.length >= 0) {

                                for (var t = 0; t < newMarkers.length; t++) {
                                    var marker = newMarkers[t];
                                    var latLng = new google.maps.LatLng(marker.Latitude, marker.Longitude);

                                    var mapMarker = new MarkerWithLabel({
                                        position: latLng,
                                        draggable: false,
                                        raiseOnDrag: false,
                                        map: map,
                                        title: marker.Title,
                                        icon: "/img/mapping/" + marker.ImagePath + ".png",
                                        labelContent: marker.Title,
                                        labelAnchor: new google.maps.Point(35, 0),
                                        labelClass: "labels",
                                        labelStyle: {opacity: 0.60}
                                    });

                                    $scope.markers.push(mapMarker);
                                }

                                if ($scope.centerMapOnPins) {
                                    var latlngbounds = new google.maps.LatLngBounds();
                                    for (var y = 0; y < newMarkers.length; y++) {
                                        var latLng = new google.maps.LatLng(newMarkers[y].Latitude, newMarkers[y].Longitude);
                                        latlngbounds.extend(latLng);
                                    }

                                    map.setCenter(latlngbounds.getCenter());
                                    map.fitBounds(latlngbounds);
                                    var zoom = map.getZoom();
                                    map.setZoom(zoom > $scope.zoomLevel ? $scope.zoomLevel : zoom);
                                }
                            }
                        }
                    }
                }, function errorCallback(response) {

                });
        }
    }

})();