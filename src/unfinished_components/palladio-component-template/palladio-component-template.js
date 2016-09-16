// Palladio template component module

angular.module('palladioComponentTemplate', []) // Rename this.
	.directive('palladioComponentTemplate', function () { // Rename this.
		var directiveObj = {
			scope: true,
			template: '<div class="row-fluid"></div>', // Change this string to update the
			// template. Don't use a templateUrl, as you won't have control over the relative
			// URL where this template is deployed.

			link: { pre: function(scope, element, attrs) {

					// In the pre-linking function we can use scope.data, scope.metadata, and
					// scope.xfilter to populate any additional scope values required by the
					// template.

					// The parent scope must include the following:
					//   scope.xfilter
					//   scope.metadata


					// If you need to do any configuration before your visualization is set up,
					// do it here. DO NOT do anything that changes the DOM here, so don't
					// programatically instantiate your visualization at this point. That happens
					// in the 'post' function.
					//
					// You might need to do things here especially
					// if your visualization is contained in another directive that is included
					// in the template of this directive.

				}, post: function(scope, element, attrs) {

					// If you are building a d3.js visualization, you can grab the containing
					// element with:
					//
					// d3.select(element[0]);
					//
					//
					// If you are going to programatically instantiate your visualization, do it
					// here. Your visualization should emit the following events if necessary:
					//
					// For new/changed filters:
					//
					// scope.$emit('updateFilter', [identifier, description, filter, callback]);
					//
					// For removing all filters:
					//
					// scope.$emit('updateFilter', [identifier, null]);
					//
					// If you apply a filter in this component, notify the Palladio framework.
					//
					// identifier: A string unique to this instance of this component. Should 
					//             be randomly generated.
					//
					// description: A human-readable description of this component. Should be
					//              unique to this instance of this component, but not required.
					//
					// filter: A human-readable description of the filter that is currently
					//         applied on this component.
					//
					// callback: A function that will remove all filters on this component when
					//           it is evaluated.
					//
					//
					// Whenever the component needs to trigger an update for all other components
					// in the application (for example, when a filter is applied or removed):
					//
					// scope.$emit('triggerUpdate');

					function setup() {

					}

					function update() {
						// Make this **snappy**
					}

					function reset() {

					}

					setup();
					update();

					// You should also handle the following externally triggered events:

					scope.$on('filterReset', function(event) {
						
						// Reset any filters that have been applied through this visualization.
						// This means running .filterAll() on any Crossfilter dimensions you have
						// created and updating your visualization as required.

						update();

					});

					scope.$on('update', function(event) {
						
						// Render an update. It is likely that the data in the Crossfilter or the
						// filter state of the Crossfilter has changed, so you should re-query
						// any groups or dimensions you have created.

						// Note: This method gets called a *lot* during a filter operation.
						// Whenever possible you should make updates incremental and very fast.

						update();

					});

					scope.$on('search', function(event, args) {
						
						// The global search term has been updated. The current search term is
						// found in args.

					});

					scope.$on('$destroy', function () {

						// Clean up after yourself. Remove dimensions that we have created. If we
						// created watches on another scope, destroy those as well.

					});


					// Support save/load. These functions should be able to fully recreate an instance
					// of this visualization based on the results of the exportState() function. Include
					// current filters, any type of manipulations the user has done, etc.

					function importState(state) {
						
						// Load a state object created by exportState().

					}

					function exportState() {

						// Return a state object that can be consumed by importState().
						return { };
					}

					scope.$emit('registerStateFunctions', ['visualizationName', exportState, importState]);

					// Move the modal out of the fixed area. (necessary if you are using modal selectors)
					// $(element[0]).find('#date-start-modal').parent().appendTo('body');
				}
			}
		};

		return directiveObj;
	});