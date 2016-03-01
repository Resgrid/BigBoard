(function () {
    'use strict';

    angular.module('bigBoard.services').factory('eventService', eventService);

    eventService.$inject = ['$rootScope', 'SERVICEURLBASE', 'settingsService'];
    function eventService($rootScope, SERVICEURLBASE, settingsService) {
        var myConId;
        var departmentId;

        var eventHub = $.connection.eventingHub;

        function init() {
            registerClientMethods();
            startConnection();
        }

        function startConnection() {
            $.connection.hub.url = SERVICEURLBASE + '/signalr';
            departmentId = settingsService.getDepartmentId();

            $.connection.hub.start().done(function () {
                eventHub.server.connect(departmentId);
            });
        }

        function registerClientMethods() {
            eventHub.client.onConnected = function (id) {
                myConId = id;
            };

            eventHub.client.callsUpdated = function (departmentId, id) {
                $rootScope.$broadcast(CONSTS.EVENTS.CALLS_UPDATED);
            };

            eventHub.client.personnelStatusUpdated = function (departmentId, id) {
                $rootScope.$broadcast(CONSTS.EVENTS.PERSONNEL_UPDATED);
            };

            eventHub.client.unitStatusUpdated = function (departmentId, id) {
                $rootScope.$broadcast(CONSTS.EVENTS.UNITS_UPDATED);
            };
        }

        return {
            init: init
        }
    }

}());