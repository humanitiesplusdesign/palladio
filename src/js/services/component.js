angular.module('palladio.components', ['palladio.services.data', 'palladio.services.load'])
	.factory('componentService', ['$compile', "$rootScope", "$http", "loadService", "dataService",
		function($compile, $scope, $http, loadService, dataService) {

		var components = {};

		var add = function(componentName, selector, options, parentScope) {
			if(options === undefined) options = {};
			if(parentScope === undefined) parentScope = $scope;

			var newScope = parentScope.$new(false);

			for(var prop in options) {
				newScope[prop] = options[prop];
			}

			var compileString = components[componentName](newScope, options);
			var directive = $compile(compileString)(newScope);

			$(selector).append(directive);

			return {
				getOptions: function() { return newScope.functions; }
			};
		};

		var register = function(componentName, compileStringFunction) {
			// compileStringFunction has signature (options, newScope)
			// Can modify newScope
			components[componentName] = compileStringFunction;
		};

		var loadData = function(url, successFunction, errorFunction) {
			if(!errorFunction) { errorFunction = function () {}; }
			$http.get(url)
				.success(function(data) {
					loadService.loadJson(data);
					successFunction(data);
				})
				.error(errorFunction);
		};

		var dimensions = function () {
			return dataService.getDataSync().metadata;
		};

		return {
			loadData: loadData,
			dimensions: dimensions,
			register: register,
			add: add
		};
	}]);

var startPalladio = function(additionalModules) {
	if(!Array.isArray(additionalModules)) { additionalModules = []; }
	var modules = [
		'palladio',
		'palladio.components',
		'palladio.controllers',
		'palladio.services',
		'palladio.directives',
		'palladio.filters',

		'ui.codemirror',
		'ui.bootstrap',
		'ui.router',
		'ui.sortable',
		'ui.select',
		'colorpicker.module',

		'palladioDataUpload',
		'palladioDataDownload',

		// Filters
		'palladioTimelineFilter',
		'palladioFacetFilter',
		'palladioPartimeFilter',
		// Views
		'palladioListView',
		'palladioMapView',
		'palladioTableView',
		'palladioSelectionView',
		'palladioGraphView'
	].concat(additionalModules);

	var appId = "palladioApp" + Math.floor(Math.random() * 10000);
	
	angular.module(appId, modules);
	
	var app = angular.bootstrap(document.createElement("div"), [appId]);
	
	return app.get('componentService');
};