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
					scope.data = dataService.getDataSync().data;

					// Take the first number dimension we find.
					scope.durationDims = scope.metadata.filter(function (d) { return d.type === 'number'; });
					// scope.durationDim = scope.durationDims[0];

					// Label dimensions.
					scope.labelDims = scope.metadata;
					scope.tooltipLabelDim = scope.labelDims[0];
					// scope.groupDim = scope.labelDims[0];
					// scope.xGroupDim = scope.labelDims[0];
					scope.xSortDim = scope.labelDims[0];

					scope.title = "Duration view";

					scope.modes = ['Constant duration'];
					if(scope.durationDims.length > 0) scope.modes.push('Actual duration');
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

					scope.showXGroupModal = function () {
						$('#' + scope.uniqueModalId).find('#x-group-modal').modal('show');
					};

					scope.showXSortModal = function () {
						$('#' + scope.uniqueModalId).find('#x-sort-modal').modal('show');
					};

				}, post: function(scope, element) {

					// If you are building a d3.js visualization, you can grab the containing
					// element with:
					//
					// d3.select(element[0]);

					var sel, svg, dim, group, x, y,
						top, bottom, left, filter, yStep, tooltip,
						colors, bottomAxis, topAxis, yAxis, uniques, height, lineHeight;

					// Constants...
					var margin = 25;
					var lineHeight = 20;
					var leftMargin = 150;
					var bottomOffset = 50;
					var width = scope.fullWidth === 'true' ? $(window).width() - margin*2 : $(window).width()*0.7;
					// var height = scope.height ? +scope.height : 200;
					// height = scope.fullHeight === 'true' ? $(window).height()-200 : height;
					var highlightColor = '#67D6E5';

					setup();
					update();

					function setup() {
						// Check necessary fields are selected.
						if(!scope.tooltipLabelDim ||
							!scope.groupDim ||
							!scope.xGroupDim ||
							!scope.xSortDim ||
							(scope.mode === 'Actual duration' && !scope.durationDim)) {

							return false;
						}

						// Calculate uniques for use in y scale and height.
						uniques = [];
						scope.data.forEach(function(d) {
							if(uniques.indexOf("" + d[scope.groupDim.key]) === -1) {
								uniques.push("" + d[scope.groupDim.key]);
							}
						});
						uniques.sort(d3.descending);

						// Figure height based on uniques and a minimum height.
						height = uniques.length * lineHeight;

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

						// Use reductio value-lists to track the xGroup for each group.
						var reducer = reductio().count(true)
							.nest([function(d) { return d[scope.xGroupDim.key]; }]);

						if(scope.mode === 'Actual duration') {
							reducer.sum(function(d) { return +d[scope.durationDim.key]; });
						}

						reducer(group);

						// Scales
						x = d3.scale.linear().range([0, width - leftMargin]);
						setXDomain();
						y = d3.scale.ordinal().rangeBands([height - bottomOffset, 0], 0.2)
								// .domain(group.top(Infinity)
								// 	.filter(function (d) {
								// 		return d.value.count !== 0;
								// 	}).map(function(d) { return d.key; }));
								.domain(uniques);

						colors = d3.scale.ordinal()
							.range(colorbrewer.Greys[9])
							.domain(scope.xGroupDim.uniques);

						bottomAxis = d3.svg.axis().orient("bottom").scale(x);
						topAxis = d3.svg.axis().orient("top").scale(x);
						yAxis = d3.svg.axis().orient("left").scale(y);

						// Build the visualization.
						var g = svg.append('g')
								.attr("transform", "translate(" + leftMargin + "," + margin + ")");

						bottom = g.append('g')
							.attr("class", "axis x-axis x-bottom")
							.attr("transform", "translate(" + 0 + "," + (height - bottomOffset) + ")")
							.call(bottomAxis);

						top = g.append('g')
							.attr("class", "axis x-axis x-top")
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
						// Check necessary fields are selected.
						if(!scope.tooltipLabelDim ||
							!scope.groupDim ||
							!scope.xGroupDim ||
							!scope.xSortDim ||
							(scope.mode === 'Actual duration' && !scope.durationDim)) {

							return false;
						}

						// Update the x-scale and x-axes
						setXDomain();
						bottomAxis.scale(x);
						topAxis.scale(x);
						svg.select('.x-bottom').call(bottomAxis);
						svg.select('.x-top').call(topAxis);

						var groups = svg.select('g').selectAll('.duration-group')
							.data(group.top(Infinity),
									// .filter(function (d) {
									// 	return d.value.count !== 0;
									// }),
								function (d) { return d.key; });

						groups.exit().remove();

						groups.enter()
								.append('g')
									.attr('class', 'duration-group')
									.attr('transform', function(d) {
										return 'translate(1,' + y(d.key) + ')';
									});

						var constantDuration = scope.mode === 'Constant duration';
						var rectWidth = x(1) - x(0);

						function calcWidth(d) {
							return constantDuration ?
								rectWidth :
								(isNaN(+d[scope.durationDim.key]) ?
									0 :
									x(+d[scope.durationDim.key]));
						}

						var rects = groups.selectAll('.duration-bar')
							.data(function(d, i) {
								var total = 0;

								// Flatten to basic records
								return d.value.nest.map(function(n) {
									return n.values;
								}).reduce(function(a, b) {
									return a.concat(b);
								}).sort(function(a, b) {
									return d3.ascending(a[scope.xSortDim.key], b[scope.xSortDim.key]);
								}).map(function(d) {
									total = total + calcWidth(d);
									// Build object with information needed to visualize
									return {
										name: d[scope.xGroupDim.key],
										label: d[scope.tooltipLabelDim.key],
										group: i,
										x: calcWidth(d),
										offset: (total - calcWidth(d))
									};
								});
							}, function(d, i) { return d.name + '-' + d.group + '-' + i; });

						rects.exit().remove();

						rects.enter()
								.append('rect')
									.attr('height', y.rangeBand())
									.attr('class', 'duration-bar');

						rects
							.attr('width', function(d) { return d.x ? d.x : 0; })
							.attr('fill', function(d) { return colors(d.name); })
							.attr('stroke', function(d) { return colors(d.name); })
							.attr('transform', function(d) { return 'translate(' + (d.offset ? d.offset : 0) + ',0)'; })
							.on('mouseover', function(d) {
								rects.attr('fill', function(f) {
										if(d.name === f.name) {
											return highlightColor;
										} else {
											return colors(f.name);
										}})
									.attr('stroke', function(f) {
										if(d.name === f.name) {
											return highlightColor;
										} else {
											return colors(f.name);
										}
									});
							})
							.on('mouseout', function() {
								rects
									.attr('fill', function(d) { return colors(d.name); })
									.attr('stroke', function(d) { return colors(d.name); });
							})
							.tooltip(function (d){
								return {
									text : d.label,
									displacement : [0,20],
									position: [0,0],
									gravity: "right",
									placement: "mouse",
									mousemove : true
								};
							});
					}

					function setXDomain() {
						if(scope.mode === 'Actual duration') {
							x.domain([ 0, d3.max(group.top(Infinity), function (d) { return d.value.sum; }) ]);
						} else {
							x.domain([ 0, d3.max(group.top(Infinity), function (d) { return d.value.count; }) ]);
						}
					}

					function reset() {
						if(dim) {
							group.remove();
							dim.remove();
							svg.remove();
						}
					}

					scope.filterReset = function () {
						reset();
						setup();
						update();
					};

					scope.$watchGroup(['mode', 'durationDim', 'tooltipLabelDim', 'groupDim', 'xGroupDim', 'xSortDim'], function () {
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
						if(element.is(':visible')) { update(); }
					}));

					// Update when it becomes visible (updating when not visibile errors out)
					scope.$watch(function() { return element.is(':visible'); }, update);

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
						scope.groupDim = scope.labelDims.filter(function(d) { return d.key === state.groupDim; })[0];
						scope.xGroupDim = scope.labelDims.filter(function(d) { return d.key === state.xGroupDim; })[0];
						scope.xSortDim = scope.labelDims.filter(function(d) { return d.key === state.xSortDim; })[0];

						scope.mode = state.mode;

					}

					function exportState() {

						// Return a state object that can be consumed by importState().
						return {
							title: scope.title,
							durationDim: scope.durationDim.key,
							tooltipLabelDim: scope.tooltipLabelDim.key,
							groupDim: scope.groupDim.key,
							xGroupDim: scope.xGroupDim.key,
							xSortDim: scope.xSortDim.key,
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
