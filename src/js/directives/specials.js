angular.module('palladio.directives.specials', [])

	.directive('specials', function () {
		return {
			restrict: 'A',
			scope: false,
			template: '<a data-ng-repeat="char in selectedFieldMetadata.unassignedSpecialChars" class="tag"' +
						'data-ng-class="{ \'error-glow\': (selectedFieldMetadata.verifiedSpecialChars.indexOf(char) === -1) }"' +
						'data-tooltip="Click to search this value"' +
						'data-ng-click="verifyAndFilterUniquesOnChar(char, $event)">' +
						'{{char}}' +
					'</a>',
			link: function (scope, element, attrs) {

				scope.$watch("selectedFieldMetadata.unassignedSpecialChars", function(val){
					$('.tag').tooltip();
				});

				scope.verifyAndFilterUniquesOnChar = function (str, event) {
					// First add to verified list.
					if(scope.selectedFieldMetadata.verifiedSpecialChars.indexOf(str) === -1) {
						scope.selectedFieldMetadata.verifiedSpecialChars.push(str);
					}

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
