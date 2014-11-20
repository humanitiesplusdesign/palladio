// Timeline filter module

angular.module('palladioTimelineFilter', ['palladio', 'palladio.services'])
	.directive('palladioTimelineFilter', ['dateService', 'palladioService', function (dateService, palladioService) {
		var filterColor = "#9DBCE4";

		var directiveDefObj = {
			scope: {
				localDimension: '=dimension',
				groupAccessor: '=',
				type: '@',   // Can be 'numeric' or 'date'. Date format is YYYY-mm-dd
				uniqueDimension: '@countBy',
				xfilter: '=xfilter',
				title: '@',
				width: '@',
				height: '@',
				mode: '@',
				extentOverride: '=',
				aggregationType: '@',
				aggregateKey: '@',
				setFilter: '=',
				getFilter: '='
			},
			link: function (scope, element, attrs) {

				if(scope.localDimension.top(1).length === 0) {
					throw "No date/number dimension defined.";
				}

				///////////////////////////////////////////////////////////////////////
				//
				// If optional attributes aren't provided, define default values.
				//
				///////////////////////////////////////////////////////////////////////

				var width = scope.width ? +scope.width : $(window).width()*0.7;
				var height = scope.height ? +scope.height : 100;
				var mode = scope.mode ? scope.mode : 'stack';
				var type = scope.type ? scope.type : 'numeric';
				var groupAccessor = scope.groupAccessor ? scope.groupAccessor : function(d) { return "Default group"; };
				var uniqueDimension = scope.uniqueDimension === "" ? undefined : scope.uniqueDimension;
				var identifier = scope.title + Math.floor(Math.random() * 10000);

				///////////////////////////////////////////////////////////////////////
				//
				// Set up variables global to the timeline.
				//
				///////////////////////////////////////////////////////////////////////

				var format, dimFormat, stackGroups, g, yr, brush,
						color, y0, x, groups, lowestTime, highestTime, y1, stack, xAxis, yAxis,
						area, sel, z, mMargin, gr,
						hMargin, vMargin, yAxisWidth, xAxisHeight, mainHeight, mainWidth,
						brushHeight, title, gBrush;

				var extent = [];

				///////////////////////////////////////////////////////////////////////
				//
				// Watch for Palladio events that we need to respond to.
				//
				///////////////////////////////////////////////////////////////////////

				var deregister = [];

				deregister.push(palladioService.onUpdate(identifier, function() {
					sel.call(updateTimeline);
				}));

				scope.$on('filterReset', function() {
					filterReset();
				});

				deregister.push(palladioService.onReset(identifier, filterReset));

				scope.$on('zoomToFilter', function() {

					if(!brush.empty()) {
						// Grab the current brush extent so we can redraw later.
						tempExtent = brush.extent();

						var botExtent = brush.extent()[0][0];
						var topExtent = brush.extent()[brush.extent().length - 1][1];

						x.domain([botExtent, topExtent]);

						brush.clear();
						brush.extent(tempExtent);
					} else {
						x.domain([lowestTime, highestTime]);
					}

					// Update the zoom.
					z.x(x);
					z.event(d3.select(element[0]).select("svg").select("g"));
				});

				///////////////////////////////////////////////////////////////////////
				//
				// Watch for parameter changes that we need to respond to.
				//
				///////////////////////////////////////////////////////////////////////

				scope.$watch('mode', function(nv, ov) {
					if(nv !== ov) {
						mode = scope.mode;
						modeSetup();
						sel.call(updateTimeline);
					}
				});

				// Test mode changes.
				// window.setTimeout(function() {
				//	scope.$apply(function (scope) { scope.mode = 'multiple'; });
				// }, 10000);

				// window.setTimeout(function() {
				//	scope.$apply(function (scope) { scope.mode = 'stack'; });
				// }, 15000);

				scope.$watch('title', function(nv, ov) {
					if(nv !== ov) {
						title = scope.title;
						titleSetup();
					}
				});

				// Test title changes.
				// window.setTimeout(function() {
				//	scope.$apply(function (scope) { scope.title = 'Testing Testing'; });
				// }, 10000);
				// window.setTimeout(function() {
				//	scope.$apply(function (scope) { scope.title = undefined; });
				// }, 15000);

				scope.$watchGroup(['uniqueDimension', 'aggregationType', 'aggregationType'], function(nv, ov) {
					if(nv[0] !== ov[0] || nv[1] !== ov[1] || nv[2] !== ov[2]) {
						uniqueDimension = scope.uniqueDimension === "" ? undefined : scope.uniqueDimension;
						buildGroupings();
						sel.call(updateTimeline);
					}
				});

				// Test unique dimension changes.
				// window.setTimeout(function() {
				//	scope.$apply(function (scope) { scope.uniqueDimension = 'Birth Year'; });
				// }, 10000);
				// window.setTimeout(function() {
				//	scope.$apply(function (scope) { scope.uniqueDimension = 'People ID'; });
				// }, 20000);

				scope.$watch('localDimension', function(nv, ov) {
					if(nv) {

						// If you change the type, you must have changed the dimension, so we
						// handle type changes here.
						type = scope.type ? scope.type : 'numeric';

						// If the existing brush extent is non-zero, clear the existing
						// filter on the old dimension ('ov') and trigger the necessary events.
						if(brush && brush.extent()[1] - brush.extent()[0] !== 0) {
							ov.filterAll();
							scope.extentOverride.start = null;
							scope.extentOverride.end = null;

							// If title has already changed, then we have a problem. Need to use a 
							// unique and static identifier...
							palladioService.removeFilter(identifier);
							palladioService.update();

							// If our container supports state saving.
							if(scope.setFilter) scope.setFilter(brush.extent());
						}

						setup();
						sel.call(initializeTimeline);
						sel.call(updateTimeline);
					}
				});

				scope.$watch('groupAccessor', function(nv, ov) {
					if(nv !== ov) {
						var tempExtent;

						groupAccessor = scope.groupAccessor ? scope.groupAccessor : function(d) { return "Default group"; };

						// Grab the current brush extent so we can redraw later.
						tempExtent = brush.extent();
						brush.clear();

						setup();
						
						brush.extent(tempExtent);

						sel.call(initializeTimeline);
						sel.call(updateTimeline);
					}
				});

				setup();

				// Draw the timelines.
				sel.call(initializeTimeline);
				sel.call(updateTimeline);

				///////////////////////////////////////////////////////////////////////
				//
				// Initializes the whole timeline. Run once and then update using
				// updateTimeline(). If parameters change, then this can be run
				// again, since it tests for selections that already exist.
				//
				///////////////////////////////////////////////////////////////////////

				function initializeTimeline(selection) {

					var timelineGroups = buildTimelineGroups(groups);

					stack(timelineGroups);

					gr = selection.select("svg").select("g");

					var tooltip = gr.select(".timeline-tooltip");

					if(gr.empty()) {
						gr = selection.append("svg")
								.attr("height", height)
								.attr("width", width)
							.append("g")
								.attr("transform", "translate(" + hMargin + ", " + vMargin + ")");

						// Set up transparent background rectable to catch zoom events.
						gr.append("rect")
								.attr("height", height - vMargin*2)
								.attr("width", width - hMargin*2)
								.attr("fill", "rgba(0, 0, 0, 0)");
					}

					z = d3.behavior.zoom();
					z.x(x);
					z.scaleExtent([1, Infinity]);
					z.on("zoom", zoom);

					// Create the highlight on the main view that will follow the brush. Create it first
					// so that it is behind the groups.
					if(!gr.select("g.large-highlight").empty()) {
						gr.select("g.large-highlight").remove();
					}
					gr.append("g").classed("large-highlight", true)
							.attr("height", mainHeight)
							.attr("width", mainWidth);
						
					updateHighlights(gr);

					// Disable zooming as it is broken.
					// gr.call(z);

					// Set up the brush timeline.
					var brushTimeline = gr.select(".brush-timeline");
					if(brushTimeline.empty()) {
						brushTimeline = gr.append("g").attr("class", "brush-timeline");
						brushTimeline.attr("transform", "translate(0, " + (mainHeight + mMargin) + ")");
					}

					var brushGroups = brushTimeline.selectAll(".brush-group")
							.data(timelineGroups);

					brushGroups.exit().remove();
					var newBrushGroups = brushGroups.enter()
							.append("g")
								.attr("class", "brush-group");

					newBrushGroups.append("path")
							.attr("class", "area")
							.attr("transform", "scale(1, " + (brushHeight/mainHeight) + ")");
					brushGroups.style("fill", "grey");

					// Remove all the groups so they get properly recreated.
					gr.selectAll(".group").remove();

					var group = gr.selectAll(".group")
							.data(timelineGroups);

					var newGroups = group.enter()
							.append("g")
								.attr("class", "group");

					newGroups.append("path")
							.attr("class", "area")
							.on("mouseover", function (d) {
								d3.select(this).style("fill", "#67D6E5");
							})
							.on("mouseout", function (d) {
								d3.select(this).style("fill", function(d) { return color(d[0].i); });
							})
							.tooltip(function (d,i){
								return {
									text : stackGroups[d[0].i],
									displacement : [0,20],
									position: [0,0],
									gravity: "right",
									placement: "mouse",
									mousemove : true
								};
							});

					color.domain(d3.extent(timelineGroups, function(d){ return d[0].i; }));

					group.style("fill", function(d,i) { return color(d[0].i); });

					if(!gr.select("g.x-axis").empty()) {
						gr.select("g.x-axis").remove();
					}

					gr.append("g")
							.attr("class", "axis x-axis")
							.attr("transform", "translate(0," + (mainHeight + mMargin + brushHeight) + ")")
							.call(xAxis);

					brush.on("brushstart", function () {
						if(d3.event.sourceEvent) d3.event.sourceEvent.stopPropagation();
					});

					brush.on("brush", function () {
						extent = brush.extent();

						updateHighlights(gr);

						scope.localDimension.filterFunction(dimFilter);
						palladioService.update();
					});

					brush.on("brushend", function () {
						var ex = brush.extent();
						extent = ex;

						if (brush.empty()) {
							scope.localDimension.filterAll();

							scope.$parent.$digest(); // Apparently scope $digest doesn't propogate up.
							palladioService.removeFilter(identifier);

							// If our container supports state saving.
							if(scope.setFilter) scope.setFilter(brush.extent());
						} else {
							// Don't need to update as brushmove is already processed on brushend
							// scope.localDimension.filterFunction(dimFilter);

							scope.$parent.$digest(); // Apparently scope $digest doesn't propogate up.
							var filterText = ex.map(function (d) {
								return "from " + dimFormat(d[0]) + " to " + dimFormat(d[1]);
							}).join(" and ");
							deregister.push(palladioService.setFilter(identifier, scope.title, filterText, filterReset));

							// If our container supports state saving.
							if(scope.setFilter) scope.setFilter(brush.extent());
						}

						updateHighlights(gr);
						
						palladioService.update();
					});

					if(!gr.select("g.brush").empty()) {
						gr.select("g.brush").remove();
					}

					brush.resizeAdaption(function (selection) {
						selection.append("path")
							//.attr("d", resizePath)
							.attr("transform", "translate(0, " + -(brushHeight * (1/4)) + ")");
							
						selection.select("rect").attr("height", brushHeight);

						function resizePath(d) {
							var e = +(d[0] == "e"), x = e ? 1 : -1, y = (brushHeight)*(1/2);
							return "M" + (0.5 * x) + "," + y +
								"A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) +
								"V" + (2 * y - 6) +
								"A6,6 0 0 " + e + " " + (0.5 * x) + "," + (2 * y) +
								"Z" +
								"M" + (2.5 * x) + "," + (y + 8) +
								"V" + (2 * y - 8) +
								"M" + (4.5 * x) + "," + (y + 8) +
								"V" + (2 * y - 8);
						}
					});

					brush.extentAdaption(function (selection) {
						selection.attr("height", brushHeight)
							.attr("fill", filterColor)
							.attr("fill-opacity", ".25");
					});

					gBrush = gr.append("g").attr("class", "brush")
								.attr("transform", "translate(0, " + (mainHeight + mMargin) + ")")
								.call(brush);

					gBrush.select('rect.background').attr("height", brushHeight);

					if(tooltip.empty()) {
						// Set up the tooltip.
						tooltip = gr.append("g")
								.attr("class", "timeline-tooltip")
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

				var t;
				function dimFilter(d) {
					t = false;

					if(extent.length === 0) return true;

					extent.forEach(function (p) {
						if( dimFormat(p[0]) <= d && dimFormat(p[1]) >= d ) t = true;
					});
					return t;
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Update timeline. Assumes the only things that have changed are
				// CrossFilter filters, y-/x-scales, or the 'mode' parameter.
				//
				///////////////////////////////////////////////////////////////////////

				function updateTimeline(selection) {

					var timelineGroups = buildTimelineGroups(groups);
					var gr = selection.select("svg").select("g");

					// Reset the y1 domain based on the current biggest group.
					var groupMax = d3.max(groups.map(function (d) {
						return d.value.data.countByGroup.values().map(function (c) { return c.agg; })
							.reduce(function (a, b) { return a + b; }, 0);
					}));

					y1.domain([0, groupMax]);

					yAxis.scale(y1);

					stack(timelineGroups);

					var group = gr.selectAll(".group")
							.data(timelineGroups);

					var brushGroups = gr.selectAll(".brush-group")
							.data(timelineGroups);

					if(mode === 'stack') {
						if(!gr.select('.y-axis').empty()) {
							gr.select('.y-axis').call(yAxis);
						} else {
							gr.append("g")
								.attr("class", "axis y-axis")
								.attr("transform", "translate(" + mainWidth + ", 0)")
								.call(yAxis);
						}
					} else {
						if(!gr.select('.y-axis').empty()) {
							gr.select('.y-axis').remove();
						}
					}

					group.exit().remove();
					brushGroups.exit().remove();

					group.transition()
						.attr("transform", function(d, i) {
							if(mode === 'stack') {
								return "translate(0, 0)";
							} else {
								return "translate(0," + y0(stackGroups[i]) + ")";
							}
						});

					var brushPaths = brushGroups.select("path");
							
					brushPaths.attr("d", function(d) { return area(d); });

					var paths = group.select("path");

					paths.attr("d", function(d) { return area(d); });
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Update highlight / extents on the main timeline
				//
				///////////////////////////////////////////////////////////////////////

				function updateHighlights(selection) {
					var highlightRects = selection.select('.large-highlight')
						.selectAll("rect")
							.data(extent);
						
					highlightRects.exit().remove();
					highlightRects.enter()
						.append("rect")
							.attr("height", mainHeight)
							.attr("fill", filterColor)
							.attr("fill-opacity", "1");

					highlightRects
						.attr("width", function (d) { return x(d[1]) - x(d[0]);})
						.attr("transform", function(d) { return "translate(" + x(d[0]) + ", 0)"; });
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Fill in missing groupings
				//
				///////////////////////////////////////////////////////////////////////

				function buildTimelineGroups(groups) {
					var lowestTime = format(d3.min(groups, function(d) { return format.parse(d.key); })),
							highestTime = format(d3.max(groups, function(d) { return format.parse(d.key); })),
							divisions = [highestTime],
							groupPosition = 0,
							defaultGroups = d3.map(),
							filledGroups = null,
							tempDate = null;

					// Populate empty countByGroups
					stackGroups.forEach(function(d) {
						defaultGroups.set(d, { count: 0, agg: 0 });
					});

					if( type === 'numeric' ) {

						// Fill in empty groupings to force the area between groups to 0.

						while(divisions[0] > lowestTime) {
							divisions.unshift(divisions[0] - 1);
						}
					} else {

						// For Date-based timelines, we have to figure out the granularity first.

						if(format.toString().length === 8) {
							// Day-based
							while(format.parse(divisions[0]) > format.parse(lowestTime)) {
								tempDate = format.parse(divisions[0]);
								tempDate.setUTCDate(tempDate.getUTCDate() - 1);
								divisions.unshift(format(tempDate));
							}
						} else {
							if(format.toString().length === 5) {
								// Month-based
								while(format.parse(divisions[0]) > format.parse(lowestTime)) {
									tempDate = format.parse(divisions[0]);
									tempDate.setUTCMonth(tempDate.getUTCMonth() - 1);
									divisions.unshift(format(tempDate));
								}
							} else {
								// Year-based
								while(format.parse(divisions[0]) > format.parse(lowestTime)) {
									tempDate = format.parse(divisions[0]);
									tempDate.setUTCFullYear(tempDate.getUTCFullYear() - 1);
									divisions.unshift(format(tempDate));
								}
							}
						}
					}

					filledGroups = divisions.map(function(d) {
						if(groups[groupPosition].key === d) {
							groupPosition++;
							return { key: d, value: groups[groupPosition-1].value };
						} else {
							return { key: d, value: { count: 0, data: { countByGroup: defaultGroups, agg: 0 } } };
						}
					});

					return stackGroups.map(function(d, i) {
						return filledGroups.map( function(g) {
							return { "x": format.parse(g.key), "y": g.value.data.countByGroup.get(d).agg, "total": g.value.data.agg, "i": i };
						});
					});
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Handle zooming in and out.
				//
				///////////////////////////////////////////////////////////////////////

				var tempExtent = [];
				var diff = null;
				var formatStr = null;
				var domainTop = null;
				var domainBot = null;
				function zoom() {

					if(type !== 'numeric') {
						diff = x.domain()[1].getFullYear() - x.domain()[0].getFullYear();
						formatStr = format.toString();

						if((diff >= 30 && formatStr !== "%Y") ||
								(1 < diff && diff < 30 && formatStr !== "%Y-%m") ||
								(diff <= 1 && formatStr !== "%Y-%m-%d")) {
							buildGroupings();
						}

						// Copy dates
						domainBot = dimFormat.parse(dimFormat(x.domain()[0]));
						domainTop = dimFormat.parse(dimFormat(x.domain()[1]));

						// Adjust years
						domainBot.setUTCFullYear(domainBot.getUTCFullYear() - 1);
						domainTop.setUTCFullYear(domainTop.getUTCFullYear() + 1);

						// We need to rebuild the groups with a new filter.
						groups = g.all().filter(function(g) {
							if(g.key && format.parse(g.key) &&
									((format.parse(g.key)) >= domainBot) &&
									((format.parse(g.key)) <= domainTop)) {
								return true;
							} else { return false; }
						});
					}

					// Fix translation getting stuck near 0.
					if(z.scale() === 1) z.translate([0,0]);

					xAxis.scale(x);
					brush.x(x);
					tempExtent = brush.extent();
					brush.clear();
					brush.extent(tempExtent);

					sel.select("svg").select('.x-axis').call(xAxis);
					sel.select("svg").select('.brush').call(brush);

					sel.call(updateTimeline);
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Settings based on 'mode' parameter. Run this function if 'mode'
				// changes.
				//
				///////////////////////////////////////////////////////////////////////

				function modeSetup() {
					if(mode === 'stack') {
						y1.range([mainHeight, 0]);
						area.y0(function (d) { return y1(d.valueOffset); });
						area.y1(function (d) { return y1(d.y) - (y1.range()[0] - y1(d.valueOffset)); });
					} else {
						y1.range([y0.rangeBand(), 0]);
						area.y0(function (d) { return y0.rangeBand(); });
						area.y1(function (d) { return y1(d.y); });
					}
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Settings based on 'title' parameter. Run this function if 'title'
				// changes.
				//
				///////////////////////////////////////////////////////////////////////

				function titleSetup() {
					if(scope.title !== undefined) {
						// For now we don't display the title
						// sel.select("span.list-title").text(scope.title);
					} else {
						sel.select("span.list-title").text(null);
					}
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Setup the timeline environment.
				//
				///////////////////////////////////////////////////////////////////////

				function setup() {

					// Set up our formatter. If the type of the timeline is numeric, then it's just the
					// identity. Otherwise it will use the dateService format.
					format = null;
					dimFormat = null;

					if(type !== 'numeric') {
						format = dateService.format();
						// Much faster than d3.time.format("%Y-%m-%d") and supports negative years.
						dimFormat = dateService.format;
					} else {
						format = function (d) { return d; };
						format.parse = function(d) { return d; };
						dimFormat = format;
					}

					// Calculate groups for stacking/multiples.

					stackGroups = d3.map();

					// We need to create a dimension and group using the groupAccessor
					// so that we can read out all groups (including empty ones) and
					// grab their keys.

					var tempDim = scope.xfilter.dimension(groupAccessor);
					var tempGroup = tempDim.group();

					tempGroup.all().forEach(function(d) {
						if(!stackGroups.has(d.key)) {
							stackGroups.set(d.key, 0);
						}
					});

					tempDim.remove();
					tempGroup.remove();

					stackGroups = stackGroups.keys().sort();

					// Set up values to calculate the range of years we are dealing with.
					if(g) g.remove();
					g = null;
					yr = 0;

					// Set up values.
					brush = d3.svg.multibrush();
					
					hMargin = vMargin = mMargin = 10;
					xAxisHeight = 20;
					yAxisWidth = 30;
					// Width & height of the main visualization
					mainWidth = width - hMargin*2 - yAxisWidth;
					mainHeight = (height - vMargin*2 - mMargin - xAxisHeight)*0.8;
					// Height of the brush visualization
					brushHeight = (height - vMargin*2 - mMargin - xAxisHeight)*0.2;

					//color = d3.scale.ordinal().domain([0,8]).range(colorbrewer.Greys[9]);
					color = d3.scale.linear().interpolate(d3.interpolateLab).range(['#DDDDDD','#444444']);

					y0 = d3.scale.ordinal()
							.rangeRoundBands([0, mainHeight], 0);

					x = null;

					groups = null;

					buildGroupings();

					lowestTime = d3.min(groups, function(d) { return format.parse(d.key); });
					highestTime = d3.max(groups, function(d) { return format.parse(d.key); });

					if(lowestTime instanceof Date) {
						x = d3.time.scale().range([0, mainWidth])
									.domain([lowestTime, highestTime]);
					} else {
						x = d3.scale.linear().range([0, mainWidth])
									.domain([lowestTime, highestTime]);
					}

					x.clamp(true);

					y0.domain(stackGroups);

					var groupMax = d3.max(groups.map(function (d) {
						return d.value.data.countByGroup.values().map(function (c) { return c.agg; })
							.reduce(function (a, b) { return a + b; }, 0);
					}));

					y1 = d3.scale.linear()
							.domain([0, groupMax]);

					stack = d3.layout.stack()
							.out(function(d, dy) { d.valueOffset = dy; });

					xAxis = d3.svg.axis().orient("bottom")
							.scale(x);

					yAxis = d3.svg.axis().orient("right")
							.scale(y1)
							.ticks(10)
							.tickFormat(d3.format("d"));

					brush.x(x);

					// If the type is numeric, suppress commas in the timeline labels.
					if(type === 'numeric') {
						xAxis.tickFormat(d3.format("d"));
					}

					area = d3.svg.area()
							.x(function (d) { return x(d.x); })
							.interpolate("step-after");

					modeSetup();

					// D3.js selection for the directive element.
					sel = d3.select(element[0]);

					sel.attr("height", height);
					sel.attr("width", width);

					// Set up the title place-holder if it isn't already there.
					if(sel.select("span.list-title").empty()) {
						sel.append("span")
								.attr("class", "list-title");
					}

					//titleSetup();
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Build/rebuild our groupings. Normally happens as part of our setup()
				// but sometimes (e.g. during zooming) this is required outside the
				// normal setup lifecycle.
				//
				///////////////////////////////////////////////////////////////////////

				function buildGroupings() {

					///////////////////////////////////////////////////////////////////////
					//
					// Reduce functions that don't double-count by using add/reduce based 
					// on unique dimension if defined.
					//
					// countByGroup property aggregates counts broken out by the grouping 
					// defined by the group-accessor attribute.
					//
					///////////////////////////////////////////////////////////////////////

					var helper = crossfilterHelpers
						.countByDimensionWithInitialCountAndData(
							function (d) { return d[uniqueDimension]; },
							function (v, p, t) {
								if(p === undefined) {
									// Populate the group hash:
									p = {};
									p.countByGroup = d3.map();
									stackGroups.forEach(function(d) {
										if(!p.countByGroup.has(d)) {
											p.countByGroup.set(d, { uniques: d3.map(), count: 0, agg: 0 });
										}
									});
								}
								if(t === 'add') {
									// Adding a new record.
									// Conditionally update group counts.
									if(p.countByGroup.get(groupAccessor(v)).uniques.has(v[uniqueDimension])) {
										p.countByGroup.get(groupAccessor(v)).uniques.set(v[uniqueDimension],
											p.countByGroup.get(groupAccessor(v)).uniques.get(v[uniqueDimension]) + 1 );
									} else {
										p.countByGroup.get(groupAccessor(v)).uniques.set(v[uniqueDimension], 1);
										p.countByGroup.get(groupAccessor(v)).count++;
										if(scope.aggregationType === 'COUNT') {
											p.countByGroup.get(groupAccessor(v)).agg++;
										} else {
											// Sum
											if(scope.aggregateKey) {
												p.countByGroup.get(groupAccessor(v)).agg = p.countByGroup.get(groupAccessor(v)).agg + (+v[scope.aggregateKey]); // Make sure to cast or you end up with a String!!!
											}
										}
									}

									if(scope.aggregationType === 'COUNT') {
										p.agg = p.agg + 1;
									} else {
										// Sum
										if(scope.aggregateKey) {
											p.agg = p.agg + (+v[scope.aggregateKey]); // Make sure to cast or you end up with a String!!!
										}
									}
								} else {
									// Removing a record.
									// Update group count.
									if(p.countByGroup.get(groupAccessor(v)).uniques.get(v[uniqueDimension]) === 1) {
										p.countByGroup.get(groupAccessor(v)).uniques.remove(v[uniqueDimension]);
										p.countByGroup.get(groupAccessor(v)).count--;

										if(scope.aggregationType === 'COUNT') {
											p.countByGroup.get(groupAccessor(v)).agg--;
										} else {
											// Sum
											if(scope.aggregateKey) {
												p.countByGroup.get(groupAccessor(v)).agg = p.countByGroup.get(groupAccessor(v)).agg - (+v[scope.aggregateKey]); // Make sure to cast or you end up with a String!!!
											}
										}
									} else {
										p.countByGroup.get(groupAccessor(v)).uniques.set(v[uniqueDimension],
											p.countByGroup.get(groupAccessor(v)).uniques.get(v[uniqueDimension]) - 1);
									}

									if(scope.aggregationType === 'COUNT') {
										p.agg = p.agg - 1;
									} else {
										// Sum
										if(scope.aggregateKey) {
											p.agg = p.agg - (+v[scope.aggregateKey]); // Make sure to cast or you end up with a String!!!
										}
									}
								}
								return p;
							});

					var reduceAdd = helper.add;
					var reduceRemove = helper.remove;
					var reduceInitial = helper.init;

					function orderValue(p) {
						return p.agg;
					}

					///////////////////////////////////////////////////////////////////////
					//
					// Reduce functions that just count normally, without worrying about
					// duplicate values.
					//
					///////////////////////////////////////////////////////////////////////

					function defaultReduceAdd(p, v) {
						++p.count;
						++p.agg;
						p.countByGroup.set(groupAccessor(v), p.data.countByGroup.get(groupAccessor(v)) + 1);
						return p;
					}

					function defaultReduceRemove(p, v) {
						--p.count;
						--p.agg;
						p.countByGroup.set(groupAccessor(v), p.data.countByGroup.get(groupAccessor(v)) - 1);
						return p;
					}

					function defaultReduceIntial() {
						var obj = { count: 0, agg: 0, data: { countByGroup: d3.map() } };

						// Populate the group hash:
						stackGroups.forEach(function(d) {
							if(!obj.data.countByGroup.has(d)) {
								obj.data.countByGroup.set(d, 0);
							}
						});

						return obj;
					}

					if(type != 'numeric') {

						// If we have a Date-type dimension, then make sure we don't have a ridiculous number
						// of groups by grouping at the date, then month, then year level.
						if(!x) {
							// If the x-scale hasn't been defined yet, we do this the hard way.
							g = scope.localDimension.group();
							var lt = d3.min(g.all().filter(function(g) { return g.key && dimFormat.parse(g.key); }), function(d) { return dimFormat.parse(d.key); });
							var ht = d3.max(g.all().filter(function(g) { return g.key && dimFormat.parse(g.key); }), function(d) { return dimFormat.parse(d.key); });
							yr = ht.getFullYear() - lt.getFullYear();
							g.remove();
						} else {
							yr = x.domain()[1].getFullYear() - x.domain()[0].getFullYear();
						}

						// If we are showing more than 2 years, we can't get down to a day-level granularity.
						if(yr <= 1) {
							format = dateService.format;
						} else {
							if(yr > 1 ) {
								format = dateService.formatMonth;

								// If we are showing more than 30 years, we can't get down to a month-level granularity.
								if(yr > 30) {
									format = dateService.formatYear;
								}
							}
						}
					}

					// Build our groups based on the chosen date granularity.
					var tempDate;

					if(g) {
						g.remove();
					}

					g = scope.localDimension.group(function (d) {
							if(d) {
								tempDate = dimFormat.parse(d);
							} else { tempDate = null; }

							if(tempDate !== null && tempDate !== undefined) {
								return format(tempDate);
							} else { return ""; }
						});

					// If uniqueDimension is defined, use it for counting.
					if(uniqueDimension !== undefined) {
						g.reduce(reduceAdd, reduceRemove, reduceInitial);
						g.order(orderValue);
					} else {
					// Otherwise, use default counting.
						g.reduce(defaultReduceAdd, defaultReduceRemove, defaultReduceIntial);
						g.order(
							function(p) {
								return p.data.agg;
							}
						);
					}

					groups = g.all().filter(function(g) { return g.key && format.parse(g.key); })
						.sort(function (a,b) { return format.parse(a.key) < format.parse(b.key) ? -1 : 1; });

				}

				///////////////////////////////////////////////////////////////////////
				//
				// Reset filters.
				//
				///////////////////////////////////////////////////////////////////////

				function filterReset() {
					scope.localDimension.filterAll();
					brush.clear();
					extent = brush.extent();
					updateHighlights(gr);
					palladioService.removeFilter(identifier);
					palladioService.update();

					// If our container supports state saving.
					if(scope.setFilter) scope.setFilter(brush.extent());
				}


				// Handle updating filter from a saved extent.
				scope.getFilter = function (ex) {

					brush.clear();

					brush.extent(ex.map(function(e) { return [new Date(e[0]), new Date(e[1])]; }));
					extent = brush.extent();
					
					gBrush.call(brush);
					// sel.select("svg").select('.brush').call(brush);
					sel.call(updateTimeline);

					if (brush.empty()) {
						scope.localDimension.filterAll();
						// scope.extentOverride.start = null;
						// scope.extentOverride.end = null;
						// scope.$parent.$digest(); // Apparently scope $digest doesn't propogate up.
						palladioService.removeFilter(identifier);

						// If our container supports state saving.
						if(scope.setFilter) scope.setFilter(brush.extent());
					} else {
						// Don't need to update as brushmove is already processed on brushend
						scope.localDimension.filterFunction(dimFilter);

						// scope.$parent.$digest(); // Apparently scope $digest doesn't propogate up.
						var filterText = extent.map(function (d) {
							return "from " + dimFormat(new Date(d[0])) + " to " + dimFormat(new Date(d[1]));
						}).join(" and ");
						deregister.push(palladioService.setFilter(identifier, scope.title, filterText, filterReset));

						// If our container supports state saving.
						if(scope.setFilter) scope.setFilter(brush.extent());
					}

					palladioService.update();
				};

				scope.$on('$destroy', function () {
					deregister.forEach(function(f) { f(); });
				});
			}
		};

		return directiveDefObj;
	}])
	.directive('palladioTimelineFilterWithSettings', ['dateService', 'palladioService', 'dataService', function (dateService, palladioService, dataService) {
		var directiveObj = {
			scope: true,
			template:	'<div class="row-fluid">' +
							
							'<div class="span3">' +
								'<div class="accordion-heading row-fluid">' +
									'<a class="span1 text-center angle" data-toggle="collapse" data-ng-click="collapse=!collapse" data-ng-init="collapse=false" data-parent="#filters" href="{{uniqueToggleHref}}" target="_self">'+
										'<span data-ng-show="!collapse"><i class="fa fa-angle-down"></i></span>'+
										'<span data-ng-show="collapse"><i class="fa fa-angle-right"></i></span>'+
									'</a>' +
									'<input type="text" class="editable span11" data-ng-model="title"></input>' +
								'</div>' +
								'<div class="settings-panel accordion-body" ng-show="!collapse"> ' +
									'<div class="setting row-fluid">' +
										'<label class="span4 inline">Dates</label>' +
										'<span class="field span8" ng-click="showDateModal()">{{dateProp.description || "Choose..."}}<i class="fa fa-bars pull-right"></i></span>' +
									'</div>' +

									'<div class="setting row-fluid" data-ng-show="!shortVersion">' +
										'<label class="span4 inline">Group by</label>' +
										'<span class="field span8" ng-click="showGroupModal()">{{groupProp.description || "Choose..."}}<i class="fa fa-bars pull-right"></i></span>' +
									'</div>' +

									'<div class="setting row-fluid" data-ng-show="!shortVersion">' +
										'<label class="span4 inline">Height shows</label>' +
										'<span class="field span8" ng-click="showAggModal()">{{getAggDescription(aggDim) || "Choose..."}}<i class="fa fa-bars pull-right"></i></span>' +
									'</div>' +

									'<div class="setting row-fluid" data-ng-show="!shortVersion">' +
										'<span class="span4"></span>' +
										'<span class="">' +
											'<a class="" data-ng-click="zoomToFilter()">Zoom to filter</a>' +
										'</span>' +
									'</div>' +
								'</div>' +
							'</div>' + // chiusura span4
							
							'<div class="span9">' +
								'<!-- View -->' +
								'<div id="{{uniqueToggleId}}" class="row-fluid accordion-body collapse in component">' +
									'<div class="span12 view">' +
										'<a class="toggle" class="close"></a>' +
										'<div data-palladio-timeline-filter ' +
											'data-dimension="dateDim" ' +
											'data-group-accessor="groupAccessor" ' +
											'data-xfilter="xfilter" ' +
											'data-type="date" ' +
											'data-title={{title}} ' +
											'data-height="200" ' +
											'data-mode={{mode}} ' +
											'data-count-by={{countBy}} ' +
											'data-aggregation-type={{aggregationType}} ' +
											'data-aggregate-key={{aggregateKey}} ' +
											'data-set-filter="setFilter" ' +
											'data-get-filter="getFilter" ' +
											'data-extent-override="extentOverride" >' +
										'</div>' +
									'</div> ' +
								'</div>' +
								'<div id={{uniqueModalId}}>' +
									'<div id="date-modal" data-modal dimensions="dateDims" model="dateProp"></div>' +
									'<div id="group-modal" data-modal dimensions="groupDims" model="groupProp"></div>' +
									'<div id="agg-modal" data-modal dimensions="aggDims" model="aggDim" description-accessor="getAggDescription"></div>' +
								'</div>' +
							'</div>' +

							'<a class="remove fa fa-trash-o" data-ng-click="removeFilter($event)" data-toggle="tooltip" data-title="Delete"></a>' +
							'<a class="reset fa fa-eraser" style="line-height:40px" data-ng-click="filterReset()" data-toggle="tooltip" data-title="Clear"></a>' +
							'<a data-ng-show="!shortVersion" class="short fa fa-compress" style="line-height:40px" data-ng-click="shortVersion = !shortVersion" data-toggle="tooltip" data-title="Compress"></a>' +
							'<a data-ng-show="shortVersion" class="short fa fa-expand" style="line-height:40px" data-ng-click="shortVersion = !shortVersion" data-toggle="tooltip" data-title="Expand"></a>' +

						'</div>',

			link: { pre: function(scope, element, attrs) {

					// In the pre-linking function we can use scope.data, scope.metadata, and
					// scope.xfilter to populate any additional scope values required by the
					// template.

					// The parent scope must include the following:
					//   scope.xfilter
					//   scope.metadata

					scope.metadata = dataService.getDataSync().metadata;
					scope.xfilter = dataService.getDataSync().xfilter;

					var deregister = [];

					scope.uniqueToggleId = "timelineFilter" + Math.floor(Math.random() * 10000);
					scope.uniqueToggleHref = "#" + scope.uniqueToggleId;
					scope.uniqueModalId = scope.uniqueToggleId + "modal";

					// Set up date selection.
					scope.dateDims = scope.metadata.filter(function (d) { return d.type === 'date'; })
							.sort(function (a, b) { return a.description < b.description ? -1 : 1; });

					var formatter = dateService.format;

					var dateDimAccessor = function (d) {
						return formatter.reformatExternal(d[scope.dateProp.key]);
					};
					scope.dateProp = scope.dateDims[0] ? scope.dateDims[0] : undefined;
					scope.$watch('dateProp.key', function(nv, ov) {
						// Avoid switching the dateDim before the directive is prepared.
						if(nv) {
							if(scope.dateDim) scope.dateDim.remove();
							scope.dateDim = scope.xfilter.dimension(dateDimAccessor);
							scope.title = scope.dateDims.filter( function (d) { return d.key == scope.dateProp.key; })[0].description;
						}
					});

					// Set up group selection.
					scope.groupDims = scope.metadata
							.sort(function (a, b) { return a.description < b.description ? -1 : 1; });
					scope.groupProp = scope.groupDims[0] ?
						scope.metadata.sort(function(a,b) { return a.cardinality < b.cardinality ? -1 : 1; })[0] :
						undefined;
					scope.$watch('groupProp', function() {
						scope.groupAccessor = function(d) { return d[scope.groupProp.key] + ""; };
					});

					// Set up count selection.
					scope.getAggDescription = function (field) {
						if(field.type === 'count') {
							return 'Number of ' + field.field.countDescription;
						} else {
							return 'Sum of ' + field.field.description + ' (from ' + countDims.get(field.fileId).countDescription + ' table)';
						}
					};

					var countDims = d3.map();
					scope.metadata.filter(function (d) { return d.countable === true; })
						.forEach(function (d) {
							countDims.set(d.originFileId ? d.originFileId : 0, d);
						});

					scope.aggDims = scope.metadata.filter(function (d) { return d.countable === true || d.type === 'number'; })
							.map(function (a) {
								return {
									key: a.key,
									type: a.countable ? 'count' : 'sum',
									field: a,
									fileId: a.originFileId ? a.originFileId : 0
								};
							})
							.sort(function (a, b) { return scope.getAggDescription(a) < scope.getAggDescription(b) ? -1 : 1; });
					scope.aggDim = scope.aggDims[0];
					scope.$watch('aggDim', function () {
						// scope.countBy = scope.aggDim ? scope.countDim.key : scope.countBy;
						if(!scope.aggDim) {
							// No aggregation selected - just choose the first one
							scope.countBy = scope.countDims.get(0).key;
						} else {
							// We figure out the unique aggregation dimension based on aggDim
							if(scope.aggDim.type === 'count') {
								scope.countBy = scope.aggDim.key;
								scope.aggregationType = 'COUNT';
								scope.aggregateKey = null;
							} else {
								// We are summing
								scope.countBy = countDims.get(scope.aggDim.fileId).key;
								scope.aggregationType = 'SUM';
								scope.aggregateKey = scope.aggDim.key;
							}
						}
					});

					scope.aggregationTypes = ['COUNT', 'SUM'];
					scope.aggregationType = 'COUNT';
					scope.aggregateKey = null;

					// Set the default unique key, so no selection for this one.
					if(scope.metadata.filter(function (d) { return d.countBy === true; })[0]) {
						scope.countBy = scope.metadata.filter(function (d) { return d.countBy === true; })[0].key;
					}

					// For short version
					scope.shortVersion = false;

					scope.$watch('shortVersion', function(s){
						d3.select(element[0]).select('svg').style('margin-top', function(){ return s ? '-133px' : ''; });
					});

					// Mode selection
					scope.modes = [ { "id": 'stack', "name": 'Stack' }, { "id": 'multiple', "name": 'Multiple' } ];
					scope.mode = 'stack';

					// Title/description is used for selection display and is based on the dimension.
					var matchDateDim = scope.dateDims.filter( function (d) { return d.key == scope.dateProp.key; })[0];
					scope.title = matchDateDim ? matchDateDim.description : "Timeline";

					scope.dateDim = scope.xfilter.dimension(dateDimAccessor);
					scope.groupAccessor = function(d) { return d[scope.groupProp.key] + ""; };

					scope.extentOverride = { start: null, end: null };

					scope.zoomToFilter = function () {
						scope.$broadcast('zoomToFilter');
					};

					scope.showDateModal = function () { $('#' + scope.uniqueModalId).find('#date-modal').modal('show'); };
					scope.showGroupModal = function () { $('#' + scope.uniqueModalId).find('#group-modal').modal('show'); };
					scope.showAggModal = function () { $('#' + scope.uniqueModalId).find('#agg-modal').modal('show'); };

					scope.filterReset = function () {
						scope.$broadcast('filterReset');
						scope.$broadcast('zoomToFilter');
					};

					// Clean up after ourselves. Remove dimensions that we have created. If we
					// created watches on another scope, destroy those as well.
					var destroyed = false;
					scope.$on('$destroy', function () {

						scope.$broadcast('filterReset');
						scope.dateDim.filterAll();
						scope.extentOverride = { start: null, end: null };
						scope.dateDim.remove();

						deregister.forEach(function (f) { f(); });

						destroyed = true;

						// Get rid of the modal.
						$('#' + scope.uniqueModalId).remove();
					});

					// Watch for filter changes and record them.

					scope.$on('updateFilter', function(event, args) {
						scope.filter = args;

						if(!args[1]) {
							scope.filter = null;
						}
					});

					scope.$on('expandFilters', function(event) {
						if($(element).find(".accordion-toggle").hasClass("collapsed")) {
							$(element).find(".accordion-toggle").click();
							scope.collapse = false;
						}
					});

					scope.$on('collapseFilters', function(event) {
						if(!$(element).find(".accordion-toggle").hasClass("collapsed")) {
							$(element).find(".accordion-toggle").click();
							scope.collapse = true;
						}
					});

					// State save/load.

					var currentFilter = [];
					scope.setFilter = function (extent) {
						currentFilter = extent;
					};

					// Placeholder
					scope.getFilter = function (extent) { };

					var importState = function(state) {
						scope.dateProp = scope.dateDims.filter(function(d) { return d.key === state.dateProp; })[0];
						scope.$digest();
						// Now aggDim, but we let it remain countDim in the save file for backward compatible.
						if(state.countDim) scope.countDim = scope.aggDims.filter(function(d) { return d.key === state.countDim; })[0];
						if(state.aggDimKey) scope.aggDim = scope.aggDims.filter(function(f) { return f.key === state.aggDimKey; })[0];
						
						scope.$digest();
						scope.groupProp = scope.groupDims.filter(function(d) { return d.key === state.groupProp; })[0];
						scope.$digest();
						scope.shortVersion = state.shortVersion;

						// Manually digest here, or some of the above can trigger filter-clears
						// before the getFilter processing is complete.
						scope.$digest();

						if(state.extent) {
							scope.getFilter(state.extent);
							scope.$digest();
						}
					};

					var exportState = function() {
						return destroyed ? false : {
							countDim: scope.aggDim.key,
							dateProp: scope.dateProp.key,
							groupProp: scope.groupProp.key,
							shortVersion: scope.shortVersion,
							extent: currentFilter,
							aggDimKey: scope.aggDim.key
						};
					};

					deregister.push(palladioService.registerStateFunctions(scope.uniqueToggleId, 'timeline', exportState, importState));

				}, post: function(scope, element, attrs) {

					$(element).find('.toggle').on("click", function() {
						$(element).find('.settings-panel').toggle(0, function() {
							$(element).find('.view').toggleClass('span12');
							$(element).find('.view').toggleClass('span9');
						});
					});

					// Move the modal out of the fixed area.
					$(element[0]).find('#date-modal').parent().appendTo('body');
				}
			}
		};

		return directiveObj;
	}]);