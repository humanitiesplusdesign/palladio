angular.module('palladioStandaloneApp', [
	'palladio',
	'palladio.controllers',
	'palladio.services',
	'palladio.directives',
	'palladio.filters',
	'palladioDataUpload',
	'palladioTimelineFilter',
	'palladioFacetFilter',
	'palladioTableView',
	'palladioPalette',
	'ui.router'
	])
	.config(function($stateProvider, $urlRouterProvider) {
		$urlRouterProvider.otherwise("/upload");

		$stateProvider
			.state('/upload', {
				url: '/upload',
				templateUrl: 'partials/upload-standalone.html',
				controller: 'WorkflowCtrl'
			})
			.state('/visualization', {
				url: '/visualization',
				templateUrl: 'partials/visualization-standalone.html',
				controller: function($scope, data, palladioService) {
					palladioService.facetFilter("#facet-filter-here", {
						height: "600px",
						showControls: false,
						showSettings: false,
						showAccordion: false,
						showDropArea: false,
						dimensions: data.metadata.slice(0,4)
					});
				},
				resolve: {
					data: function (dataService) {
						return dataService.getData();
					}
				}
			});
	});