// Palladio data upload component

angular.module('palladioDataDownload', ['palladio.services', 'palladio'])
	.directive('palladioDataDownload', ['dataService', 'version', 'palladioService', function (dataService, version, palladioService) {
		var directiveObj = {
			// scope: false,
			transclude: true,
			templateUrl: 'partials/palladio-data-download/template.html',

			link: function(scope) {
				function shallowCopy(obj) {
					var copy = {};
					for (var attr in obj) {
						if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
					}
					return copy;
				}

				scope.exportDataModel = function() {
					// Strip autoFields, uniques, errors from all files/fields
					var files = dataService.getFiles().map(function(f) {
						f = shallowCopy(f);

						f.autoFields = [];
						f.fields = f.fields.concat([])
							.map(function(g) {
								g = shallowCopy(g);
								if(g.descriptiveField && g.descriptiveField.key) g.descriptiveField = g.descriptiveField.key;
								g.uniques = [];
								g.errors = [];
								return g;
							});

						if(f.url && f.loadFromURL) {
							f.data = [];
						}

						return f;
					});

					// Strip everything but the unique file id from links
					var links = dataService.getLinks().map(function(l) {
						l = shallowCopy(l);
						l.lookup = shallowCopy(l.lookup);
						l.source = shallowCopy(l.source);
						l.lookup.field = shallowCopy(l.lookup.field);
						l.source.field = shallowCopy(l.source.field);

						l.lookup.field.uniques = [];
						l.lookup.field.errors = [];
						l.source.field.uniques = [];
						l.source.field.errors = [];
						if(l.lookup.field.descriptiveField && l.lookup.field.descriptiveField.key) l.lookup.field.descriptiveField = l.lookup.field.descriptiveField.key;
						if(l.source.field.descriptiveField && l.source.field.descriptiveField.key) l.source.field.descriptiveField = l.source.field.descriptiveField.key;

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
					if(scope && scope.project && scope.project.title) {
						fileName = scope.project.title + ".palladio." + version + ".json";
					}

					// Guard against Safari (download doesn't work the same in Safari) until we can
					// revamp the download/share/export UI to explain this.
					if(navigator.userAgent.search("Safari") >= 0 && navigator.userAgent.search("Chrome") < 0) {
						alert("Unfortunately, because of compatibility issues with Safari, the save file will download as a file with name 'Unknown'.");
						blob = new Blob(
							[ JSON.stringify(ex) ],
							{type: 'application/octet-stream' }
						);
						saveAs(blob, 'name');
					} else {
						saveAs(blob, fileName);
					}
				};
			}
		};

		return directiveObj;
	}]);