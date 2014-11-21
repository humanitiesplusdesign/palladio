// Palladio framework

// See demo.html in palladio-timeline-filter repository or
// https://github.com/humanitiesplusdesign/palladio/wiki/Framework-definition
// for usage examples.

angular.module('palladio', [])
	.constant('version', '0.7.0')
	.factory('palladioService', [function() {

		var updateListeners = d3.map();

		var registerUpdateListener = function (id, listener) {
			updateListeners.set(id, listener);
			return deregisterUpdateListener.bind(this, id);
		};

		var deregisterUpdateListener = function (id) {
			updateListeners.remove(id);
		};

		var update = function () {
			updateListeners.values().forEach(function (u) {
				u();
			});
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
				return deregisterStateFunctions.bind(id);
			}
		};

		var deregisterStateFunctions = function (id) {
			stateFunctions.remove(id);
		};

		var getStateFunctions = function () {
			return stateFunctions.values();
		};

		return {
			onUpdate: registerUpdateListener,
			update: update,
			setFilter: setFilter,
			getFilters: getFilters,
			removeFilter: removeFilter,
			onReset: registerResetCallback,
			reset: reset,
			onSearch: registerSearchCallback,
			search: search,
			registerStateFunctions: registerStateFunctions,
			getStateFunctions: getStateFunctions
		};
	}]);