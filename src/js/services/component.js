global.CodeMirror = require("codemirror/lib/codemirror");
require("@uirouter/angularjs");
require("angular-bootstrap-colorpicker");
require("angular-ui-codemirror");
require("angular-ui-bootstrap");
require("angular-ui-sortable");
require("ui-select");


angular.module('palladio.components', ['palladio.services.data', 'palladio.services.load', 'palladio'])
	.factory('componentService', ['$compile', "$rootScope", "$http", "loadService", "dataService", 'palladioService',
		function($compile, $scope, $http, loadService, dataService, palladioService) {

		var components = {};
		var postLoadFunctions = []

		var add = function(componentName, selector, options, parentScope) {
			if(options === undefined) options = {};
			if(parentScope === undefined || parentScope === null) parentScope = $scope;

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

    var promiseAdd = function(componentName, selector, options, parentScope) {
      var obj = add(componentName, selector, options, parentScope);
      var p = new Promise(function(resolve, reject) {
        window.setTimeout(function() {
          resolve(obj.getOptions());
        })
      });
      return p;
    }

		var register = function(componentName, compileStringFunction) {
			// compileStringFunction has signature (options, newScope)
			// Can modify newScope
			components[componentName] = compileStringFunction;
		};

		var registerPostDataLoadSetup = function (postLoadFunction) {
			postLoadFunctions.push(postLoadFunction)
		}

		var loadData = function(url, successFunction, errorFunction, progressCallback) {
			if(!errorFunction) { errorFunction = function() {}; }
			if(progressCallback) {
				// Register callbacks on palladioService
				palladioService.on('file_downloaded', function() {
					progressCallback(0.3);
				});
				palladioService.on('file_loaded', function() {
					progressCallback(0.6);
				});
				// Until we make the data processing properly async, the percentage here is
				// useless because the browser won't update the DOM.
				palladioService.on('file_processing_progress', function(percent) {
					// We give 40% (100-60) of time to processing
					progressCallback(0.6+(percent/(1/(1-0.6))));
				});
				palladioService.on('file_processed', function() {
					progressCallback(1);
				})
			}
			$http.get(url)
				.success(function(data) {
					// Read this function backwards due to async calls without Promises.

					var next = function() {
						loadService.loadJson(data).then(function() {
							var process = function () {
								dataService.getData().then(function(data) {

									// File is processed, so future dataService.getData and
									// dataService.getDataSync calls will be cached.
									postLoadFunctions.forEach(function (plf) { plf(data) })
									setTimeout(successFunction, 200)
								});
							}

							// File is loaded into dataService. Kick off processing.
							palladioService.event('file_loaded');
							setTimeout(process, 200);
						});
					}

					// File has downloaded. Kick off loading the file into the dataService
					palladioService.event('file_downloaded');
					setTimeout(next, 200);
				})
				.error(errorFunction);
		};

    var loadJson = function(json, progressCallback) {
      return loadService.loadJson(json, progressCallback);
    }

		var dimensions = function () {
			return dataService.getDataSync().metadata;
		};

    var dimensionFromKey = function(key) {
      return dimensions().filter(function(d) { return d.key === key; })[0];
    };

    var dimensionsFromKeys = function(keys) {
      return keys.map(function(k) {
        return dimensionFromKey(k);
      });
    };

		return {
			loadData: loadData,
      loadJson: loadJson,
			dimensions: dimensions,
      dimensionFromKey: dimensionFromKey,
      dimensionsFromKeys: dimensionsFromKeys,
			register: register,
			registerPostDataLoadSetup: registerPostDataLoadSetup,
			add: add,
      promiseAdd: promiseAdd
		};
	}]);

var startPalladio = function(additionalModules) {
	if(!Array.isArray(additionalModules)) { additionalModules = []; }
	var modules = [
		'palladio',
		'palladio.components',
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

		// Views
		'palladioSelectionView'
	].concat(additionalModules);

	var appId = "palladioApp" + Math.floor(Math.random() * 10000);

	angular.module(appId, modules);

	var app = angular.bootstrap(document.createElement("div"), [appId]);

	return app.get('componentService');
};
