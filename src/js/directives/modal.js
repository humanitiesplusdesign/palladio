angular.module('palladio.directives.modal', [])

	.directive('modal', function () {
		return {
			replace : true,
			scope : {
				dimensions: '=',
				model: '=',
				toggleKey: '=',
				sortable: '@',
				descriptionAccessor: '='
			},
			template: '<div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +

				'<div class="modal-dialog">' +
					'<div class="modal-content">' +

	  				'<div class="modal-header">' +
				    	'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>' +
				    	'<h4 style="line-height: normal">Choose the dimension(s)</h4>' +
				  	'</div>' +

				  	'<div class="modal-body">' +
				    	'<ul ui-sortable="sortableOptions" class="list-unstyled" data-ng-model="internalDimensions">' +
				    		'<li ng-repeat="field in internalDimensions" class="pill" data-ng-class="{checked: check(field)}"  ng-click="change(field)">' +
				    			'<i data-ng-show="!sortableOptions.disabled" class="icon-move"></i>' +
				    			'<label class="checkbox">' +
			    					'<input type="checkbox" ng-checked="check(field)" ng-click="change(field)"> {{getDescription(field)}}' +
						    	'</label>' +
				    		'</li>' +
				    	'</ul>' +
				  	'</div>' +
				  	'<div class="modal-footer">' +
				    	'<button class="btn btn-default" data-dismiss="modal" aria-hidden="true">Close</button>' +
				  	'</div>' +

						'</div>' +
				'</div>' +

			'</div>',

			link: function postLink(scope, elements, attrs) {

				scope.internalDimensions = scope.dimensions.map(copyDimension);

				scope.change = function(field) {
					if(Array.isArray(scope.model)) {
						if(scope.check(field)) {
							// Field is already in the model (uncheck).
							scope.model = scope.model.filter( function (d) { return field.key !== d.key; });
						} else {
							scope.model = scope.model.concat(field);
						}
						reorderModel();
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
					// Rebuild the internalDimensions (copied dimensions) by re-ordering, inserting,
					// or deleting as appropriate. For now we can be naive about it. TODO.
					scope.internalDimensions = scope.dimensions.map(copyDimension);
				});

				scope.$watchCollection('internalDimensions', function () {
					// Reorder the model if the order of dimensions changes and model is an array
					reorderModel();
				});

				scope.$watch('toggleKey', function (nv) {
					if(nv) {
						scope.change(scope.internalDimensions.filter(function (d) { return nv === d.key; })[0]);
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

				function reorderModel() {
					// Only reorder if we are in array and sorting mode
					if(Array.isArray(scope.model) && scope.sortable === 'true') {
						scope.model = scope.internalDimensions.filter(function(d) {
							// Does it exist in the model?
							return scope.model.filter( function (m) { return d.key === m.key; }).length;
						});
					}
				}

				function copyDimension(dimension) {
					if(dimension.field) {
						// Agg dim
						return dimension;
					} else {
						return {
							blanks: dimension.blanks,
							cardinality: dimension.cardinality,
							confirmed: dimension.confirmed,
							countBy: dimension.countBy,
							countDescription: dimension.countDescription,
							countable: dimension.countable,
							delete: dimension.delete,
							description: dimension.description,
							descriptiveField: dimension.descriptiveField,
							errors: dimension.errors.slice(0),
							hierDelimiter: dimension.hierDelimiter,
							ignore: dimension.ignore,
							key: dimension.key,
							mvDelimiter: dimension.mvDelimiter,
							originFileId: dimension.originFileId,
							special: dimension.special.slice(0),
							type: dimension.type,
							typeField: dimension.typeField,
							unassignedSpecialChars: dimension.unassignedSpecialChars? dimension.unassignedSpecialChars.slice(0) : undefined,
							uniqueKey: dimension.uniqueKey,
							uniques: dimension.uniques.slice(0),
						};
					}
				}

				scope.sortableOptions = {
					disabled: scope.sortable === 'true' ? false : true
				};
			}
		};
	});
