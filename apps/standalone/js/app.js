angular.module('palladioStandaloneApp', [
	'palladio',
	'palladioApp.controllers',
	'palladioApp.services',
	'palladioApp.directives',
	'palladioApp.filters',
	'palladioHistogramFilter',
	'palladioTimelineFilter',
	'palladioFacetFilter',
	'palladioTableView',
	'ngRoute'
	])
	.config(function($routeProvider) {
		$routeProvider
			.when('/', {
				redirectTo : '/upload'
			})
			.when('/index.html', {
				redirectTo : '/upload'
			})
			.when('/upload', {
				templateUrl: 'partials/upload-standalone.html',
				controller: 'WorkflowCtrl'
			})
			.when('/visualization', {
				templateUrl: 'partials/visualization-standalone.html',
				controller: 'VisualizationCtrl',
				resolve: {
					data: 'dataPromise'
				}
			});
	});