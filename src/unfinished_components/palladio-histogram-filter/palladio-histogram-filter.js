// Palladio template component module

angular.module('palladioHistogramFilter', [])
	.directive('palladioHistogramFilter', function () {
		var directiveObj = {
			scope: true,
			templateUrl: 'partials/palladio-histogram-filter/template.html',

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

					scope.uniqueToggleId = "histogramFilter" + Math.floor(Math.random() * 10000);
					scope.uniqueToggleHref = "#" + scope.uniqueToggleId;
					scope.uniqueModalId = scope.uniqueToggleId + "modal";
					
					// Take the first number dimension we find.
					scope.numDims = scope.metadata.filter(function (d) { return d.type === 'number'; });
					scope.numDim = scope.numDims[0];

					scope.title = "Histogram Filter";

					scope.showNumberModal = function () { $('#' + scope.uniqueModalId).find('#num-modal').modal('show'); };

				}, post: function(scope, element, attrs) {

					// If you are building a d3.js visualization, you can grab the containing
					// element with:
					//
					// d3.select(element[0]);

					var sel, svg, dim, group, x, y, xAxis, yAxis, area;

					// Constants...
					var width = 800;
					var height = 150;
					var margin = 25;

					setup();
					update();

					function setup() {
						sel = d3.select(d3.select(element[0]).select(".main-viz")[0][0].children[0]);
						svg = sel.append('svg');

						sel.attr('width', width + margin*2);
						sel.attr('height', height + margin*2);

						svg.attr('width', width + margin*2);
						svg.attr('height', height + margin*2);

						dim = scope.xfilter.dimension(function(d) { return +d[scope.numDim.key]; });

						// For now we keep the grouping simple and just do a naive count. To enable
						// 'countBy' functionality we need to use the Crossfilter helpers.
						group = dim.group();

						// Scales
						x = d3.scale.linear().range([0, width])
								.domain([+dim.bottom(1)[0][scope.numDim.key], +dim.top(1)[0][scope.numDim.key]]);
						y = d3.scale.linear().range([height, 0])
								.domain([0, group.top(1)[0].value]);

						xAxis = d3.svg.axis().orient("bottom")
								.scale(x);

						yAxis = d3.svg.axis().orient("right")
								.scale(y)
								.ticks(5);

						area = d3.svg.area()
								.x(function (d) { return x(d.key); })
								.y0(function (d) { return height; })
								.y1(function (d) { return y(d.value); });

						// Build the visualization.

						var g = svg.append('g')
								.attr("transform", "translate(" + margin + "," + margin + ")");

						g.append('g')
							.attr("class", "axis x-axis")
							.attr("transform", "translate(" + 0 + "," + (height) + ")")
							.call(xAxis);

						g.append('g')
							.attr("class", "axis y-axis")
							.attr("transform", "translate(" + width + ", " + 0 + ")")
							.call(yAxis);

						var histogram = g.append('g')
								.attr("class", "histogram")
								// Sort by the x-axis value - required for the area layout
								.datum(group.top(Infinity).sort(function(a,b) { return a.key < b.key ? 1 : -1; }));

						histogram.append('path')
								.attr('d', function (d) { return area(d); })
								.attr('transform', "translate(-0.5, -0.5)");
					}

					function update() {
						svg.select('g').select('.histogram').select('path')
								.attr('d', function (d) { return area(d); });
					}

					function reset() {
						group.remove();
						dim.remove();
						svg.remove();
					}

					scope.$watch('numDim', function () {
						reset();
						setup();
						update();
					});

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

						group.remove();
						dim.remove();

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
				}
			}
		};

		return directiveObj;
	});