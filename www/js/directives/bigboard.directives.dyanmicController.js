angular.module('bigBoard').directive('ngDynamicController', ['$compile', '$parse',function($compile, $parse) {
    return {
        scope: {
            name: '=ngDynamicController'
        },
        restrict: 'A',
        terminal: true,
        priority: 100000,
        link: function(scope, elem, attrs) {
            elem.attr('ng-controller', scope.name);
            elem.removeAttr('ng-dynamic-controller');

            $compile(elem)(scope);
        }
    };
}]);