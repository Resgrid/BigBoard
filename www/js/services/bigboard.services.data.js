(function () {
    'use strict';

    angular.module('bigBoard.services').factory('dataService', dataService);

    dataService.$inject = ['$q', '$http', 'SERVICEURL', 'settingsService'];
    function dataService($q, $http, SERVICEURL, settingsService) {
        var getPersonnelStatusesUrl = SERVICEURL + '/BigBoard/GetPersonnelStatuses';

        return {
            getPersonnelStatuses: function () {
                return $http.get(getPersonnelStatusesUrl);
            }
        }
    }
})();