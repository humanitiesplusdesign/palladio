angular.module('palladio.components', ['palladio.services.data', 'palladio.services.load'])
	.factory('componentService', ['$compile', "$rootScope", "$http", "loadService", "dataService",
		function($compile, $scope, $http, loadService, dataService) {

		var components = {};

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

		var loadData = function(url, successFunction, errorFunction) {
			if(!errorFunction) { errorFunction = function () {}; }
			$http.get(url)
				.success(function(data) {
					loadService.loadJson(data).then(function() {
						successFunction(data);
					});
				})
				.error(errorFunction);
		};
    
    var loadJson = function(json) {
      return loadService.loadJson(json);
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