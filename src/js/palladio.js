// Palladio framework

// See demo.html in palladio-timeline-filter repository or
// https://github.com/humanitiesplusdesign/palladio/wiki/Framework-definition
// for usage examples.

angular.module('palladio', [])
	.constant('version', '1.2.0-beta.05')
	.factory('palladioService', ['$compile', "$rootScope", '$q', function($compile, $scope, $q) {

		var updateListeners = d3.map();

		var registerUpdateListener = function (id, listener) {
			updateListeners.set(id, listener);
			return deregisterUpdateListener.bind(this, id);
		};

		var deregisterUpdateListener = function (id) {
			updateListeners.remove(id);
		};

		var updateRunning = false;
		var updateQueued = false;

		var update = function () {
			if(!updateRunning) {
				updateRunning = true;
				preUpdate.forEach(function(f) { f(); });
				$q.all(updateListeners.values().map(function (u) {
					var d = $q.defer();
					setTimeout(function() {
						u();
						d.resolve();
					});
					return d.promise;
				})).then(function(){
					postUpdate.forEach(function(f) { f(); });

					// Check for a queued update. Happens if an update is requested
					// while this update was running.
					if(updateQueued) {
						updateRunning = false;
						updateQueued = false;
						update();
					} else {
						updateRunning = false;
						updateQueued = false;
					}
				});
			} else {
				// An update is already running. Queue so that another update is run
				// once the current one is finished.
				updateQueued = true;
			}
		};

		var preUpdate = [];
		var registerPreUpdateFunction = function(func) {
			preUpdate.push(func);
		};

		var postUpdate = [];
		var registerPostUpdateFunction = function(func) {
			postUpdate.push(func);
		};

		var filters = d3.map();

		//	setFilter takes 4 arguments:
		//   1. A unique key. If this key changes within a directive, the directive *must*
		//			send an 'updateFilter' event with the old key and a null 2nd argument. It
		//			can then optionally send a new 'updateFilter' event with the new key.
		//   2. The title to display for the current filters on the dimension (String)
		//   3. The text to display for the current filters on the dimension (String).
		//   4. A function that will clear the current filters on the dimension and do any
		//			other cleanup required by the directive.

		var setFilter = function (id, titleText, filterText, removeFilterCallback) {
			if(id && titleText && filterText && removeFilterCallback) {
				filters.set(id, [titleText, filterText, removeFilterCallback]);
			} else {
				console.error("Must provide id, titleText, filterText, and a removal callback.");
			}
			return removeFilter.bind(this, id);
		};

		var getFilters = function () {
			return filters;
		};

		var removeFilter = function (id) {
			filters.remove(id);
			update();
		};

		//	Experimental: setHighlight takes 1 argument: A function taking a record and
		//  returning true/false. Indicates whether a record is within the highlight or
		//  or not.

		var highlight;
		var highlightWatches = d3.map();

		var setHighlight = function (test) {
			if(typeof test === 'function') {
				highlight = test;
				highlightWatches.values().forEach(function(c) { c(); });
			} else {
				console.error("setHighlight only takes a function as its argument.");
			}
			return removeHighlight;
		};

		var getHighlight = function () {
			return highlight;
		};

		var watchHighlight = function (id, callback) {
			highlightWatches.set(id, callback);
			return unwatchHighlight.bind(this, id);
		};

		var unwatchHighlight = function (id) {
			highlightWatches.remove(id);
		};

		var removeHighlight = function () {
			highlight = function () { return true; };
			highlightWatches.values().forEach(function(c) { c(); });
			update();
		};

		removeHighlight();



		var resetCallbacks = d3.map();

		var registerResetCallback = function (id, callback) {
			resetCallbacks.set(id, callback);
			return deregisterResetCallback.bind(this, id);
		};

		var deregisterResetCallback = function (id) {
			resetCallbacks.remove(id);
		};

		var reset = function () {
			resetCallbacks.values().forEach(function (f) { f(); });
		};


		var searchCallbacks = d3.map();

		var registerSearchCallback = function (id, callback) {
			searchCallbacks.set(id, callback);
			return deregisterSearchCallback.bind(this, id);
		};

		var deregisterSearchCallback = function (id) {
			searchCallbacks.remove(id);
		};

		var search = function (searchText) {
			searchCallbacks.values().forEach(function (s) { s(searchText); });
		};



		var stateFunctions = d3.map();
		var overrideHandlers = d3.map();

		var registerStateFunctions = function (id, type, exp, imp, handlerList, handler) {
			if(handlerList) {
				handlerList.forEach(function (h) {
					overrideHandlers.set(h, handler);
				});
			}

			if(overrideHandlers.has(type)) {
				// An override handler has been defined. Basically, an existing component has
				// asked to manage these types of components. A component of components.
				//
				// The override handler should return a function that may or may not deregister
				// the state functions.
				return overrideHandlers.get(type)(id, type, exp, imp);
			} else {
				stateFunctions.set(id, { type: type, export: exp, import: imp });
				return deregisterStateFunctions.bind(null, id);
			}
		};

		var deregisterStateFunctions = function (id) {
			stateFunctions.remove(id);
		};

		var getStateFunctions = function () {
			return stateFunctions.values();
		};


		// Insert a facet filter into the DOM, wired into the Palladio model.
		//
		// Options
		//		showControls: true
		//		showAccordion: true
		//		showDropArea: true
		//		dimensions: []
		//		aggregation: []
		//		height: 300px
		//
		// NOTE: To be removed. Going into a separate service
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

		return {
			onUpdate: registerUpdateListener,
			update: update,
			setFilter: setFilter,
			getFilters: getFilters,
			removeFilter: removeFilter,
			setHighlight: setHighlight,
			getHighlight: getHighlight,
			watchHighlight: watchHighlight,
			unwatchHighlight: unwatchHighlight,
			removeHighlight: removeHighlight,
			onReset: registerResetCallback,
			reset: reset,
			onSearch: registerSearchCallback,
			search: search,
			registerStateFunctions: registerStateFunctions,
			getStateFunctions: getStateFunctions,
			preUpdate: registerPreUpdateFunction,
			postUpdate: registerPostUpdateFunction
		};
	}]);