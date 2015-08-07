angular.module('palladio.components', ['palladio.services.data', 'palladio.services.load'])
	.factory('componentService', ['$compile', "$rootScope", function($compile, $scope) {

		// Insert a facet filter into the DOM, wired into the Palladio model.
		//
		// Options
		//		showControls: true
		//		showAccordion: true
		//		showDropArea: true
		//		dimensions: []
		//		aggregation: []
		//		height: 300px
		var facetFilter = function(selector, options) {
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

		var tableView = function(selector, options) {
			if(options === undefined) options = {};

			// var newScope = scope.$new(true, scope.$parent);
			var newScope = $scope.$new(false);
			var compileString = '<div class="with-settings" data-palladio-table-view-with-settings></div>';

			var directive = $compile(compileString)(newScope);

			$(selector).append(directive);
		};

		var dataUpload = function(selector, loadFunction) {

			// var newScope = scope.$new(true, scope.$parent);
			var newScope = $scope.$new(false);

			newScope.onLoad = loadFunction;
			var compileString = '<button class="btn" palladio-data-upload on-load="onLoad()">';
			compileString += '<i class="fa fa-upload"></i>&nbsp;';
			compileString += 'Import a Palladio data model</button>';

			var directive = $compile(compileString)(newScope);

			$(selector).append(directive);
		};


		return {
			facetFilter: facetFilter,
			tableView: tableView,
			dataUpload: dataUpload
		};
	}]);