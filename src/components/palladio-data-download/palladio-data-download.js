// Palladio data upload component

angular.module('palladioDataDownload', ['palladio.services', 'palladio'])
	.directive('palladioDataDownload', function (dataService, version, palladioService) {
		var directiveObj = {
			// scope: false,
			transclude: true,
			templateUrl: 'partials/palladio-data-download/template.html',

			link: function(scope) {
				scope.exportDataModel = function() {
					// Strip autoFields, uniques, errors from all files/fields
					var files = dataService.getFiles().map(function(f) {
						f.autoFields = [];

						f.fields.forEach(function(g) {
							g.uniques = [];
							g.errors = [];
						});

						return f;
					});

					// Strip everything but the unique file id from links
					var links = dataService.getLinks().map(function(l) {
						l.lookup.file = { uniqueId: l.lookup.file.uniqueId };
						l.source.file = { uniqueId: l.source.file.uniqueId };

						return l;
					});

					var ex = {
						version: version,
						files: files,
						links: links,
						layout: scope.layout,
						metadata: scope.project,
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