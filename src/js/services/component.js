angular.module('palladio.components', ['palladio.services.data', 'palladio.services.load'])
	.factory('componentService', ['$compile', "$rootScope", "$http", "loadService", "dataService",
		function($compile, $scope, $http, loadService, dataService) {

		// Insert a facet filter into the DOM, wired into the Palladio model.
		//
		// Options
		//		showControls: true
		//		showAccordion: true
		//		showDropArea: true
		//		dimensions: []
		//		aggregation: []
		//		height: 300px
		var facetComponent = function(selector, options) {
			if(options === undefined) options = {};

			// var newScope = scope.$new(true, scope.$parent);
			var newScope = $scope.$new(false);
			var compileString = '<div data-palladio-facet-filter ';

			compileString += options.showControls !== undefined ? 'show-controls="' + options.showControls + '" ' : 'show-controls="false" ';
			compileString += options.showAccordion !== undefined ? 'show-accordion="' + options.showAccordion + '" ' : 'show-accordion="false" ';
			compileString += options.showDropArea !== undefined ? 'show-drop-area="' + options.showDropArea + '" ' : 'show-drop-area="false" ';
			compileString += options.showSettings !== undefined ? 'show-settings="' + options.showSettings + '" ' : 'show-settings="false" ';
			compileString += options.height ? 'height="' + options.height + '" ' : 'height="300px" ';

			if(options.dimensions) {
				newScope.dimensions = angular.copy(options.dimensions);
				compileString += 'config-dimensions="dimensions" ';
			}

			if(options.aggregation) {
				newScope.aggregation = angular.copy(options.aggregation);
				compileString += 'config-aggregation="aggregation" ';
			}

			compileString += '></div>';

			var directive = $compile(compileString)(newScope);

			$(selector).append(directive);
		};

		var tableComponent = function(selector, options) {
			if(options === undefined) options = {};

			// var newScope = scope.$new(true, scope.$parent);
			var newScope = $scope.$new(false);
			var compileString = '<div class="with-settings" data-palladio-table-view-with-settings ';
			compileString += options.showSettings !== undefined ? 'show-settings="' + options.showSettings + '" ' : 'show-settings="false" ';
			compileString += options.height ? 'height="' + options.height + '" ' : 'height="300px" ';

			if(options.dimensions) {
				newScope.dimensions = angular.copy(options.dimensions);
				compileString += 'config-dimensions="dimensions" ';
			}

			if(options.row) {
				newScope.row = angular.copy(options.row);
				compileString += 'config-row="row" ';
			}

			compileString += '></div>';

			var directive = $compile(compileString)(newScope);

			$(selector).append(directive);
		};

		var uploadComponent = function(selector, loadFunction) {

			// var newScope = scope.$new(true, scope.$parent);
			var newScope = $scope.$new(false);

			newScope.onLoad = loadFunction;
			var compileString = '<button class="btn" palladio-data-upload on-load="onLoad()">';
			compileString += '<i class="fa fa-upload"></i>&nbsp;';
			compileString += 'Import a Palladio data model</button>';

			var directive = $compile(compileString)(newScope);

			$(selector).append(directive);
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
			facetComponent: facetComponent,
			tableComponent: tableComponent,
			uploadComponent: uploadComponent,
			loadData: loadData,
			dimensions: dimensions
		};
	}]);

var startPalladio = function(selector, additionalModules) {
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
	
	angular.module('palladioApp', modules);
	
	if(!selector) { selector = document; }
	
	var app = angular.bootstrap(selector, ['palladioApp']);
	
	return app.get('componentService');
};