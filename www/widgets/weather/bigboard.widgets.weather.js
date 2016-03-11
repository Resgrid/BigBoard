(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('WeatherWidgetCtrl', weatherWidgetCtrl);

    weatherWidgetCtrl.$inject = ['$scope', 'dataService', '$rootScope', 'settingsService', '$interval'];
    function weatherWidgetCtrl($scope, dataService, $rootScope, settingsService, $interval) {

        var refreshTimer = null;
        $scope.units = "us";
        $scope.centerLat = 0;
        $scope.centerLon = 0;
        $scope.height = "250px";
        $scope.width = "100%";
        $scope.widgetSettings = settingsService.getWeatherWidgetSettings();

        $rootScope.$on(CONSTS.EVENTS.WEATHER_SETTINGS_UPDATED, function (event, data) {
            $scope.widgetSettings = settingsService.getWeatherWidgetSettings();
            loadData();
        });

        $scope.$on("$destroy", function handler() {
            $interval.cancel(refreshTimer);
        });

        refreshTimer = $interval(loadData, 3600000);

        loadData();
        function loadData() {

            if ($scope.widgetSettings && $scope.widgetSettings.centerLat > 0 &&  $scope.widgetSettings.centerLon > 0) {
                var iframe = document.getElementById('forecast_embed');
                if (iframe) {
                    iframe.src = window.location.protocol + "//forecast.io/embed/#lat=" + scope.widgetSettings.centerLat + "&lon=" + scope.widgetSettings.centerLon + "&units=" + scope.widgetSettings.units + "&name="
                }

                resize();
            } else {
                dataService.getWeather().then(
                    function successCallback(response) {
                        if (response && response.data) {
                            resize();

                            $scope.units = response.data.WeatherUnit;
                            $scope.centerLat = response.data.Latitude;
                            $scope.centerLon = response.data.Longitude;

                            var iframe = document.getElementById('forecast_embed');
                            if (iframe) {
                                iframe.src = window.location.protocol + "//forecast.io/embed/#lat=" + $scope.centerLat + "&lon=" + $scope.centerLon + "&units=" + $scope.units + "&name="
                            }
                        }
                    }, function errorCallback(response) {

                    });
            }
        }

        function resize() {
            var domWidget = document.getElementById('map');
            if (domWidget) {
                var widget = domWidget.parentNode.parentNode.parentNode.parentNode.parentNode;
                var height = widget.clientHeight - 70;
                $scope.height = height + "px";
            }
        }
    }

})();