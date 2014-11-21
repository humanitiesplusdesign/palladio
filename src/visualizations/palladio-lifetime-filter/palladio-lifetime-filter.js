// Lifetime filter module

angular.module('palladioLifetimeFilter', [])
	.directive('palladioLifetimeFilter', function () {
		var filterColor = "#dddddd";

		var directiveDefObj = {
			scope: {
				rangeDimension: '=',
				groupAccessor: '=',
				type: '@',
				uniqueDimension: '@countBy',
				title: '@',
				width: '@',
				height: '@',
				mode: '@'
			},
			link: function (scope, element, attrs) {

				///////////////////////////////////////////////////////////////////////
				//
				// If optional attributes aren't provided, define default values.
				//
				///////////////////////////////////////////////////////////////////////

				var width = scope.width ? +scope.width : 400;
				var height = scope.height ? +scope.height : 100;
				var mode = scope.mode ? scope.mode : 'stack';
				var groupAccessor = scope.groupAccessor ? scope.groupAccessor : function(d) { return "Default group"; };
				var type = scope.type ? scope.type : 'numeric';
				var ra = scope.rangeDimension.accessor;
				var uniqueDimension = scope.uniqueDimension === "" ? undefined : scope.uniqueDimension;
				var identifier = scope.title + Math.floor(Math.random() * 10000);

				///////////////////////////////////////////////////////////////////////
				//
				// Watch for Palladio events that we need to respond to.
				//
				///////////////////////////////////////////////////////////////////////

				scope.$on('update', function(event) {
					sel.call(updateTimeline);
				});

				scope.$on('filterReset', function(event) {
					filterReset();
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
				// 	scope.$apply(function (scope) { scope.mode = 'multiple'; });
				// }, 10000);

				// window.setTimeout(function() {
				// 	scope.$apply(function (scope) { scope.mode = 'stack'; });
				// }, 15000);

				scope.$watch('title', function(nv, ov) {
					if(nv !== ov) {
						title = scope.title;
						titleSetup();
					}
				});

				// Test title changes.
				// window.setTimeout(function() {
				// 	scope.$apply(function (scope) { scope.title = 'Testing Testing'; });
				// }, 10000);
				// window.setTimeout(function() {
				// 	scope.$apply(function (scope) { scope.title = undefined; });
				// }, 15000);

				scope.$watch('uniqueDimension', function(nv, ov) {
					if(nv !== ov) {
						buildGroupings();
						sel.call(updateTimeline);
					}
				});

				// Test unique dimension changes.
				// window.setTimeout(function() {
				// 	scope.$apply(function (scope) { scope.uniqueDimension = 'Birth Year'; });
				// }, 10000);
				// window.setTimeout(function() {
				// 	scope.$apply(function (scope) { scope.uniqueDimension = 'People ID'; });
				// }, 20000);

				scope.$watch('rangeDimension', function(nv, ov) {
					if(nv !== ov) {

						// If you change the type, you must have changed the dimension, so we
						// handle type changes here.
						type = scope.type ? scope.type : 'numeric';

						// If the existing brush extent is non-zero, clear the existing
						// filter on the old dimension ('ov') and trigger the necessary events.
						if(brush && brush.extent()[1] - brush.extent()[0] !== 0) {
							ov.filterAll();

							// If title has already changed, then we have a problem. Need to use a 
							// unique and static identifier...
							scope.$emit('updateFilter', [identifier, null]);
							scope.$emit('triggerUpdate');
						}

						setup();
						sel.call(initializeTimeline);
						sel.call(updateTimeline);
					}
				});

				scope.$watch('groupAccessor', function(nv, ov) {
					if(nv !== ov) {

						groupAccessor = scope.groupAccessor ? scope.groupAccessor : function(d) { return "Default group"; };

						setup();
						sel.call(initializeTimeline);
						sel.call(updateTimeline);
					}
				});

				///////////////////////////////////////////////////////////////////////
				//
				// Set up variables global to the timeline.
				//
				///////////////////////////////////////////////////////////////////////

				var format, dimFormat, stackGroups, tempDate, yr, g, groups, x, lowestTime,
						highestTime, gl, gh, brush, margin, localHeight, localWidth, color,
						y0, y1, stack, area, xAxis, yAxis, sel;

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

					var g = selection.select("svg").select("g");

					if(g.empty()) {
						g = selection.append("svg")
								.attr("height", localHeight)
								.attr("width", localWidth)
							.append("g")
								.attr("transform", "translate(" + margin + ", " + margin + ")");
					}

					var z = d3.behavior.zoom();
					z.x(x);
					z.scaleExtent([1,Infinity]);
					z.on("zoom", zoom);

					g.call(z);

					var group = g.selectAll(".group")
							.data(timelineGroups);

					group.exit().remove();

					var newGroups = group.enter()
							.append("g")
								.attr("class", "group");

					newGroups.append("path")
							.attr("class", "area");

					group.style("fill", function(d) { return color(d[0].i); });

					if(!g.select("g.x-axis").empty()) {
						g.select("g.x-axis").remove();
					}

					g.append("g")
							.attr("class", "axis x-axis")
							.attr("transform", "translate(0," + (height) + ")")
							.call(xAxis);

					brush.on("brushstart", function() {
						d3.event.sourceEvent.stopPropagation();
					});

					brush.on("brushend", function() {
						var filterBottom = dimFormat(brush.extent()[0]),
								filterTop = dimFormat(brush.extent()[1]);

						if (brush.empty()) {
							scope.rangeDimension.filterAll();
							scope.$emit('updateFilter', [identifier, null]);
						} else {
							scope.rangeDimension.filter(function(d) { return d[0] <= filterTop && d[1] >= filterBottom; });
							var filterText = "" + filterBottom + " - " + filterTop + "";
							scope.$emit('updateFilter', [identifier, scope.title, filterText, filterReset]);
						}

						scope.$emit('triggerUpdate');
					});

					var gBrush = g.append("g").attr("class", "brush")
												.call(brush);

					gBrush.selectAll("rect").attr("height", height);
					gBrush.select(".extent").attr("fill", filterColor)
						.attr("fill-opacity", ".500");
					gBrush.selectAll(".resize").append("path")
						.attr("d", resizePath);

					function resizePath(d) {
						var e = +(d == "e"), x = e ? 1 : -1, y = (height+7)/3;
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

				}

				///////////////////////////////////////////////////////////////////////
				//
				// Update timeline. Assumes the only things that have changed are
				// CrossFilter filters, y-/x-scales, or the 'mode' parameter.
				//
				///////////////////////////////////////////////////////////////////////

				function updateTimeline(selection) {

					var timelineGroups = buildTimelineGroups(groups);
					var g = selection.select("svg").select("g");

					// Reset the y1 domain based on the current biggest group.
					y1.domain([0, d3.max(groups, function(d) { return d.value.count; })]);

					yAxis.scale(y1);

					stack(timelineGroups);

					var group = g.selectAll(".group")
							.data(timelineGroups);

					if(mode === 'stack') {
						if(!g.select('.y-axis').empty()) {
							g.select('.y-axis').call(yAxis);
						} else {
							g.append("g")
								.attr("class", "axis y-axis")
								.attr("transform", "translate(" + (width - margin) + ", 0)")
								.call(yAxis);
						}
					} else {
						if(!g.select('.y-axis').empty()) {
							g.select('.y-axis').remove();
						}
					}

					group.transition()
						.attr("transform", function(d, i) {
							if(mode === 'stack') {
								return "translate(0,0)";
							} else {
								return "translate(0," + y0(stackGroups[i]) + ")";
							}
						});

					var paths = group.select("path");

					paths.attr("d", function(d) { return area(d); });
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Fill in missing groupings
				//
				///////////////////////////////////////////////////////////////////////

				function buildTimelineGroups(groups) {
					return stackGroups.map(function(d, i) {
						return groups.map( function(g) {
							return { "x": format.parse(g.key), "y": g.value.countByGroup.get(d), "i": i };
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
							// Right now we are going to hold off on re-building the groups because it takes
							// too long, freezing the UI.

							// buildGroupings();
						}

						domainBot = dimFormat.parse((x.domain()[0].getFullYear() - 1) + "-" + (x.domain()[0].getMonth() + 1) + "-" + x.domain()[0].getDate());
						domainTop = dimFormat.parse((x.domain()[1].getFullYear() + 1) + "-" + (x.domain()[1].getMonth() + 1) + "-" + x.domain()[1].getDate());

						groups = g.value().entries().filter(function(g) {
							if(format.parse(g.key) &&
									((format.parse(g.key)) >= domainBot) &&
									((format.parse(g.key)) <= domainTop)) {
								return true;
							} else { return false; }
						});
					}


					xAxis.scale(x);
					brush.x(x);
					tempExtent = brush.extent();
					brush.empty();
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
						y1.domain([0, d3.max(groups, function(d) { return d.value.count; })])
								.range([height, 0]);
						area.y0(function (d) { return y1(d.valueOffset); });
						area.y1(function (d) { return y1(d.y) - (y1.range()[0] - y1(d.valueOffset)); });
					} else {
						y1.domain([0, d3.max(groups, function(d) { return d.value.count; })])
								.range([y0.rangeBand(), 0]);
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
						sel.select("span.list-title").text(scope.title);
					} else {
						sel.select("span.list-title").text(null);
					}
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Build/rebuild our groupings. Normally happens as part of our setup()
				// but sometimes (e.g. during zooming) this is required outside the
				// normal setup lifecycle.
				//
				///////////////////////////////////////////////////////////////////////

				function buildGroupings() {

					if(type != 'numeric') {

						// If we have a Date-type dimension, then make sure we don't have a ridiculous number
						// of groups by grouping at the date, then month, then year level.
						if(!x) {
							// If the x-scale hasn't been defined yet, we do this the hard way.

							// Calculate the range of years we are dealing with.
							gl = scope.rangeDimension.group(function(d) { return d[0]; });
							gh = scope.rangeDimension.group(function(d) { return d[1]; });

							if(type !== 'numeric') {
								lt = format.parse(d3.min(gl.all().filter(function(g) { return format.parse(g.key); }), function(d) { return d.key; }));
								ht = format.parse(d3.max(gh.all().filter(function(g) { return format.parse(g.key); }), function(d) { return d.key; }));
								yr = ht.getFullYear() - lt.getFullYear();
							}

							gl.remove();
							gh.remove();
						} else {
							yr = x.domain()[1].getFullYear() - x.domain()[0].getFullYear();
						}

						// If we are showing more than 2 years, we can't get down to a day-level granularity.
						if(yr <= 1) {
							format = d3.time.format("%Y-%m-%d");
						} else {
							if(yr > 1 ) {
								format = d3.time.format("%Y-%m");

								// If we are showing more than 30 years, we can't get down to a month-level granularity.
								if(yr > 30) {
									format = d3.time.format("%Y");
								}
							}
						}
					}

					// Build our groups based on the chosen date granularity.

					g = scope.rangeDimension.groupAll();

					// If uniqueDimension is defined, use it for counting.
					if(uniqueDimension !== undefined) {
						g.reduce(reduceAdd, reduceRemove, reduceInitial);
					} else {
					// Otherwise, use default counting.
						g.reduce(defaultReduceAdd, defaultReduceRemove, defaultReduceInitial);
					}

					if(groups !== null) {
						groups.remove();
					}

					groups = g.value().entries().filter(function(g) { return format.parse(g.key); });
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Setup the timeline environment.
				//
				///////////////////////////////////////////////////////////////////////

				function setup() {

					// Set up our formatter. If the type of the timeline is numeric, then it's just the
					// identity. Otherwise it will parse and stringify dates based on the format string
					// defined in the 'type' attribute of the directive.
					format = null;
					dimFormat = null;
					if(type !== 'numeric') {
						format = d3.time.format("%Y-%m-%d");
						dimFormat = d3.time.format("%Y-%m-%d");
					} else {
						format = function (d) { return d; };
						format.parse = function(d) { return d; };
						dimFormat = format;
					}

					// Calculate groups for stacking/multiples.

					stackGroups = d3.map();

					scope.rangeDimension.top(Infinity).forEach(function(d) {
						if(!stackGroups.has(groupAccessor(d))) {
							stackGroups.set(groupAccessor(d), 0);
						}
					});

					stackGroups = stackGroups.keys().sort();

					yr = 0;
					g = null;

					groups = null;
					x = null;

					lowestTime = null;
					highestTime = null;

					if(type !== 'numeric') {
						// Calculate the range of years we are dealing with.

						gl = scope.rangeDimension.group(function(d) { return d[0]; });
						gh = scope.rangeDimension.group(function(d) { return d[1]; });

						lowestTime = format.parse(d3.min(gl.all().filter(function(g) { return format.parse(g.key); }), function(d) { return d.key; }));
						highestTime = format.parse(d3.max(gh.all().filter(function(g) { return format.parse(g.key); }), function(d) { return d.key; }));

						gl.remove();
						gh.remove();
					} else {
						lowestTime = format.parse(d3.min(groups, function(d) { return d.key; })),
						highestTime = format.parse(d3.max(groups, function(d) { return d.key; }));
					}

					buildGroupings();

					// Set up values.

					// Brush we will use later (we need to define it here so we can clear it).
					brush = d3.svg.brush();
					margin = 20;
					localHeight = height + (2 * margin);
					localWidth = width + (2 * margin);
					color = d3.scale.ordinal().domain([0,8]).range(colorbrewer.Greys[9]);

					y0 = d3.scale.ordinal()
							.rangeRoundBands([0, height], 0);
					y0.domain(stackGroups);

					y1 = d3.scale.linear();

					stack = d3.layout.stack()
							.out(function(d, dy) { d.valueOffset = dy; });

					area = d3.svg.area()
							.x(function (d) { return x(d.x); })
							.interpolate("step-after");

					modeSetup();

					if(type !== 'numeric') {
						x = d3.time.scale().range([0, (width - margin)])
									.domain([lowestTime, highestTime]);
					} else {
						x = d3.scale.linear().range([0, (width - margin)])
									.domain([lowestTime, highestTime]);
					}

					x.clamp(true);

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

					// D3.js selection for the directive element.
					sel = d3.select(element[0]);

					sel.attr("height", localHeight);
					sel.attr("width", localWidth);

					// Set the data.
					sel.datum(g);

					// Set up the title place-holder if it isn't already there.
					if(sel.select("span.list-title").empty()) {
						sel.append("span")
								.attr("class", "list-title");
					}

					titleSetup();
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Reset filters.
				//
				///////////////////////////////////////////////////////////////////////

				function filterReset() {
					scope.rangeDimension.filterAll();
					brush.clear();
					d3.select(element[0]).select(".extent").attr("width", 0);
					d3.select(element[0]).selectAll(".resize").style("display", "none");
					scope.$emit("updateFilter", [identifier, null]);
					scope.$emit("triggerUpdate");
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Increment function is used in reducers to come up with the next
				// in a sequence of dates or numbers.
				//
				///////////////////////////////////////////////////////////////////////

				function inc(d) {
					if(type !== 'numeric') {
						tempDate = format.parse(d);
						if(format.toString().length === 8) {
							// Day-based
							return format(format.parse(tempDate.getFullYear() + "-" + (tempDate.getMonth() + 1) + "-" + (tempDate.getDate() + 1)));
						} else {
							if(format.toString().length === 5) {
								// Month-based
								return format(format.parse(tempDate.getFullYear() + "-" + (tempDate.getMonth() + 2)));
							} else {
								// Year-based
								return format(format.parse("" + (tempDate.getFullYear() + 1)));
							}
						}
					} else {
						return k + 1;
					}
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Reduce functions that don't double-count by using add/reduce based 
				// on unique dimension if defined.
				//
				// countByGroup property aggregates counts broken out by the grouping 
				// defined by the group-accessor attribute.
				//
				///////////////////////////////////////////////////////////////////////

				var internalCount;
				var uniq;
				var k;
				var l;
				var m;
				var n;
				var o;

				function reduceAdd(p, v) {
					if(dimFormat.parse(ra(v)[0]) && dimFormat.parse(ra(v)[1]) && ra(v)[0] < ra(v)[1]) {

						k = format(dimFormat.parse(ra(v)[0]));
						l = format(dimFormat.parse(ra(v)[1]));
						m = groupAccessor(v);
						uniq = v[uniqueDimension];
						o = p.get(k);

						if(o) {
							while(k <= l) {
								n = o.unique.get(uniq);
								if(n) {
									o.unique.set(uniq, n+1);
								} else {
									o.unique.set(uniq, 1);
									o.count++;
									o.countByGroup.set(m, o.countByGroup.get(m) + 1);
								}

								k = o.next;
								o = o.nexto;
							}
						}
					}

					return p;
				}

				function reduceRemove(p, v) {
					if(dimFormat.parse(ra(v)[0]) && dimFormat.parse(ra(v)[1]) && ra(v)[0] < ra(v)[1]) {

						k = format(dimFormat.parse(ra(v)[0]));
						l = format(dimFormat.parse(ra(v)[1]));
						m = groupAccessor(v);
						uniq = v[uniqueDimension];
						o = p.get(k);

						if(o) {
							while(k <= l) {
								n = o.unique.get(uniq);
								if(n) {
									if(n == 1) {
										o.unique.remove(uniq);
										o.count--;
										o.countByGroup.set(m, o.countByGroup.get(m) - 1);
									} else {
										o.unique.set(uniq, n - 1);
									}
								}

								k = o.next;
								o = o.nexto;
							}
						}
					}

					return p;
				}

				function reduceInitial() {
					var bottomVals = scope.rangeDimension.top(Infinity).map(function (d) {
						if(dimFormat.parse(ra(d)[0]) && dimFormat.parse(ra(d)[1]) && ra(d)[0] < ra(d)[1]) {
							return ra(d)[0];
						} else { return null; }
					});

					var topVals = scope.rangeDimension.top(Infinity).map(function (d) {
						if(dimFormat.parse(ra(d)[0]) && dimFormat.parse(ra(d)[1]) && ra(d)[0] < ra(d)[1]) {
							return ra(d)[1];
						} else { return null; }
					});

					var localLow = format(dimFormat.parse(d3.min(bottomVals.filter(function (d) { return d; }))));
					var localHigh = format(dimFormat.parse(d3.max(topVals.filter(function (d) { return d; }))));

					var p = d3.map();
					var obj;

					while(localLow <= localHigh) {
						// Unfortunately jQuery's deep copy via the extend() method doesn't seem to 
						// properly deep-copy d3.map() objects. So we need to create it anew each
						// time.
						obj = {unique: d3.map(), count: 0, countByGroup: d3.map(), next: inc(localLow) };

						// Populate the group hash (see below for setGroups() definition).
						stackGroups.forEach(setGroups);

						p.set(localLow, obj);
						localLow = obj.next;
					}

					p.values().forEach(function(d) {
						d.nexto = p.get(d.next);
					});

					function setGroups (d) {
						if(!obj.countByGroup.has(d)) {
							obj.countByGroup.set(d, 0);
						}
					}

					return p;
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Reduce functions that just count normally, without worrying about
				// duplicate values.
				//
				///////////////////////////////////////////////////////////////////////

				function defaultReduceAdd(p, v) {

					if(dimFormat.parse(ra(v)[0]) && dimFormat.parse(ra(v)[1]) && ra(v)[0] < ra(v)[1]) {

						k = format(dimFormat.parse(ra(v)[0]));
						l = format(dimFormat.parse(ra(v)[1]));

						while(k <= l) {
							o = p.get(k);
							o.count++;
							o.countByGroup.set(groupAccessor(v), o.countByGroup.get(groupAccessor(v)) + 1);

							k = o.next;
						}
					}

					return p;
				}

				function defaultReduceRemove(p, v) {

					if(dimFormat.parse(ra(v)[0]) && dimFormat.parse(ra(v)[1]) && ra(v)[0] < ra(v)[1]) {

						k = format(dimFormat.parse(ra(v)[0]));
						l = format(dimFormat.parse(ra(v)[1]));

						while(k <= l) {
							o = p.get(k);
							o.count--;
							o.countByGroup.set(groupAccessor(v), o.countByGroup.get(groupAccessor(v)) - 1);

							k = o.next;
						}
					}

					return p;
				}

				function defaultReduceInitial() {
					var bottomVals = scope.rangeDimension.top(Infinity).map(function (d) {
						if(dimFormat.parse(ra(d)[0]) && dimFormat.parse(ra(d)[1]) && ra(d)[0] < ra(d)[1]) {
							return ra(d)[0];
						} else { return null; }
					});

					var topVals = scope.rangeDimension.top(Infinity).map(function (d) {
						if(dimFormat.parse(ra(d)[0]) && dimFormat.parse(ra(d)[1]) && ra(d)[0] < ra(d)[1]) {
							return ra(d)[1];
						} else { return null; }
					});

					var localLow = format(dimFormat.parse(d3.min(bottomVals)));
					var localHigh = format(dimFormat.parse(d3.max(topVals)));

					var p = d3.map();

					while(localLow <= localHigh) {
						// Unfortunately jQuery's deep copy via the extend() method doesn't seem to 
						// properly deep-copy d3.map() objects. So we need to create it anew each
						// time.
						var obj = {count: 0, countByGroup: d3.map(), next: inc(localLow) };

						// Populate the group hash (see below for setGroups() definition).
						stackGroups.forEach(setGroups);

						p.set(localLow, obj);
						localLow = obj.next;
					}

					function setGroups (d) {
						if(!obj.countByGroup.has(d)) {
							obj.countByGroup.set(d, 0);
						}
					}

					return p;
				}
			}
		};

		return directiveDefObj;
	})
	.directive('palladioLifetimeFilterWithSettings', function () {
		var directiveObj = {
			scope: true,
			template: '<div class="accordion-heading">' +
						'<i class="icon-remove-sign close-button" data-ng-click="removeFilter($event)"></i>' +
						'<a class="accordion-toggle" data-toggle="collapse" data-ng-click="collapse=!collapse" data-ng-init="collapse=false" data-parent="#filters" href="{{uniqueToggleHref}}" target="_self">' +
							'<i data-ng-show="collapse" class="icon-chevron-right"></i>' +
							'<i data-ng-show="!collapse" class="icon-chevron-down"></i>' +
						'</a>' +
						'<input type="text" class="editable span12" data-ng-model="title"></input>' +
						'<span data-ng-show="collapse">' +
							'<span data-ng-show="filter" class="selection-pill">' +
								'<span class="selection-label">{{filter[1]}}:&nbsp;</span>' +
								'<span class="selection-text">{{filter[2]}}</span>' +
								'<a data-ng-click="filter[3]()">' +
									'<i class="icon-remove-sign"></i>' +
								'</a>' +
							'</span>' +
						'</span>' +
					'</div>' +
					'<div id="{{uniqueToggleId}}" class="row-fluid accordion-body collapse in component">' +
						'<!-- Settings -->' +
						'<div class="span2 settings-panel"> ' +
							'<div class="row-fluid">' +
								'<div class="setting"> ' +
									'<label>Start Date</label> ' +
									'<select selectpicker class="span12" ng-model="startDateProp" ng-options="value.id as value.name for value in dateSelects" bs-select> ' +
									'</select> ' +
								'</div> ' +
								'<div class="setting"> ' +
									'<label>End Date</label> ' +
									'<select selectpicker class="span12" ng-model="endDateProp" ng-options="value.id as value.name for value in dateSelects" bs-select> ' +
									'</select> ' +
								'</div> ' +
								'<div class="setting"> ' +
									'<label>Group by</label> ' +
									'<select selectpicker class="span12" ng-model="groupProp" ng-options="value.id as value.name for value in groupSelects" bs-select> ' +
									'</select> ' +
								'</div> ' +
								'<div class="setting"> ' +
									'<label>Mode</label> ' +
									'<select selectpicker class="span12" ng-model="mode" ng-options="value.id as value.name for value in modes" bs-select> ' +
									'</select> ' +
								'</div>' +
							'</div>' +
						'</div>' +
						'<!-- View -->' +
						'<div class="span10 view">' +
							'<a class="toggle" class="close"><i class="icon-arrow-left"></i></a>' +
							'<div data-palladio-lifetime-filter ' +
								'range-dimension="rangeDim" ' +
								'group-accessor="groupAccessor" ' +
								'type="date" ' +
								'title={{title}} ' +
								'height="200" ' +
								'mode={{mode}} ' +
								'count-by={{uniqueKey}} ' +
								'width="900">' +
							'</div>' +
						'</div> ' +
					'</div>' +
					'<div class="clearfix"></div>',

			link: { pre: function(scope, element, attrs) {

					// In the pre-linking function we can use scope.data, scope.metadata, and
					// scope.xfilter to populate any additional scope values required by the
					// template.

					// The parent scope must include the following:
					//   scope.xfilter
					//   scope.metadata

					scope.uniqueToggleId = "timespanFilter" + Math.floor(Math.random() * 10000);
					scope.uniqueToggleHref = "#" + scope.uniqueToggleId;

					// Set up date selection.

					var dateDims = scope.metadata.filter(function (d) { return d.type === 'date'; });
					scope.dateSelects = dateDims.map(function (d) {
						return { "id": d.key, "name": d.description };
					});

					scope.startDateProp = dateDims[0].key;
					scope.endDateProp = dateDims[1].key;
					setTitle();

					scope.$watch('startDateProp', function(nv, ov) {
						// Avoid switching the dateDim before the directive is prepared.
						if(nv !== ov) {
							setRangeDim();
						}
					});

					scope.$watch('endDateProp', function(nv, ov) {
						// Avoid switching the dateDim before the directive is prepared.
						if(nv !== ov) {
							setRangeDim();
						}
					});

					function setRangeDim() {
						scope.rangeDim = scope.xfilter.dimension(function (d) { return [d[scope.startDateProp], d[scope.endDateProp]]; });
						setTitle();
					}

					function setTitle() {
						scope.title = dateDims.filter( function (d) { return d.key == scope.startDateProp; })[0].description +
								'/' + dateDims.filter( function (d) { return d.key == scope.endDateProp; })[0].description;
					}

					// Set up group selection.
					var groupDims = scope.metadata.filter(function (d) { return d.cardinality < 11; });
					scope.groupSelects = groupDims.map(function (d) {
						return { "id": d.key, "name": d.description };
					});
					scope.groupProp = groupDims[0].key;
					scope.$watch('groupProp', function() {
						scope.groupAccessor = function(d) { return d[scope.groupProp]; };
					});

					// There can be only one unique key, so no selection for this one.
					if(scope.metadata.filter(function (d) { return d.uniqueKey === true; })[0]) {
						scope.uniqueKey = scope.metadata.filter(function (d) { return d.uniqueKey === true; })[0].key;
					}

					// Mode selection
					scope.modes = [ { "id": 'stack', "name": 'Stack' }, { "id": 'multiple', "name": 'Multiple' } ];
					scope.mode = 'stack';

					// Title/description is used for selection display and is based on the dimension.
					setTitle();
					setRangeDim();
					scope.groupAccessor = function(d) { return d[scope.groupProp]; };

					// Clean up after ourselves. Remove dimensions that we have created. If we
					// created watches on another scope, destroy those as well.
					scope.$on('$destroy', function () {
						if(scope.rangeDim) {
							scope.rangeDim.filterAll();
							scope.rangeDim.remove();
						}
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

				}, post: function(scope, element, attrs) {

					$(element).find('.toggle').on("click", function() {
						$(element).find('a.toggle i').toggleClass('icon-edit icon-arrow-left');
						$(element).find('.settings-panel').toggle(0, function() {
							$(element).find('.view').toggleClass('span12');
							$(element).find('.view').toggleClass('span10');
						});
					});
				}
			}
		};

		return directiveObj;
	});