angular.module('palladioSchema', ['palladio', 'palladio.services'])
	.run(['componentService', function(componentService) {
		var compileStringFunction = function (newScope, options) {

			var compileString = '<div data-palladio-schema></div>';

			return compileString;
		};

		componentService.register('schema', compileStringFunction);
	}])
	.directive('palladioSchema', function (palladioService, dataService) {
		return {
			scope : true,
			template : '<div id="main">' +
							'<h1 class="schema-h1">Schema</h1>' +
							'<h2 class="schema-h2">{{metadata.title}}</h2>' +
							'<p>Author: {{metadata.author}}' +
							'<p>Date: {{metadata.date}}' +
							'<p>Description: {{metadata.description}}' +
							'<h3 class="file-name schema-h3" ng-repeat-start="file in files">{{file.label}} table</h3>' +
							
							'<p>Table description (currently not supported in schema)</p>' +
							
							'<p ng-repeat-start="field in file.fields">' +
								'<strong>{{field.description}}</strong>: ({{field.type}})' +
							'</p>' +
							'<ol ng-if="field.uniques.length < 10">' +
								'<li ng-repeat="unique in field.uniques">{{unique.key}} ({{unique.value}} occurences)</li>' +
							'</ol>' +
							'<span ng-repeat-end></span>' +
							'<span ng-repeat-end>' +
						'</div>',
			link : {
				pre : function(scope, element) {

				},

				post : function(scope, element, attrs) {
					scope.metadata = dataService.getMetadata();
					scope.files = dataService.getFiles();
					scope.links = dataService.getLinks();

					console.log(scope.files);
					console.log(scope.metadata);
				}
			}
		};
	});
