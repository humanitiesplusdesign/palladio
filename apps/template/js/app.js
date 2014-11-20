angular.module('palladioStandaloneApp', [
	'palladio',
	'palladio.controllers',
	'palladio.services',
	'palladio.load',
	'palladio.directives',
	'palladio.filters',
	'palladioDataUpload',
	// Include Palladio component modules here.
	'palladioTimelineFilter',  // Example
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
					// Instantiate Palladio controller.
					$controller('PalladioCtrl', { '$scope': $scope });

					// Put the data on the scope for the components to use.
					$scope.data = data.data;
					$scope.metadata = data.metadata;
					$scope.xfilter = data.xfilter;

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