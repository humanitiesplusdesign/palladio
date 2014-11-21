// Palladio data upload component

angular.module('palladioDataUpload', ['palladioApp.services'])
	.directive('palladioDataUpload', function (dataService, loadService) {
		var directiveObj = {
			scope: {
				'load': '&onLoad'
			},
			transclude: true,
			templateUrl: 'partials/palladio-data-upload/template.html',

			link: function(scope) {

				scope.loadDataModel = function(input) {
					loadService.load(input).then(function () {
						scope.load();
					});
				};

				scope.triggerDataModelSelector = function () {
					$('#dataModelSelector').click();
				};
			}
		};

		return directiveObj;
	});