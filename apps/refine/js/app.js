var app = angular.module('refineApp', [
	'palladio',
	'ngRoute',
	'palladio.controllers',
	'palladio.services',
	'palladio.directives',
	'palladio.filters',
	'ui.codemirror']
	)
	.constant('version', '0.9')
	.config(function($routeProvider) {
		$routeProvider
			.when('/', {
				redirectTo : '/upload'
			})
			.when('/index.html', {
				redirectTo : '/upload'
			})
			.when('/upload', {
				templateUrl: 'partials/upload.html',
				controller: 'UploadRefineCtrl'
			});
	})
	.value('$strapConfig', {
		datepicker: {
			orientation : 'top'
		}
	});