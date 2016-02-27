(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('WeatherWidgetCtrl', weatherWidgetCtrl);

    weatherWidgetCtrl.$inject = ['$scope', 'dataService', '$rootScope', 'settingsService'];
    function weatherWidgetCtrl($scope, dataService, $rootScope, settingsService) {

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

        var widget = document.getElementById('map').parentNode.parentNode.parentNode.parentNode.parentNode;
        var height = widget.clientHeight - 70;
        $scope.height = height + "px";

        loadData();
        function loadData() {
            dataService.getWeather().then(
                function successCallback(response) {
                    if (response && response.data) {
                        var widget = document.getElementById('map').parentNode.parentNode.parentNode.parentNode.parentNode;
                        var height = widget.clientHeight - 70;
                        $scope.height = height + "px";

                        $scope.units = response.data.WeatherUnit;
                        $scope.centerLat = response.data.Latitude;
                        $scope.centerLon = response.data.Longitude;

                        var iframe = document.getElementById('forecast_embed');
                        //iframe.src = iframe.src;
                        iframe.src = "https://forecast.io/embed/#lat=" + $scope.centerLat + "&lon=" + $scope.centerLon + "&units=" + $scope.units + "&name="
                    }
                }, function errorCallback(response) {

                });
        }
    }

})();