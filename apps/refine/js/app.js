var app = angular.module('refineApp', [
	'palladio',
	'ngRoute',
	'palladioApp.controllers',
	'palladioApp.services',
	'palladioApp.directives',
	'palladioApp.filters',
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