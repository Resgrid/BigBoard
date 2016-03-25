(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('AboutController', aboutController);

    aboutController.$inject = ['$scope', '$timeout', '$rootScope', '$state', 'VERSION', 'analyticsService'];
    function aboutController($scope, $timeout, $rootScope, $state, VERSION, analyticsService) {
        var vm = this;

        vm.version = VERSION;
        analyticsService.trackFeature("About");
    }

})();