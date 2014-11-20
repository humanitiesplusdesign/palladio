angular.module('palladio.directives.dimension', ['palladio'])
	.directive('palladioDimension', ['palladioService', function(ps) {
		return {
			scope: {
				model: '=',
				checkFunc: '='
			},
			template:   '<span palladio-draggable model="model" class="dimension-pill" data-ng-class="{\'dimension-pill-checked\': check(model)}">' +
							'<i data-ng-show="!sortableOptions.disabled" class="icon-move"></i>' +
							'<label class="checkbox">' +
								'<input type="checkbox" ng-checked="check(model)"> {{model.description}}' +
							'</label>' +
						'</span>',
			link: function postLink(scope) {
				if(scope.checkFunc) {
					scope.check = scope.checkFunc;
				} else {
					scope.check = function () { return false; };
				}
			}
		};
	}])
	.directive('palladioDraggable', function () {
		return {
			scope: {
				model: '='
			},
			link: function postLink(scope, elements) {
				$(elements[0]).draggable({
					revert: true,
					revertDuration: 0,
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
	.directive('palladioDroppable', function () {
		return {
			scope: {
				model: '='
			},
			link: function postLink(scope, elements, attrs) {
				var jq = $(elements[0]);
				var an = angular.element(elements[0]);

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
						scope.$apply(function(scope) {
							// Copy because many components will attach dimensions and groups to the
							// field model.
							scope.model = angular.copy(angular.element(event.toElement).scope().model);
						});
						an.removeClass('over-drop');
						ui.draggable.removeClass('over-drop');
					},
					activate: function (event, ui) {
						// If we want to highlight the drop target on drag, do it here.
						an.addClass('active-drag');
					},
					deactivate: function (event, ui) {
						// If we want to highlight the drop target on drag, do it here.
						an.removeClass('active-drag');
					}
				});
			}
		};
	});