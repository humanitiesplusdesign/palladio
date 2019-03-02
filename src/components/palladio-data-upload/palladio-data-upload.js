// Palladio data upload component

angular.module('palladioDataUpload', ['palladio.services'])
	.run(['componentService', function(componentService) {
		var compileStringFunction = function (options, newScope) {

			newScope.onLoad = options.loadFunction;
			var compileString = '<button class="btn" palladio-data-upload on-load="onLoad()">';
			compileString += '<i class="fa fa-upload"></i>&nbsp;';
			compileString += 'Import a Palladio data model</button>';

			return compileString;
		};

		componentService.register('upload', compileStringFunction);
	}])
	.directive('palladioDataUpload', ['dataService', 'loadService', 'spinnerService', function (dataService, loadService, spinnerService) {
		var directiveObj = {
			scope: {
				'load': '&onLoad',
			},
			transclude: true,
			templateUrl: require('../../components/palladio-data-upload/template.html'),

			link: function(scope) {

				scope.loadDataModel = function(input) {
					spinnerService.spin();
					var reader = new FileReader();
					reader.onload = function() {
						var json = JSON.parse(reader.result);
						loadService.loadJson(json).then(function() {
							scope.$apply(function(s) {
								s.load(json);
							});
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
	}]);