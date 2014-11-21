// Palladio template component module

angular.module('palladioTimespanFilter', ['palladio.date'])
	.directive('palladioTimespanFilter', function (dateService) {
		var directiveObj = {
			scope: true,
			templateUrl: 'partials/palladio-timespan-filter/template.html',

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

					scope.uniqueToggleId = "timespanFilter" + Math.floor(Math.random() * 10000);
					scope.uniqueToggleHref = "#" + scope.uniqueToggleId;
					scope.uniqueModalId = scope.uniqueToggleId + "modal";
					
					// Take the first number dimension we find.
					scope.dateDims = scope.metadata.filter(function (d) { return d.type === 'date'; });
					scope.dateStartDim = scope.dateDims[0];
					scope.dateEndDim = scope.dateDims[1];

					scope.title = "Timespan Filter";

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

					var sel, svg, dim, group, x, y, xAxis, yAxis, area;

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

						var laneData = buildLanes();

						var startValues = dim.top(Infinity).map(function (d) { return format.reformatExternal(d[scope.dateStartDim.key]); })
								.filter(function (d) { return d !== ""; });
						var endValues = dim.top(Infinity).map(function (d) { return format.reformatExternal(d[scope.dateEndDim.key]); })
								.filter(function (d) { return d !== ""; });

						// Scales
						x = d3.time.scale().range([0, width])
								.domain([ format.parse(d3.min(startValues)), format.parse(d3.max(endValues)) ]);
						y = d3.scale.linear().range([height, 0])
								.domain([0, laneData.length]);

						xAxis = d3.svg.axis().orient("bottom")
								.scale(x);

						// Build the visualization.

						var g = svg.append('g')
								.attr("transform", "translate(" + margin + "," + margin + ")");

						g.append('g')
							.attr("class", "axis x-axis")
							.attr("transform", "translate(" + 0 + "," + (height) + ")")
							.call(xAxis);

						var lanes = g.selectAll('.lane')
							.data(laneData);

						lanes.enter()
								.append('g')
									.attr('class', 'lane')
									.attr('transform', function(d, i) { return "translate(0," + y(i + 1) + ")"; });

						var spans = lanes.selectAll('.span')
							.data(function (d) { return d; });

						spans.enter()
								.append('rect')
									.attr('height', (y(0) - y(1)) * 0.25 )
									.attr('fill', "#666666")
									.attr('width', function (d) { return x(format.parse(d.key[1])) - x(format.parse(d.key[0])); })
									.attr('transform', function(d) { return "translate(" + x(format.parse(d.key[0])) + ",0)"; });

					}

					function update() {
						
					}

					function reset() {
						group.remove();
						dim.remove();
						svg.remove();
					}

					function buildLanes() {
						var sortUp = [];
						var sortDown = [];
						var lanes = [];

						group.top(Infinity)
							.filter(function (d) { return d.key[0] !== "" && d.key[1] !== ""; })
							.forEach(function (d) {
								d.placed = false;
								sortUp.push(d);
								sortDown.push(d);
							});

						sortUp.sort(function (a, b) { return a.key[0] < b.key[0] ? -1 : 1; });
						sortDown.sort(function (a, b) { return a.key[1] > b.key[1] ? -1 : 1; });

						var top = sortUp.length - 1;
						var i = 0; // Index of sortUp
						var j = 0; // Index of sortDown
						var k = 0; // Index of lane
						var l = 0; // Index in lane
						var current = null;

						while ((i + j) <= (top * 2)) {
							current = null;

							// We kind of ratchet in from either end.
							if(i <= j) {
								// Take from sortUp (build beginning of timeline)
								current = sortUp[i]; // TODO: handle if the element is already placed
								i++;
							} else {
								// Take from the sortDown (build end of timeline)
								current = sortDown[j]; // TODO: handle if the element is already placed
								j++;
							}

							k = 0;
							while (!current.placed) {
								if(lanes[k]) {
									l = 0;
									while(l < lanes[k].length && !current.placed) {
										if( // Existing span is clear to the right of the current one
											(lanes[k][l].key[1] < current.key[0] &&
											(!lanes[k][l + 1] || lanes[k][l + 1].key[0] > current.key[1]))) {

											lanes[k].splice(l + 1, 0, current);
											current.placed = true;
										} else {
											if( // In existing span is clear to the left of the current one
												(lanes[k][l].key[0] > current.key[1]) &&
												(!lanes[k][l - 1] || lanes[k][l - 1].key[1] < current.key[0])) {

												lanes[k].splice(l, 0, current);
												current.placed = true;
											}
										}

										l++;
									}
									k++;
								} else {
									// This lane doesn't yet exist, so create a new lane and add this element.
									lanes[k] = [current];
									current.placed = true;
								}
							}
						}

						return lanes;
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