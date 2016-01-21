(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('AboutController', aboutController);

    aboutController.$inject = ['$scope', '$timeout', '$rootScope', '$state', 'VERSION'];
    function aboutController($scope, $timeout, $rootScope, $state, VERSION) {
        var vm = this;

        vm.version = VERSION;
    }

})();