angular.module('palladioStandaloneApp', [
	'palladio',
	'palladioApp.controllers',
	'palladioApp.services',
	'palladioApp.load',
	'palladioApp.directives',
	'palladioApp.filters',
	'palladioDataUpload',
	'palladioTimespanFilter',
	'palladioTimestepFilter',
	'palladioPartimeFilter',
	'palladioPardurationFilter',
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
				controller: function ($scope, $location) {
					$scope.onLoad = function() {
						$location.path('/visualization');
					};
				}
			})
			.when('/visualization', {
				templateUrl: 'partials/visualization-standalone.html',
				controller: function ($scope, data, $controller, $location) {
					// Redirect back to the upload screen and reload if we don't have data.
					if(data.metadata === undefined) {
						$location.path('/');
					}
				},
				resolve: {
					data: 'dataPromise'
				}
			});
	});