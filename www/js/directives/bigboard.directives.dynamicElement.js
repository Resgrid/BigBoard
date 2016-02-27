angular.module('bigBoard').directive('dynamicElement', [
        '$compile', function ($compile) {
            return {
                restrict: 'E',
                scope: {
                    newHtml: "="
                },
                replace: true,
                link: function (scope, element, attrs) {
                    scope.$parent.$watch('dynamicHtml', function () {
                        //var template = $compile(scope.$parent.dynamicHtml)(scope);
                        //element.replaceWith(template);

                        var template = scope.$parent.dynamicHtml;
                        element.html(template);
                        $compile(element.contents())(scope.$parent);
                    });
                },
                controller: [
                    '$scope', function ($scope) {

                    }
                ]
            }
        }
    ]);