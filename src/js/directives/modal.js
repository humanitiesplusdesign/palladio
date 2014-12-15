angular.module('palladio.directives.modal', [])

	.directive('modal', function () {
		return {
			replace : true,
			scope : {
				dimensions: '=',
				model: '=',
				sortable: '@',
				descriptionAccessor: '='
			},
			template: '<div class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
  				'<div class="modal-header">' +
			    	'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>' +
			    	'<h4 style="line-height: normal">Choose the dimensions</h4>' +
			  	'</div>' +
			  	'<div class="modal-body">' +
			    	'<ul ui-sortable="sortableOptions" class="unstyled" data-ng-model="dimensions">' +
			    		'<li ng-repeat="field in dimensions" class="pill" data-ng-class="{checked: check(field)}">' +
			    			'<i data-ng-show="!sortableOptions.disabled" class="icon-move"></i>' +
			    			'<label class="checkbox">' +
		    					'<input type="checkbox" ng-checked="check(field)" ng-click="change(field)"> {{getDescription(field)}}' +
					    	'</label>' +
			    		'</li>' +
			    	'</ul>' +
			  	'</div>' +
			  	'<div class="modal-footer">' +
			    	'<button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>' +
			  	'</div>' +
			'</div>',

			link: function postLink(scope, elements, attrs) {
				
				scope.change = function(field) {
					if(Array.isArray(scope.model)) {
						if(scope.check(field)) {
							// Field is already in the model (uncheck).
							scope.model = scope.model.filter( function (d) { return field.key !== d.key; });
						} else {
							scope.model = scope.model.concat(field);
						}
					} else {
						if(scope.check(field)) {
							// Field is already checked (uncheck).
							scope.model = null;
						} else {
							scope.model = field;
						}
					}
				};

				scope.$watchCollection('dimensions', function() {
					// Reorder the model if the order of dimensions changes and model is an array
					if(Array.isArray(scope.model)) {
						scope.model = scope.dimensions.filter(function(d) {
							// Does it exist in the model?
							return scope.model.filter( function (m) { return d.key === m.key; }).length;
						});
					}
				});

				scope.check = function(field) {
					if(Array.isArray(scope.model)) {
						// Model is an array of fields.
						return scope.model.filter( function (d) { return field.key === d.key; }).length > 0;
					} else {
						// Model is an individual field.
						if(scope.model) {
							return field.key === scope.model.key;
						} else {
							return false;
						}
					}
				};

				scope.getDescription = function (d) {
					if(scope.descriptionAccessor) {
						return scope.descriptionAccessor(d);
					} else {
						return d.description;
					}
				};

				scope.sortableOptions = {
					disabled: scope.sortable === 'true' ? false : true
				};
			}
		};
	});