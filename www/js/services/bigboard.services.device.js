(function() {
    'use strict';

    angular.module('bigBoard.services').factory('deviceService', deviceService);

    deviceService.$inject = [];
        function deviceService() {
        var getDeviceUUID = function () {

            if (window && window.plugins &&  window.plugins.uniqueDeviceID) {
                window.plugins.uniqueDeviceID.get(function (uuid) {
                    return uuid;
                }, function (e) {
                    return "";
                });
            } else {
                return "";
            }
        };

        return {
            getDeviceUUID: getDeviceUUID
        };
    };
}());