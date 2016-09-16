angular.module('palladio.directives.droppable', [])

	.directive('droppable', function () {
		return {
			scope: false,
			link: function postLink(scope, elements, attrs) {
				var jq = $(elements[0]);
				var an = angular.element(elements[0]);

				if(an.scope().field.uniqueKey === true) {
					jq.droppable({
						over: function (event, ui) {
							// If we want to highlight the drop target, do it here.
							an.addClass('over-drop');
							ui.draggable.addClass('over-drop');
						},
						out: function (event, ui) {
							// If we want to highlight the drop target, do it here.
							an.removeClass('over-drop');
							ui.draggable.removeClass('over-drop');
						},
						drop: function (event, ui) {
							if(attrs.droppableCallback) {
								scope[attrs.droppableCallback](event, ui);
							}
							an.removeClass('over-drop');
							ui.draggable.removeClass('over-drop');
						}
					});
				} else {
					jq.addClass("blur-on-drag");
				}
			}
		};
	});