angular.module('palladio.directives.filePills', ['palladio'])
	.directive('palladioFilePills', [function() {
		return {
			scope: {
				model: '=',
				files: '='
			},
			template:   '<span ng-repeat="file in files()">' +
							'<span class="file-pill" data-ng-class="{\'file-pill-checked\': check(file)}">' +
								'<label class="checkbox">' +
									'<input type="checkbox" ng-click="select(file)" ng-checked="check(file)"> {{file.label}}' +
								'</label>' +
							'</span>' +
						'</span>',
			// template:   '<span ng-repeat="file in files()"></span>',
			link: function postLink(scope) {

				scope.select = function(file) {
					if(scope.model != null && scope.model != undefined && file.uniqueId === scope.model) {
						scope.model = null;
					} else {
						scope.model = file.uniqueId;
					}
				};

				scope.check = function(file) {
					return scope.model === file.uniqueId;
				};
			}
		};
	}]);