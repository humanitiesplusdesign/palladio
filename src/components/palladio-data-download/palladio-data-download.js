// Palladio data upload component

angular.module('palladioDataDownload', ['palladio.services', 'palladio'])
	.directive('palladioDataDownload', function (dataService, version, palladioService) {
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
						f.fields = f.fields.concat([]).map(function(g) {
							g = shallowCopy(g);
							g.uniques = [];
							g.errors = [];
							return g;
						});

						return f;
					});

					// Strip everything but the unique file id from links
					var links = dataService.getLinks().map(function(l) {
						l = shallowCopy(l);
						l.lookup = shallowCopy(l.lookup);
						l.source = shallowCopy(l.source);

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

					// Guard against Safari (download doesn't work in Safari) until we can
					// revamp the download/share/export UI to explain this.
					if(navigator.userAgent.search("Safari") >= 0 && navigator.userAgent.search("Chrome") < 0) {
						alert("Unfortunately, download functionality doesn't work right now in Safari. Chrome and Firefox are both supported.");
					} else {
						saveAs(blob, fileName);
					}
				};
			}
		};

		return directiveObj;
	});