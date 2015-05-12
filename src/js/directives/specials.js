angular.module('palladio.directives.specials', [])

	.directive('specials', function () {
		return {
			restrict: 'A',
			scope: false,
			template: '<a data-ng-repeat="char in selectedFieldMetadata.unassignedSpecialChars" class="tag"' +
						'data-tooltip="Click to search this value"' +
						'data-ng-click="filterUniquesOnChar(char, $event)">' +
						'{{char}}' +
					'</a>',
			link: function (scope, element, attrs) {

				scope.$watch("selectedFieldMetadata.unassignedSpecialChars", function(val){
					$('.tag').tooltip();
				})

				scope.filterUniquesOnChar = function (str, event) {
					var tag = angular.element(event.target);
					var tags = angular.element(element[0]).children('.tag');

					// Make sure no tags are selected.
					tags.removeClass('tag-selected');

					if(scope.selectedSpecialChar === str) {
						// Unfilter
						scope.selectedSpecialChar = null;
					} else {
						// Filter
						scope.selectedSpecialChar = str;

						// Make the current tag selected.
						tag.addClass('tag-selected');
					}

					scope.updateUniques();
				};
			}
		};
	});
