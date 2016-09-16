angular.module('palladio.directives.draggable', [])

	.directive('draggable', function () {
		return {
			scope: false,
			link: function postLink(scope, elements, attrs) {
				$(elements[0]).draggable({
					revert: true,
					start: function (event, ui) {
						$('.blur-on-drag').addClass('blur');
					},
					stop: function (event, ui) {
						$('.blur-on-drag').removeClass('blur');
					},
					zIndex: 1000
				});
			}
		};
	})