angular.module('palladio.directives.yasgui', [
	'palladio.services'])

	.directive('yasgui', function (spinnerService) {
		return {
			restrict: 'E',
			scope: {
				data : "=data",
				endpoint : "=endpoint"
			},
			template:	'<div>' +
							'<label>SPARQL endpoint</label>' +
							'<input type="text" data-ng-model="endpoint"/>' +
						'</div>' +
						'<div></div>' +
						'<button class="btn" ng-disabled="!endpoint" ng-click="query()" ng-show="!text">Run query</button>' +
						'<div data-ng-show="data" class="yasr-data-display"></div>',
			link: function (scope, element, attrs) {
				var yasqe = YASQE(element.children()[1], {
					createShareLink: false,
					sparql: {
						showQueryButton: false,
						acceptHeader: "text/csv",
						endpoint:scope.endpoint
					}
				});

				scope.$watch('endpoint', function(newVal, oldVal) {
					yasqe.options.sparql.endpoint = newVal;
				});

				scope.query = function() {
					spinnerService.spin();
					yasqe.query();
				};

				var yasr = YASR(element.children()[3], {
					//this way, the URLs in the results are prettified using the defined prefixes in the query
					getUsedPrefixes: yasqe.getPrefixesFromQuery,
					drawOutputSelector: false,
					drawDownloadIcon: false
				});

				/**
				* Set some of the hooks to link YASR and YASQE
				*/
				yasqe.options.sparql.handlers.success = function(data, textStatus, xhr) {
					scope.$apply(function(scope) {
						spinnerService.hide();
						yasr.setResponse({response: data, contentType: xhr.getResponseHeader("Content-Type")});
						scope.data = data;
					});
				};
				yasqe.options.sparql.handlers.error = function(xhr, textStatus, errorThrown) {
					spinnerService.hide();
					var exceptionMsg = textStatus + " (response status code " + xhr.status + ")";
					if (errorThrown && errorThrown.length) exceptionMsg += ": " + errorThrown;
					yasr.setResponse({exception: exceptionMsg});
				};
			}
		};
	});