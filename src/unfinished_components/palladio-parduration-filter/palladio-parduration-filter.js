// Palladio template component module

angular.module('palladioPardurationFilter', ['palladio.services.date'])
	.directive('palladioPardurationFilter', function (dateService) {
		var directiveObj = {
			scope: true,
			templateUrl: 'partials/palladio-parduration-filter/template.html',

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

					scope.uniqueToggleId = "pardurationFilter" + Math.floor(Math.random() * 10000);
					scope.uniqueToggleHref = "#" + scope.uniqueToggleId;
					scope.uniqueModalId = scope.uniqueToggleId + "modal";
					
					// Take the first number dimension we find.
					scope.dateDims = scope.metadata.filter(function (d) { return d.type === 'date'; });
					scope.dateStartDim = scope.dateDims[0];
					scope.dateEndDim = scope.dateDims[1];

					scope.title = "Parallel Duration Filter";

					scope.showDateStartModal = function () {
						$('#' + scope.uniqueModalId).find('#date-start-modal').modal('show');
					};

					scope.showDateEndModal = function () {
						$('#' + scope.uniqueModalId).find('#date-end-modal').modal('show');
					};

				}, post: function(scope, element, attrs) {

					// If you are building a d3.js visualization, you can grab the containing
					// element with:
					//
					// d3.select(element[0]);

					var sel, svg, dim, group, x, y, duration, xAxis, yAxis, area, xAxisTop;

					var format = dateService.format;

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

						dim = scope.xfilter.dimension(
							function(d) {
								return [ format.reformatExternal(d[scope.dateStartDim.key]),
										format.reformatExternal(d[scope.dateEndDim.key]) ]; });

						// For now we keep the grouping simple and just do a naive count. To enable
						// 'countBy' functionality we need to use the Crossfilter helpers.
						group = dim.group();

						var startValues = dim.top(Infinity).map(function (d) { return format.reformatExternal(d[scope.dateStartDim.key]); })
								.filter(function (d) { return d !== ""; });
						var endValues = dim.top(Infinity).map(function (d) { return format.reformatExternal(d[scope.dateEndDim.key]); })
								.filter(function (d) { return d !== ""; });
						var maxDuration = d3.max(dim.top(Infinity).map(function (d) {
							if(d[scope.dateEndDim.key] && d[scope.dateStartDim.key]) {
								return format.parse(format.reformatExternal(d[scope.dateEndDim.key])) -
									format.parse(format.reformatExternal(d[scope.dateStartDim.key]));
							}
						}));

						// Scales
						x = d3.time.scale().range([0, width])
								.domain([ format.parse(d3.min(startValues)), format.parse(d3.max(endValues)) ]);
						y = d3.scale.linear().range([height, 0])
								.domain([0, 1]);
						duration = d3.scale.linear().range([height, 0])
								.domain([0, maxDuration]);

						xAxis = d3.svg.axis().orient("bottom")
								.scale(x);

						xAxisTop = d3.svg.axis().orient("top")
								.scale(x);

						yAxis = d3.svg.axis().orient("left")
								.scale(duration)
								.tickFormat(function (d) { return Math.round(d/31536000000); });

						var topBrush = d3.svg.brush().x(x);
						var bottomBrush = d3.svg.brush().x(x);

						// Build the visualization.

						var g = svg.append('g')
							.attr("transform", "translate(" + margin + "," + margin + ")");

						var bottom = g.append('g')
							.attr("class", "axis x-axis")
							.attr("transform", "translate(" + 0 + "," + (height) + ")")
							.call(xAxis)
							.call(bottomBrush);
						
						// bottom.select('.background').attr('height', 25);
						// bottom.select('.extent').attr('height', 25);

						var top = g.append('g')
							.attr("class", "axis x-axis")
							.call(xAxisTop)
							.call(topBrush);
						
						// top.select('.background').attr('height', 25);
						// top.select('.extent').attr('height', 25);

						var left = g.append('g')
							.attr("class", "axis y-axis")
							.call(yAxis);
					}

					function update() {
						var paths = svg.select('g').selectAll('.path')
							.data(group.top(Infinity)
									.filter(function (d) {
										return d.key[0] !== "" && d.key[1] !== "" && d.value !== 0;
									}),
								function (d) { return d.key[0] + " - " + d.key[1]; });

						paths.enter()
								.append('line')
									.attr('class', 'path')
									.attr('stroke-width', 1)
									.attr('stroke-opacity', 0.7)
									.attr('stroke', "black");

						paths.exit().remove();

						paths
							.attr('x1', function (d) { return x(format.parse(d.key[0])); })
							.attr('y1', duration(0))
							.attr('x2', function (d) { return x(format.parse(d.key[1])); })
							.attr('y2', function (d) { return duration(format.parse(d.key[1]) - format.parse(d.key[0])); });
					}

					function reset() {
						group.remove();
						dim.remove();
						svg.remove();
					}

					scope.$watchGroup(['dateStartDim', 'dateEndDim'], function () {
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

					// Move the modal out of the fixed area.
					$(element[0]).find('#date-start-modal').parent().appendTo('body');
				}
			}
		};

		return directiveObj;
	});