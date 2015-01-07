// Palladio template component module

angular.module('palladioDurationView', ['palladio', 'palladio.services'])
	.directive('palladioDurationView', function (dateService, palladioService, dataService) {
		var directiveObj = {
			scope: {
				fullHeight: '@',
				fullWidth: '@',
				showControls: '@',
				showAccordion: '@',
				view: '@'
			},
			templateUrl: 'partials/palladio-duration-view/template.html',

			link: { pre: function(scope) {

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

					scope.uniqueToggleId = "durationView" + Math.floor(Math.random() * 10000);
					scope.uniqueToggleHref = "#" + scope.uniqueToggleId;
					scope.uniqueModalId = scope.uniqueToggleId + "modal";

					scope.metadata = dataService.getDataSync().metadata;
					scope.xfilter = dataService.getDataSync().xfilter;

					// Take the first number dimension we find.
					scope.durationDims = scope.metadata.filter(function (d) { return d.type === 'number'; });
					scope.durationDim = scope.durationDims[0];

					// Label dimensions.
					scope.labelDims = scope.metadata;
					scope.tooltipLabelDim = scope.labelDims[0];
					scope.groupDim = scope.labelDims[0];

					scope.title = "Duration view";

					scope.modes = ['Actual duration'];
					scope.mode = scope.modes[0];

					scope.showDurationModal = function () {
						$('#' + scope.uniqueModalId).find('#duration-modal').modal('show');
					};

					scope.showTooltipLabelModal = function () {
						$('#' + scope.uniqueModalId).find('#tooltip-label-modal').modal('show');
					};

					scope.showGroupModal = function () {
						$('#' + scope.uniqueModalId).find('#group-modal').modal('show');
					};

				}, post: function(scope, element) {

					// If you are building a d3.js visualization, you can grab the containing
					// element with:
					//
					// d3.select(element[0]);

					var sel, svg, dim, group, x, y, xStart, xEnd, emitFilterText, removeFilterText,
						topBrush, midBrush, bottomBrush, top, bottom, middle, filter, yStep, tooltip;

					var format = dateService.format;

					// Constants...
					var margin = 25;
					var leftMargin = 150;
					var width = scope.fullWidth === 'true' ? $(window).width() - margin*2 : $(window).width()*0.7;
					var height = scope.height ? +scope.height : 200;
					height = scope.fullHeight === 'true' ? $(window).height()-200 : height;
					var filterColor = '#9DBCE4';

					setup();
					update();

					function setup() {
						sel = d3.select(d3.select(element[0]).select(".main-viz")[0][0].children[0]);
						if(!sel.select('svg').empty()) sel.select('svg').remove();
						svg = sel.append('svg');

						sel.attr('width', width + margin*2);
						sel.attr('height', height + margin*2);

						svg.attr('width', width + margin*2);
						svg.attr('height', height + margin*2);

						if(dim) dim.remove();

						dim = scope.xfilter.dimension(function(d) { return "" + d[scope.groupDim.key]; });

						// For now we keep the grouping simple and just do a naive count. To enable
						// 'countBy' functionality we need to use the Crossfilter helpers or Reductio.
						group = dim.group();

						// Scales
						x = d3.scale.linear().range([0, width - leftMargin])
								.domain([ 0, d3.max(group.top(Infinity), function (d) { return d.value; }) ]);
						y = d3.scale.ordinal().rangeBands([height, 0], 0.2)
								.domain(group.top(Infinity)
									.filter(function (d) {
										return d.value !== 0;
									}).map(function(d) { return d.key; }));

						var bottomAxis = d3.svg.axis().orient("bottom").scale(x);
						var topAxis = d3.svg.axis().orient("top").scale(x);
						var yAxis = d3.svg.axis().orient("left").scale(y);

						// Build the visualization.
						var g = svg.append('g')
								.attr("transform", "translate(" + leftMargin + "," + margin + ")");

						bottom = g.append('g')
							.attr("class", "axis x-axis")
							.attr("transform", "translate(" + 0 + "," + (height) + ")")
							.call(bottomAxis);

						top = g.append('g')
							.attr("class", "axis x-axis")
							.call(topAxis);

						left = g.append('g')
							.attr("class", "axis y-axis")
							.call(yAxis);

						tooltip = g.select(".duration-tooltip");
						// Set up the tooltip.
						if(tooltip.empty()) {
							tooltip = g.append("g")
									.attr("class", "duration-tooltip")
									.attr("pointer-events", "none")
									.style("display", "none");

							tooltip.append("foreignObject")
									.attr("width", 100)
									.attr("height", 26)
									.attr("pointer-events", "none")
								.append("html")
									.style("background-color", "rgba(0,0,0,0)")
								.append("div")
									.style("padding-left", 3)
									.style("padding-right", 3)
									.style("text-align", "center")
									.style("white-space", "nowrap")
									.style("overflow", "hidden")
									.style("text-overflow", "ellipsis")
									.style("border-radius", "5px")
									.style("background-color", "white")
									.style("border", "3px solid grey");
						}
					}

					function update() {
						var groups = svg.select('g').selectAll('.path')
							.data(group.top(Infinity)
									.filter(function (d) {
										// Require start OR end date.
										return d.value !== 0;
									}),
								function (d) { return d.key; });

						groups.exit().remove();

						var newGroups = groups.enter()
								.append('g')
									.attr('class', 'duration-group')
									.attr('transform', function(d) {
										return 'translate(0,' + y(d.key) + ')';
									});

						newGroups.append('rect')
								.attr('class', 'duration-bar')
								.attr('fill', 'black')
								.attr('stroke', 'black')
								.attr('width', function(d) { return x(d.value); })
								.attr('height', y.rangeBand());

						// paths.exit().remove();
						// var newPaths = paths.enter()
						// 		.append('g')
						// 			.attr('class', 'path');

						// newPaths
						// 	.tooltip(function (d){
						// 		return {
						// 			text : d.key[2] + ": " + d.key[0] + " - " + d.key[1],
						// 			displacement : [0,20],
						// 			position: [0,0],
						// 			gravity: "right",
						// 			placement: "mouse",
						// 			mousemove : true
						// 		};
						// 	});

						// newPaths
						// 		.append('circle')
						// 			.attr('class', 'path-start')
						// 			.attr('r', 1)
						// 			.attr('fill-opacity', 0.8)
						// 			.attr('stroke-opacity', 0.8)
						// 			.attr('stroke-width', 0.8)
						// 			.style("display", "none");

						// newPaths
						// 		.append('circle')
						// 			.attr('class', 'path-end')
						// 			.attr('r', 1)
						// 			.attr('fill-opacity', 0.8)
						// 			.attr('stroke-opacity', 0.8)
						// 			.attr('stroke-width', 0.8)
						// 			.style("display", "none");

						// newPaths
						// 		.append('line')
						// 			.attr('stroke-width', 1)
						// 			.attr('stroke-opacity', 0.8);

						// var lines = paths.selectAll('line');
						// var circles = paths.selectAll('circle');
						// var startCircles = paths.selectAll('.path-start');
						// var endCircles = paths.selectAll('.path-end');

						// if(scope.mode === "Bars" || scope.mode === 'Grouped Bars') {
						// 	// We need to refigure the yStep scale since the number of groups can change.
						// 	yStep.domain([-1, group.top(Infinity)
						// 			.filter(function (d) {
						// 				// Require start OR end date.
						// 				return (d.key[0] !== "" || d.key[1] !== "") && d.value !== 0;
						// 			}).length]);

						// 	// Calculate fille based on selection.
						// 	lines.attr('stroke', fill);
						// 	circles.attr('stroke', fill);
						// 	circles.attr('fill', fill);

						// 	lines
						// 		.transition()
						// 			.attr('x1', function (d) { return x(format.parse(d.key[0])); } )
						// 			.attr('y1', 0)
						// 			.attr('x2', function (d) { return x(format.parse(d.key[1])); })
						// 			.attr('y2', 0);

						// 	startCircles.attr('cx', function (d) { return x(format.parse(d.key[0])); });
						// 	endCircles.attr('cx', function (d) { return x(format.parse(d.key[1])); });

						// 	// Translate the paths to their proper height.
						// 	paths
						// 		.transition()
						// 			.attr("transform", function (d, i) { return "translate(0," + yStep(i) + ")"; });

						// 	// Show the circles.
						// 	circles.style("display", "inline");
						// } else {
						// 	// Hide the circles.
						// 	circles.style("display", "none");

						// 	lines.attr('stroke', fill);
						// 	lines
						// 		.transition()
						// 			.attr('x1', function (d) { return x(format.parse(d.key[0])); })
						// 			.attr('y1', y(0))
						// 			.attr('x2', function (d) { return x(format.parse(d.key[1])); })
						// 			.attr('y2', y(1));

						// 	// All parallel bars start at 0.
						// 	paths
						// 		.transition()
						// 			.attr("transform", "translate(0,0)");
						// }
					}

					function reset() {
						group.remove();
						dim.remove();
						svg.remove();
						palladioService.update();
					}

					scope.filterReset = function () {
						reset();
						setup();
						update();
					};

					scope.$watchGroup(['durationDim', 'tooltipLabelDim', 'groupDim'], function () {
						reset();
						setup();
						update();
					});

					scope.$watch('mode', function (nv, ov) {
						if(nv !== undefined) {
							update();
						}
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

					var deregister = [];

					// You should also handle the following externally triggered events:

					deregister.push(palladioService.onReset(scope.uniqueToggleId, function() {

						// Reset any filters that have been applied through this visualization.
						// This means running .filterAll() on any Crossfilter dimensions you have
						// created and updating your visualization as required.

						scope.filterReset();

					}));

					deregister.push(palladioService.onUpdate(scope.uniqueToggleId, function() {
						// Only update if the table is visible.
						update();
					}));

					scope.$on('$destroy', function () {

						// Clean up after yourself. Remove dimensions that we have created. If we
						// created watches on another scope, destroy those as well.

						if(dim) {
							group.remove();
							dim.remove();
							dim = undefined;
						}
						deregister.forEach(function(f) { f(); });
						deregister = [];

					});


					// Support save/load. These functions should be able to fully recreate an instance
					// of this visualization based on the results of the exportState() function. Include
					// current filters, any type of manipulations the user has done, etc.

					function importState(state) {

						// Load a state object created by exportState().
						scope.title = state.title;
						scope.durationDim = scope.durationDims.filter(function(d) { return d.key === state.durationDim; })[0];
						scope.tooltipLabelDim = scope.labelDims.filter(function(d) { return d.key === state.tooltipLabelDim; })[0];

						scope.mode = state.mode;

					}

					function exportState() {

						// Return a state object that can be consumed by importState().
						return {
							title: scope.title,
							durationDim: scope.durationDim.key,
							tooltipLabelDim: scope.tooltipLabelDim.key,
							mode: scope.mode
						};
					}

					deregister.push(palladioService.registerStateFunctions(scope.uniqueToggleId, 'duration', exportState, importState));

					// Move the modal out of the fixed area.
					$(element[0]).find('#duration-modal').parent().appendTo('body');

					// Set up the toggle if in view state.
					if(scope.view === 'true') {
						$(document).ready(function(){
							$(element[0]).find('.toggle').click(function() {
								$(element[0]).find('.settings').toggleClass('open close');
							});
						});
					}
				}
			}
		};

		return directiveObj;
	});
