// Timeline filter module

angular.module('palladioArctimeFilter', [])
	.directive('palladioArctimeFilter', function () {
		var filterColor = "#aaaaaa";

		var directiveDefObj = {
			scope: {
				rangeDimension: '=',
				groupAccessor: '=',
				type: '@',   // Can be 'numeric' or 'date'. Date format is YYYY-mm-dd
				uniqueDimension: '@countBy',
				title: '@',
				width: '@',
				height: '@',
				extentOverride: '='
			},
			link: function (scope, element, attrs) {

				if(scope.rangeDimension.top(1).length === 0) {
					throw "No date range dimension defined.";
				}

				///////////////////////////////////////////////////////////////////////
				//
				// If optional attributes aren't provided, define default values.
				//
				///////////////////////////////////////////////////////////////////////

				var width = scope.width ? +scope.width : 400;
				var height = scope.height ? +scope.height : 100;
				var type = scope.type ? scope.type : 'numeric';
				var groupAccessor = scope.groupAccessor ? scope.groupAccessor : function(d) { return "Default group"; };
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

				scope.$watch('title', function(nv, ov) {
					// If the title changes, do *not* change the identifier.
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

				scope.$watch('uniqueDimension', function(nv, ov) {
					if(nv !== ov) {
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

				scope.$watch('rangeDimension', function(nv, ov) {
					if(nv !== ov) {

						// If you change the type, you must have changed the dimension, so we
						// handle type changes here.
						type = scope.type ? scope.type : 'numeric';

						setup();
						sel.call(initializeTimeline);
						sel.call(updateTimeline);
					}
				});

				scope.$watch('groupAccessor', function(nv, ov) {
					if(nv !== ov) {
						var tempExtent;

						groupAccessor = scope.groupAccessor ? scope.groupAccessor : function(d) { return "Default group"; };

						setup();
						sel.call(initializeTimeline);
						sel.call(updateTimeline);
					}
				});

				scope.$watchCollection('extentOverride', function(nv, ov) {
					if(nv !== ov) {

						var od = x.domain();

						if(nv[0]) {
							x.domain([nv[0], x.domain()[1]]);
						} else { x.domain([lowestTime, x.domain()[1]]); }
						if(nv[1]) {
							x.domain([x.domain()[0], nv[1]]);
						} else { x.domain([x.domain()[0], highestTime]); }

						// Update the zoom.
						z.x(x);
						z.event(d3.select(element[0]).select("svg").select("g"));
					}
				});

				///////////////////////////////////////////////////////////////////////
				//
				// Set up variables global to the timeline.
				//
				///////////////////////////////////////////////////////////////////////

				var format, dimFormat, stackGroups, g, yr, brush,
						x, groups, lowestTime, highestTime, y1, stack, xAxis, yAxis,
						area, sel, z, widthScale, tooltip,
						hMargin, vMargin, yAxisWidth, xAxisHeight, mainHeight, mainWidth,
						brushHeight, selections;

				///////////////////////////////////////////////////////////////////////
				//
				// Reduce functions that don't double-count by using add/reduce based 
				// on unique dimension if defined.
				//
				///////////////////////////////////////////////////////////////////////

				var reduceAdd = crossfilterHelpers.countByDimension(function (v) { return v[uniqueDimension]; }).add;
				var reduceRemove = crossfilterHelpers.countByDimension(function (v) { return v[uniqueDimension]; }).remove;
				var reduceInitial = crossfilterHelpers.countByDimension(function (v) { return v[uniqueDimension]; }).init;

				function orderValue(p) {
					return p.count;
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Reduce functions that just count normally, without worrying about
				// duplicate values.
				//
				///////////////////////////////////////////////////////////////////////

				function defaultReduceAdd(p, v) { ++p.count; return p; }
				function defaultReduceRemove(p, v) { --p.count; return p; }
				function defaultReduceIntial() { return { count: 0 }; }



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

					var g = selection.select("svg").select("g");

					tooltip = g.select(".timeline-tooltip");

					if(g.empty()) {
						g = selection.append("svg")
								.attr("height", height)
								.attr("width", width)
							.append("g")
								.attr("transform", "translate(" + hMargin + ", " + vMargin + ")");

						// Set up transparent background rectable to catch zoom events.
						g.append("rect")
							.attr("height", height - vMargin*2)
							.attr("width", width - hMargin*2)
							.attr("fill", "rgba(0, 0, 0, 0)");
					}

					g.data(groups);

					z = d3.behavior.zoom();
					z.x(x);
					z.scaleExtent([1, Infinity]);
					z.on("zoom", zoom);

					g.call(z);

					if(!g.select("g.x-axis").empty()) {
						g.select("g.x-axis").remove();
					}

					g.append("g")
							.attr("class", "axis x-axis")
							.attr("transform", "translate(0," + mainHeight + ")")
							.call(xAxis);

					if(tooltip.empty()) {
						setupTooltip();
					}
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Update timeline. Assumes the only things that have changed are
				// CrossFilter filters, y-/x-scales, or the 'mode' parameter.
				//
				///////////////////////////////////////////////////////////////////////

				function updateTimeline(selection) {

					var g = selection.select("svg").select("g");
					var line = d3.svg.line().interpolate("cardinal").tension(0);

					// Reset the y1 and widthScale domains based on the current biggest group.
					y1.domain([0, d3.max(groups, function(d) { return d.value.count; })]);
					widthScale.domain([0, d3.max(groups, function(d) { return d.value.count; })]);

					buildGroupings();

					var lineGroups = groups.map(function (d) {
						var lt = +format.parse(d.key[0]),
							ht = +format.parse(d.key[1]),
							mt = (ht + lt)/2;

						return { d: [[x(lt), y1.range()[0]],
									[x(mt), y1.range()[1]],
									[x(ht), y1.range()[0]]],
								w: widthScale(d.value.count),
								key: d.key
							};
					});

					yAxis.scale(y1);

					var lines = g.selectAll(".arc").data(lineGroups, function(d) { return d.d[0][0] + "-" + d.d[2][0]; });

					// Remove the tooltip because new paths will be on top of it.
					tooltip.remove();

					lines.enter()
						.append("path")
							.attr("d", function (d) { return line(d.d); })
							.attr("class", "arc")
							.classed("selected", testSelection)
							.on("mouseover", function (d) {
								d3.select(this).classed("selected", true);
								d3.select(tooltip[0][0].children[0].children[0].children[0]).text(d.key[0] + " - " + d.key[1]);
								tooltip.attr("transform", "translate(" + d3.mouse(g[0][0])[0] + ", " + d3.mouse(g[0][0])[1] + ")");
								tooltip.style("display", "block");
							})
							.on("mouseout", function (d) {
								d3.select(this).classed("selected", testSelection);
								tooltip.style("display", "none");
							})
							.on("click", function (d) {
								if(testSelection(d)) {
									selections = selections.filter( function (s) {
										return s[0] !== d.key[0] || s[1] !== d.key[1];
									});
								} else {
									selections.push(d.key);
								}

								d3.select(this).classed("selected", testSelection);

								if(selections.length === 0) {
									scope.rangeDimension.filterAll();
									scope.$emit('updateFilter', [identifier, null]);
								} else {
									scope.rangeDimension.filter(filterSelection);
									var filterText = selections
											.map(function (s) { return s.join("/"); })
											.join(", ");
									scope.$emit('updateFilter', [identifier, scope.title, filterText, filterReset]);
								}

								scope.$emit('triggerUpdate');
							});

					lines.exit().remove();

					lines.style("stroke-width", function (d) { return d.w; });

					// Add the tooltip again.
					setupTooltip();

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

						domainBot = dimFormat.parse((x.domain()[0].getFullYear() - 1) + "-" + (x.domain()[0].getMonth() + 1) + "-" + x.domain()[0].getDate());
						domainTop = dimFormat.parse((x.domain()[1].getFullYear() + 1) + "-" + (x.domain()[1].getMonth() + 1) + "-" + x.domain()[1].getDate());

						groups = g.all().filter(function(g) {
							return g.key[0] && g.key[1] && format.parse(g.key[0]) && format.parse(g.key[1]) &&
								( format.parse(g.key[0]) <= domainTop &&
								format.parse(g.key[1]) >= domainBot );
						});
					}

					// Fix translation getting stuck near 0.
					if(z.scale() === 1) z.translate([0,0]);

					xAxis.scale(x);

					sel.select("svg").select('.x-axis').call(xAxis);

					sel.call(updateTimeline);
				}

				function testSelection (d) {
					return selections.filter(function (s) {
						return s[0] === d.key[0] && s[1] === d.key[1];
					}).length === 1;
				}

				function filterSelection (d) {
					return selections.filter(function (s) {
						return d[0] && d[1] &&
							s[0] === format(dimFormat.parse(d[0])) &&
							s[1] === format(dimFormat.parse(d[1]));
					}).length === 1;
				}

				function setupTooltip() {
					// Set up the tooltip.
					tooltip = sel.select("svg").select("g").append("g")
							.attr("class", "timeline-tooltip")
							.attr("pointer-events", "none")
							.style("display", "none");

					tooltip.append("foreignObject")
							.attr("width", 150)
							.attr("height", 26)
							.attr("pointer-events", "none")
						.append("xhtml:body")
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
					// identity. Otherwise it will parse and stringify dates based on the format string
					// defined in the 'type' attribute of the directive.
					format = null;
					dimFormat = null;

					selections = [];

					if(type !== 'numeric') {
						format = d3.time.format("%Y-%m-%d");
						dimFormat = d3.time.format("%Y-%m-%d");
					} else {
						format = function (d) { return d; };
						format.parse = function(d) { return d; };
						dimFormat = format;
					}

					// Set up values to calculate the range of years we are dealing with.
					g = null;
					yr = 0;

					hMargin = vMargin = 10;
					xAxisHeight = 20;
					yAxisWidth = 30;
					// Width & height of the main visualization
					mainWidth = width - hMargin*2 - yAxisWidth;
					mainHeight = (height - vMargin*2 - xAxisHeight);

					x = null;

					groups = null;

					buildGroupings();

					lowestTime = format.parse(d3.min(groups, function(d) { return d.key[0]; }));
					highestTime = format.parse(d3.max(groups, function(d) { return d.key[1]; }));

					if(lowestTime instanceof Date) {
						x = d3.time.scale().range([0, mainWidth])
									.domain([lowestTime, highestTime]);
					} else {
						x = d3.scale.linear().range([0, mainWidth])
									.domain([lowestTime, highestTime]);
					}

					y1 = d3.scale.linear()
							.domain([0, d3.max(groups, function(d) { return d.value.count; })])
							.range([mainHeight, 0]);

					widthScale = d3.scale.linear()
							.domain([0, d3.max(groups, function(d) { return d.value.count; })])
							.range([3, 20]);

					xAxis = d3.svg.axis().orient("bottom")
							.scale(x);

					yAxis = d3.svg.axis().orient("right")
							.scale(y1)
							.ticks(10)
							.tickFormat(d3.format("d"));

					// If the type is numeric, suppress commas in the timeline labels.
					if(type === 'numeric') {
						xAxis.tickFormat(d3.format("d"));
					}

					// D3.js selection for the directive element.
					sel = d3.select(element[0]);

					sel.attr("height", height);
					sel.attr("width", width);

					// Set up the title place-holder if it isn't already there.
					if(sel.select("span.list-title").empty()) {
						sel.append("span")
								.attr("class", "list-title");
					}

					titleSetup();
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Build/rebuild our groupings. Normally happens as part of our setup()
				// but sometimes (e.g. during zooming) this is required outside the
				// normal setup lifecycle.
				//
				///////////////////////////////////////////////////////////////////////

				function buildGroupings() {

					var oldFormat = format;

					if(type != 'numeric') {

						// If we have a Date-type dimension, then make sure we don't have a ridiculous number
						// of groups by grouping at the date, then month, then year level.
						if(!x) {
							// If the x-scale hasn't been defined yet, we do this the hard way.
							g = scope.rangeDimension.group();
							var lt = dimFormat.parse(d3.min(g.all().filter(function(g) { return dimFormat.parse(g.key[0]); }), function(d) { return d.key[0]; }));
							var ht = dimFormat.parse(d3.max(g.all().filter(function(g) { return dimFormat.parse(g.key[1]); }), function(d) { return d.key[1]; }));
							yr = ht.getFullYear() - lt.getFullYear();
							g.remove();
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

					// Build our groups based on the chosen date granularity if the granularity changes.
					if(oldFormat.toString() !== format.toString() || !groups) {
						var tempDate1;
						var tempDate2;

						if(g) {
							g.remove();
						}

						g = scope.rangeDimension.group(function (d) {
								if(d[0] && d[1]) {
									tempDate1 = dimFormat.parse(d[0]);
									tempDate2 = dimFormat.parse(d[1]);
								} else { tempDate1 = null; tempDate2 = null; }
								if(tempDate1 !== null && tempDate2 !== null) {
									return [format(tempDate1), format(tempDate2)];
								} else { return ["",""]; }
							});

						// If uniqueDimension is defined, use it for counting.
						if(uniqueDimension !== undefined) {
							console.log(reduceAdd);
							console.log(reduceRemove);
							console.log(reduceInitial);
							console.log(orderValue);
							g.reduce(reduceAdd, reduceRemove, reduceInitial);
							g.order(orderValue);
						} else {
						// Otherwise, use default counting.
							g.reduce(defaultReduceAdd, defaultReduceRemove, defaultReduceIntial);
							g.order(
								function(p) {
									return p.count;
								}
							);
						}

						console.log(g.all());

						groups = g.all().filter(function(g) { return g.key[0] && g.key[1] && format.parse(g.key[0]) && format.parse(g.key[1]) && g.value.count > 0; });
					}				
				}

				///////////////////////////////////////////////////////////////////////
				//
				// Reset filters.
				//
				///////////////////////////////////////////////////////////////////////

				function filterReset() {
					scope.rangeDimension.filterAll();
					selections = [];
					scope.$emit("updateFilter", [identifier, null]);
					scope.$emit("triggerUpdate");
				}
			}
		};

		return directiveDefObj;
	})
	.directive('palladioArctimeFilterWithSettings', function () {
		var directiveObj = {
			scope: true,
			template: '<div class="accordion-heading">' +
						'<i class="icon-remove-sign close-button" data-ng-click="removeFilter($event)"></i>' +
						'<a class="accordion-toggle" data-toggle="collapse" data-ng-click="collapse=!collapse" data-ng-init="collapse=false" data-parent="#filters" href="{{uniqueToggleHref}}" target="_self">' +
							'<i data-ng-show="collapse" class="icon-chevron-right"></i>' +
							'<i data-ng-show="!collapse" class="icon-chevron-down"></i>' +
						'</a>' +
						'<input type="text" class="editable span7" data-ng-model="title"></input>' +
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
									'<span class="field">{{startDateProp.description}}&nbsp;&nbsp;</span>' +
									'<button type="button" ng-click="showStartDateModal()" class="btn dim-selector"><i class="icon-list icon-white"></i></button>' +
								'</div> ' +
								'<div class="setting"> ' +
									'<label>End Date</label> ' +
									'<span class="field">{{endDateProp.description}}&nbsp;&nbsp;</span>' +
									'<button type="button" ng-click="showEndDateModal()" class="btn dim-selector"><i class="icon-list icon-white"></i></button>' +
								'</div> ' +
							'</div>' +
						'</div>' +
						'<!-- View -->' +
						'<div class="span10 view">' +
							'<a class="toggle" class="close"></a>' +
							'<div data-palladio-arctime-filter ' +
								'data-range-dimension="rangeDim" ' +
								'data-type="date" ' +
								'data-title={{title}} ' +
								'data-height="200" ' +
								'data-count-by={{countBy}} ' +
								'data-width="900">' +
							'</div>' +
						'</div> ' +
					'</div>' +
					'<div id={{uniqueModalId}}>' +
						'<div id="start-date-modal" data-modal dimensions="dateDims" model="startDateProp"></div>' +
						'<div id="end-date-modal" data-modal dimensions="dateDims" model="endDateProp"></div>' +
					'</div>',

			link: { pre: function(scope, element, attrs) {

					// In the pre-linking function we can use scope.data, scope.metadata, and
					// scope.xfilter to populate any additional scope values required by the
					// template.

					// The parent scope must include the following:
					//   scope.xfilter
					//   scope.metadata

					scope.uniqueToggleId = "arctimeFilter" + Math.floor(Math.random() * 10000);
					scope.uniqueToggleHref = "#" + scope.uniqueToggleId;
					scope.uniqueModalId = scope.uniqueToggleId + "modal";

					// Set up date selection.

					scope.dateDims = scope.metadata.filter(function (d) { return d.type === 'date'; });
					scope.startDateProp = scope.dateDims[0];
					scope.endDateProp = scope.dateDims[1];
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

						var dateRangeDimAccessor = function (d) {
							return [
								d[scope.startDateProp.key].length === 4 ? 
									"" + d[scope.startDateProp.key] + "-01-01" : 
									"" + d[scope.startDateProp.key],
								d[scope.endDateProp.key].length === 4 ? 
									"" + d[scope.endDateProp.key] + "-01-01" : 
									"" + d[scope.endDateProp.key]
							];

						};

						scope.rangeDim = scope.xfilter.dimension(dateRangeDimAccessor);
						setTitle();
					}

					function setTitle() {
						scope.title = scope.startDateProp.description +
								'/' + scope.endDateProp.description;
					}

					// Set up group selection.
					scope.groupDims = scope.metadata.filter(function (d) { return d.cardinality < 11; });
					scope.groupProp = scope.groupDims[0];
					scope.$watch('groupProp', function() {
						scope.groupAccessor = function(d) { return d[scope.groupProp.key]; };
					});

					// There can be only one unique key, so no selection for this one.
					if(scope.metadata.filter(function (d) { return d.countBy === true; })[0]) {
						scope.countBy = scope.metadata.filter(function (d) { return d.countBy === true; })[0].key;
					}

					// Title/description is used for selection display and is based on the dimension.
					setTitle();
					setRangeDim();
					scope.groupAccessor = function(d) { return d[scope.groupProp.key]; };

					scope.showStartDateModal = function () { $('#' + scope.uniqueModalId).find('#start-date-modal').modal('show'); };
					scope.showEndDateModal = function () { $('#' + scope.uniqueModalId).find('#end-date-modal').modal('show'); };

					// Clean up after ourselves. Remove dimensions that we have created. If we
					// created watches on another scope, destroy those as well.
					scope.$on('$destroy', function () {
						scope.$broadcast('filterReset');
						if(scope.rangeDim) {
							scope.rangeDim.filterAll();
							scope.rangeDim.remove();
						}

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

				}, post: function(scope, element, attrs) {

					$(element).find('.toggle').on("click", function() {
						$(element).find('.settings-panel').toggle(0, function() {
							$(element).find('.view').toggleClass('span12');
							$(element).find('.view').toggleClass('span10');
						});
					});

					// Move the modal out of the fixed area.
					$(element[0]).find('#start-date-modal').parent().appendTo('body');
				}
			}
		};

		return directiveObj;
	});