// Palladio data upload component

angular.module('palladioDataDownload', ['palladioApp.services', 'palladio'])
	.directive('palladioDataDownload', function (dataService, version, palladioService) {
		var directiveObj = {
			// scope: false,
			transclude: true,
			templateUrl: 'partials/palladio-data-download/template.html',

			link: function(scope) {

				scope.exportDataModel = function() {
					var ex = {
						version: version,
						files: dataService.getFiles(),
						links: dataService.getLinks(),
						layout: scope.layout,
						vis: palladioService.getStateFunctions().map(function(s) {
							return {
								type: s.type,
								importJson: s.export()
							};
						})
					};
					var blob = new Blob(
						[ JSON.stringify(ex) ],
						{type: "application/json;charset=utf-8"}
					);
					var fileName = "Data export.palladio." + version + ".json";
					saveAs(blob, fileName);
				};
			}
		};

		return directiveObj;
	});