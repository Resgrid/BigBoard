(function () {
    'use strict';

    angular.module('bigBoard.services').factory('dataService', dataService);

    dataService.$inject = ['$http', 'SERVICEURL'];
    function dataService($http, SERVICEURL) {
        var getPersonnelStatusesUrl = SERVICEURL + '/BigBoard/GetPersonnelStatuses';

        return {
            getPersonnelStatuses: function () {
                return $http.get(getPersonnelStatusesUrl);
            }
        }
    }
})();