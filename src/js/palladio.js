// Palladio framework

// See demo.html in palladio-timeline-filter repository or
// https://github.com/humanitiesplusdesign/palladio/wiki/Framework-definition
// for usage examples.

angular.module('palladio', [])
	.constant('version', '0.5.0')
	.controller('PalladioCtrl', function ($scope) {
		$scope.filters = d3.map();

		// Listen for an update trigger and propogate the update to all sub-scopes.
		$scope.$on('triggerUpdate', function(event) {
			event.stopPropagation();
			$scope.$broadcast('update');
		});

		// Listen for changes to filters in sub-scopes and update the application scope.
		// Event takes 3 arguments:
		//
		//   1. A unique key. If this key changes within a directive, the directive *must*
		//			send an 'updateFilter' event with the old key and a null 2nd argument. It
		//			can then optionally send a new 'updateFilter' event with the new key.
		//   2. The text to display for the current filters on the dimension (string).
		//   3. A function that will clear the current filters on the dimension and do any
		//			other cleanup required by the directive.
		$scope.$on('updateFilter', function(event, args) {
			$scope.filters.set(args[0], [args[1], args[2], args[3]]);

			if(!args[1]) {
				$scope.filters.remove(args[0]);
			}
		});

		// Listen for triggerFilterReset, then notify sub-directives:
		$scope.$on('triggerFilterReset', function(event) {
			$scope.filters = d3.map();
			$scope.$broadcast('filterReset');
			$scope.$broadcast('update');
		});

		$scope.filterReset = function() {
			$scope.$broadcast('filterReset');
			$scope.$broadcast('update');
		};

		// Handle global search.
		$scope.searchText = '';

		$scope.$watch('searchText', function (nv, ov) {
			$scope.$broadcast('search', $scope.searchText);
		});

		// Saving visualization state.
		$scope.stateFunctions = [];
		$scope.$on('registerStateFunctions', function(event, args) {
			$scope.stateFunctions.push({ type: args[0], export: args[1], import: args[2] });
		});
	});