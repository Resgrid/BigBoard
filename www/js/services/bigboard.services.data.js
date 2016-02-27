(function () {
    'use strict';

    angular.module('bigBoard.services').factory('dataService', dataService);

    dataService.$inject = ['$http', 'SERVICEURL'];
    function dataService($http, SERVICEURL) {
        var getPersonnelStatusesUrl = SERVICEURL + '/BigBoard/GetPersonnelStatuses';
        var geMapUrl = SERVICEURL + '/BigBoard/GetMap';
        var geWeatherUrl = SERVICEURL + '/BigBoard/GetWeather';
        var geUnitStatusesUrl = SERVICEURL + '/BigBoard/GetUnitStatuses';
        var geCallsUrl = SERVICEURL + '/BigBoard/GetCalls';
        var geGroupsUrl = SERVICEURL + '/BigBoard/GetGroups';

        return {
            getPersonnelStatuses: function () {
                return $http.get(getPersonnelStatusesUrl);
            },
            getMap: function () {
                return $http.get(geMapUrl);
            },
            getWeather: function () {
                return $http.get(geWeatherUrl);
            },
            getUnitStatuses: function () {
                return $http.get(geUnitStatusesUrl);
            },
            getCalls: function () {
                return $http.get(geCallsUrl);
            },
            getGroups: function () {
                return $http.get(geGroupsUrl);
            }
        }
    }
})();