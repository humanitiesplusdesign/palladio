angular.module('palladio.directives.files', [
	'palladio.services',
	'palladio'])
	.directive('filesDirective', function ($rootScope, parseService, dataService) {
		var directiveDefObj = {
			templateUrl: 'partials/files.html',

			link: function (scope, element, attrs) {

				// function to parse data
				scope.parseData = function(afterParse){
					
					// if no text return
					if (!scope.text || !scope.text.length) return;
					scope.parseError = false;
					// let's see if the text is a URL.
					if (scope.text.indexOf("http") === 0 && scope.text.indexOf("\n") === -1) {
						try {
							parseService.parseUrl(scope.text).then(
								function(csv){
									scope.text = csv;
									var data = parseService.parseText(scope.text);
									addFile(data, scope.lastFileName);
									if(afterParse) afterParse();
								},
								function(error){
									scope.parseError = error;
								});
						} catch(error) {
							scope.parseError = error.message;
						}
						return;
					}

					try {
						var data = JSON.parse(scope.text);

						addFile(data, scope.lastFileName);
						if(afterParse) afterParse();
						return;
					} catch(error) {
						try {
							var data = parseService.parseText(scope.text);
							addFile(data, scope.lastFileName);
							if(afterParse) afterParse();
						} catch(error) {
							scope.parseError = error.message;
						}
					}
				};

				scope.$watch(function(){ return $('.files-list').html(); }, function(){
					$('.tooltip').remove();
					$('*[data-toggle="tooltip"]').tooltip({container:'body'});
				});

				scope.toggleDelete = function(field) {
					field.delete = !field.delete;
					dataService.setDirty();
				};

				/* Creates a new file */

				var addFile = function(data, label) {
					scope.text = null;
					dataService.addFile(data, label);
					scope.lastFileName = null;
				};

			}
		};

		return directiveDefObj;
	});