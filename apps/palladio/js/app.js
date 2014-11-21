var app = angular.module('palladioApp', [
	'palladio',
	'palladioApp.controllers',
	'palladioApp.services',
	'palladioApp.directives',
	'palladioApp.filters',
	'ui.codemirror',
	'ngRoute',
	
	// Filters
	'palladioTimelineFilter',
	'palladioArctimeFilter',
	'palladioFacetFilter',
	'palladioLifetimeFilter',
	// Views
	'palladioListView',
	'palladioMapView',
	'palladioTableView',
	'palladioSelectionView',
	'palladioTimechartView',
	'palladioGraphView',
	// Widgets
	'palladioDownloadWidget']
	)
	.constant('version', '0.9')
	.config(function($routeProvider) {
		$routeProvider
			.when('/', {
				//templateUrl: 'partials/upload.html',
				redirectTo : '/upload'
			})
			.when('/index.html', {
				//templateUrl: 'partials/upload.html'
				redirectTo : '/upload'
			})
			.when('/upload', {
				templateUrl: 'partials/upload.html',
				controller: 'UploadRefineCtrl'
			})
			.when('/link', {
				templateUrl: 'partials/link.html'
			})
			.when('/visualization', {
				templateUrl: 'partials/visualization.html',
				controller: 'VisualizationCtrl',
				resolve: {
					data: 'dataPromise'
				}
			});
	})
	.value('$strapConfig', {
		datepicker: {
			orientation : 'top'
		}
	});