(function () {
    'use strict';

    angular.module('bigBoard.services').factory('eventService', eventService);

    eventService.$inject = ['$rootScope', 'SERVICEURLBASE', 'settingsService', 'analyticsService'];
    function eventService($rootScope, SERVICEURLBASE, settingsService, analyticsService) {
        var myConId;
        var departmentId;
        var eventHub;

        $rootScope.$on(CONSTS.EVENTS.SETTINGS_SAVED, function (event, data) {
            init();
        });

        function init() {
            $.connection.hub.url = SERVICEURLBASE + '/signalr';
            //$.connection.hub.url = 'http://resgridapi.local/signalr';

            eventHub = $.connection.eventingHub;

            registerClientMethods();
            startConnection();
        }

        function startConnection() {
            departmentId = settingsService.getDepartmentId();

            if (departmentId && departmentId > 0) {
                $.connection.hub.disconnected(function () {
                    console.log('disconnected');
                    analyticsService.trackFeature("Eventing - Disconnected");

                    setTimeout(function () {
                        console.log('reconnecting');
                        analyticsService.trackFeature("Eventing - Reconnecting");

                        $.connection.hub.start().done(function () {
                            console.log('connected');
                            analyticsService.trackFeature("Eventing - Reconnecting Successful");

                            $rootScope.$broadcast(CONSTS.EVENTS.CONNECTED);
                            eventHub.server.connect(departmentId);
                        }).fail(function(){ console.log('Could not connect'); analyticsService.trackFeature("Eventing - Reconnecting Failed"); });
                    }, 5000); // Restart connection after 5 seconds.
                });

                $.connection.hub.start().done(function () {
                    console.log('connected');
                    analyticsService.trackFeature("Eventing - Connected");

                    $rootScope.$broadcast(CONSTS.EVENTS.CONNECTED);
                    eventHub.server.connect(departmentId);
                }).fail(function(){ console.log('Could not connect'); analyticsService.trackFeature("Eventing - Connect Failed"); });
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