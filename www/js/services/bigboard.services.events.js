(function () {
    'use strict';

    angular.module('bigBoard.services').factory('eventService', eventService);

    eventService.$inject = ['$rootScope', 'SERVICEURLBASE', 'settingsService'];
    function eventService($rootScope, SERVICEURLBASE, settingsService) {
        var myConId;
        var departmentId;
        var eventHub;

        $rootScope.$on(CONSTS.EVENTS.SETTINGS_SAVED, function (event, data) {
            init();
        });

        function init() {
            $.connection.hub.url = SERVICEURLBASE + '/signalr';
            eventHub = $.connection.eventingHub;

            registerClientMethods();
            startConnection();
        }

        function startConnection() {
            departmentId = settingsService.getDepartmentId();

            if (departmentId && departmentId > 0) {
                $.connection.hub.disconnected(function () {
                    console.log('disconnected');
                    setTimeout(function () {
                        console.log('reconnecting');
                        $.connection.hub.start().done(function () {
                            console.log('connected');
                            $rootScope.$broadcast(CONSTS.EVENTS.CONNECTED);
                            eventHub.server.connect(departmentId);
                        });
                    }, 5000); // Restart connection after 5 seconds.
                });

                $.connection.hub.start().done(function () {
                    console.log('connected');
                    $rootScope.$broadcast(CONSTS.EVENTS.CONNECTED);
                    eventHub.server.connect(departmentId);
                });
            }
        }

        window.onbeforeunload = function () {
            $.connection.hub.stop();
        };

        function registerClientMethods() {
            eventHub.client.onConnected = function (id) {
                myConId = id;
            };

            eventHub.client.callsUpdated = function (id) {
                $rootScope.$broadcast(CONSTS.EVENTS.CALLS_UPDATED);
            };

            eventHub.client.personnelStatusUpdated = function (id) {
                $rootScope.$broadcast(CONSTS.EVENTS.PERSONNEL_UPDATED);
            };

            eventHub.client.unitStatusUpdated = function (id) {
                $rootScope.$broadcast(CONSTS.EVENTS.UNITS_UPDATED);
            };
        }

        return {
            init: init
        }
    }

}());