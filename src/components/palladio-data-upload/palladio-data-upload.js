// Palladio data upload component

angular.module('palladioDataUpload', ['palladio.services'])
	.directive('palladioDataUpload', function (dataService, loadService, spinnerService) {
		var directiveObj = {
			scope: {
				'load': '&onLoad',
			},
			transclude: true,
			templateUrl: 'partials/palladio-data-upload/template.html',

			link: function(scope) {

				scope.loadDataModel = function(input) {
					spinnerService.spin();
					var reader = new FileReader();
					reader.onload = function() {
						var json = JSON.parse(reader.result);
						loadService.loadJson(json);
						scope.$apply(function(s) {
							s.load(json);
						});
					};
					reader.readAsText(input.files[0]);
					// We need to clear the input so that we pick up future uploads. This is *not*
					// cross-browser-compatible.
					input.value = null;
				};

				scope.triggerDataModelSelector = function () {
					$('#dataModelSelector').click();
				};
			}
		};

		return directiveObj;
	});