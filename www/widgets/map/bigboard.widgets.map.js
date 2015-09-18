(function () {
    'use strict';

    angular.module('bigBoard.controllers').controller('MapWidgetCtrl', mapWidgetCtrl);

    mapWidgetCtrl.$inject = ['$scope'];
    function mapWidgetCtrl($scope) {
        $scope.remove = function(widget) {
            $scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
        };

        $scope.openSettings = function(widget) {
            /*
             $modal.open({
             scope: $scope,
             templateUrl: 'demo/dashboard/widget_settings.html',
             controller: 'WidgetSettingsCtrl',
             resolve: {
             widget: function() {
             return widget;
             }
             }
             });
             */
        };
    }

})();