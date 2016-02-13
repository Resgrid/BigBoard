(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('SettingsController', settingsController);

    settingsController.$inject = ['$rootScope', 'authService', 'settingsService', 'ngToast'];
    function settingsController($rootScope, authService, settingsService, ngToast) {
        var vm = this;

        vm.username = '';
        vm.password = '';
        vm.saving = false;

        (function activate() {
            vm.username = settingsService.getUsername();
            vm.password = settingsService.getPassword();
        })();

        vm.saveSettings = function () {

            if (vm.username && vm.password) {
                vm.saving = true;

                if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard)
                    window.cordova.plugins.Keyboard.close();

                authService.login(vm.username, vm.password).then(function (response) {
                    settingsService.setFullName(response.data.Nme);
                    settingsService.setEmailAddress(response.data.Eml);
                    settingsService.setDepartmentName(response.data.Dnm);
                    settingsService.setDepartmentId(response.data.Did);
                    settingsService.setDepartmentCreatedOn(response.data.Dcd);
                    settingsService.setUserId(response.data.Uid);
                    settingsService.setAuthToken(response.data.Tkn);
                    settingsService.setAuthTokenExpiry(response.data.Txd);

                    settingsService.setUsername(vm.username);
                    settingsService.setPassword(vm.password);

                    vm.saving = false;

                    ngToast.success({
                        content: 'Saved your settings successfully!'
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
            } else {
                ngToast.warning({
                    content: 'You need to supply your username and password.'
                });
            }
        }
    }

})();