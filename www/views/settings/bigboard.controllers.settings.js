(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('SettingsController', settingsController);

    settingsController.$inject = ['$scope', '$timeout', '$rootScope', '$state', 'authService', 'settingsService', 'ngToast'];
    function settingsController($scope, $timeout, $rootScope, $state, authService, settingsService, ngToast) {
        var vm = this;

        vm.userName = '';
        vm.password = '';
        vm.saving = false;

        ngToast.create('a toast message...');

        vm.saveSettings = function () {
            vm.saving = true;

            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard)
                window.cordova.plugins.Keyboard.close();

            authService.login(vm.userName, vm.password).then(function(response) {
                settingsService.setFullName(response.data.Nme);
                settingsService.setEmailAddress(response.data.Eml);
                settingsService.setDepartmentName(response.data.Dnm);
                settingsService.setDepartmentId(response.data.Did);
                settingsService.setDepartmentCreatedOn(response.data.Dcd);
                settingsService.setUserId(response.data.Uid);
                settingsService.setAuthToken(response.data.Tkn);
                settingsService.setAuthTokenExpiry(response.data.Txd);

                settingsService.setUsername(vm.userName);
                settingsService.setPassword(vm.password);

                vm.saving = false;

                ngToast.success({
                    content: 'Error while validating your login information, try again. You may want to restart the phone and check the network connection (i.e. wifi).'
                });

                $rootScope.$broadcast(CONSTS.EVENTS.SETTINGS_SAVED);
            }, function (error) {
                if (error.status === 401) {
                    ngToast.danger({
                        content: 'Your Username or Password is incorrect, remember they are case sensitive. If you cannot remember you login or password go to resgrid.com and recover it.'
                    });

                } else {
                    ngToast.danger({
                        content: 'Error while validating your login information, try again. You may want to restart the phone and check the network connection (i.e. wifi).'
                    });

                }

                vm.saving = false;
            });
        }
    }

})();