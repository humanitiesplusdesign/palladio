// Facet filter module

angular.module('palladioFacetFilter', ['palladio', 'palladioApp.services'])
	.directive('palladioFacetFilter', function (palladioService) {
		var filterColor = "#A8DDB5";

		var directiveDefObj = {
			scope: {
				dimensions: '=',
				config: '=',
				aggregateKey: '@',
				aggregationType: '@',
				setInternalState: '=',
				readInternalState: '=',
				height: '='
			},
			link: function (scope, element, attrs) {

				var deregister = [];

				var uniqueDimension = scope.config.uniqueDimension;

				var listMap = d3.map();

				var sel = d3.select(element[0]).append("div");

				var lists = sel.append("div")
						.attr("class", "expanded-container")
							.append("ul").attr("id", "sortable-expanded");

				lists.selectAll("li").data(scope.dimensions, function(d) { return d.config.key; })
					.enter().append("li")
						.attr("class", "list-container")
						.each(buildList);

				// Build CrossFilter dimensions and D3 elastic_list charts.
				scope.dimensions.forEach(function(dim) {
					// TODO: Hack-in it here...
					// For some reason this runs before the aggregateKey and aggregationType scope
					// variables resolve, so we need to wait a split second.
					window.setTimeout(function () { addDimension(dim); }, 100);
				});

				scope.$watchGroup(['config.uniqueDimension', 'aggregateKey',
					'aggregationType'], function(nv, ov) {

					if(nv[2] && (nv[0] !== ov[0] || nv[1] !== ov[1] || nv[2] !== ov[2])) {

						uniqueDimension = scope.config.uniqueDimension;

						rebuildFacets();
					}
				});

				function rebuildFacets() {
					// Rebuild all facets. We lose filters here, which is a problem.
					scope.dimensions.forEach(function(dim) {
						removeDimension(dim, dim.config.identifier);
					});

					lists.selectAll("li").data(scope.dimensions, function(d) { return d.config.key; })
						.enter().append("li")
							.attr("class", "list-container")
							.each(buildList);

					scope.dimensions.forEach(function(dim) {
						addDimension(dim);
					});
				}

				scope.$on('removeDim', function (event, args) {
					removeDimension(args[0], args[1]);
				});

				scope.$on('addDim', function (event, args) {
					var buttonQueryString = "#button" + args[0].config.domKey;

					// Newly added dimensions are always collapsed.
					d3.select("#sortable-expanded")
						.append("li")
							.attr("class", "list-container")
							.datum(args[0])
							.each(buildList);

					addDimension(args[0]);
				});

				function buildList(x, i) {
					var li = d3.select(this);
					var domID = "#chart" + li.datum().config.domKey;

					li.append("span").attr("class", "list-title").text(function(d) {
						if(d.config.description)
							return d.config.description;
					});

					// Sort buttons.
					var buttonGroup = li.append("span")
							.attr("class", "mode-buttons")
								.append("div").attr("class", "btn-group");

					buttonGroup.append("a").attr("class", "btn-mini")
							.on("click", function() {
								$(this).button('toggle');
								if(d3.select(this).classed("active")) {
									listMap.get(domID).selectAll();
								} else {
									listMap.get(domID).deselectAll();
								}
							})
							.append("i").attr("class", "fa fa-check-square-o");

					buttonGroup.append("a").attr("class", "btn-mini")
							.on("click", function() {
								$(this).button('toggle');
								listMap.get(domID).toggleLabelSort();
							})
							.append("i").attr("class", "fa fa-sort-alpha-asc");

					// Chart SVG
					li.append("div").attr("class", "list")
						.append("svg").attr("id", function(d) { return "chart" + d.config.domKey; });
				}

				function addDimension(dim) {
					// DOM id where we are going to put the chart.
					var domID = "#chart" + dim.config.domKey;
					var dimension = dim.dimension;

					// Build elastic_lists.js chart
					var chart = elastic_list().dimension(dimension).callback(
						function() {
							if(listMap.get(domID).filter()) {
								deregister.push(palladioService.setFilter(dim.config.identifier, dim.config.description, listMap.get(domID).filter(), listMap.get(domID).resetFilter));
							} else {
								palladioService.removeFilter(dim.config.identifier);
							}
							palladioService.update();
						}
					);

					// Set dashboard-wide unique dimension, which may be over-ridden by the configuration.
					chart.uniqueDimension(uniqueDimension);
					chart.aggregateKey(scope.aggregateKey);
					chart.aggregationType(scope.aggregationType);

					if(scope.height) {
						chart.height(scope.height - 20);
					}

					// Apply configuration to elastic_list.js chart
					if(dim.config.facets) {
						dim.config.facets.forEach(function(c) {
							chart[c.func].apply(chart, c.args);
						});
					}

					// Set up scrollbar configuration on the list.
					chart.scrollbarWidth(16);
					chart.scrollbarElement($(element[0]).find( domID ).parent());

					var actions = chart(d3.select($(element[0]).find(domID).get(0)));  // This renders the chart.

					deregister.push(palladioService.onUpdate(domID, function() {
						actions.update();
					}));

					deregister.push(palladioService.onReset(domID, function() {
						actions.resetFilter();
					}));

					actions.deregister = deregister;

					listMap.set(domID, actions);

					actions.update();

					// Make sortable.
					$(element[0]).find("#sortable-expanded").sortable().disableSelection();
				}

				function removeDimension(dim, identifier) {
					var domID = "#chart" + dim.config.domKey;

					if(listMap.has(domID)) {
						listMap.get(domID).resetFilter();
						listMap.get(domID).deregister.forEach(function (f) { f(); });

						// Remove the listMap
						listMap.remove(domID);

						// Remove the DOM.
						$(element[0]).find(domID).parent().parent().remove();

						// Emit the required events for Palladio to remove filters.
						palladioService.removeFilter(identifier);
						palladioService.update();
					}
				}

				scope.setInternalState = function (state) {
					state.domKeys.forEach(function(k, i) {
						listMap.get("#chart" + k).filterInternal(state.filters[i]);
					});
					return state;
				};

				scope.readInternalState = function (state) {
					// Order these by the same order as the dimKeys
					state.filters = state.domKeys.map(function(k) {
						return listMap.get("#chart" + k).filterInternal();
					});
					return state;
				};

				scope.$on('$destroy', function () {
					deregister.forEach(function(f) { f(); });
				});
			}
		};

		return directiveDefObj;
	})

	.directive('palladioFacetFilterWithSettings', function (palladioService, dataService) {
		return {
			scope : true,
			templateUrl : 'partials/palladio-facet-filter/template.html',


			link : {
				pre : function(scope, element, attrs) {

					// In the pre-linking function we can use scope.data, scope.metadata, and
					// scope.xfilter to populate any additional scope values required by the
					// template.

					var deregister = [];

					scope.metadata = dataService.getDataSync().metadata;
					scope.xfilter = dataService.getDataSync().xfilter;

					scope.uniqueToggleId = "facetFilter" + Math.floor(Math.random() * 10000);
					scope.uniqueToggleHref = "#" + scope.uniqueToggleId;
					scope.uniqueModalId = scope.uniqueToggleId + "modal";

					scope.dimensions = [];
					scope.config = {};
					scope.title = "Facet Filter";

					// Set up aggregation selection.
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
						if(!scope.aggDim) {
							// No aggregation selected - just choose the first one
							scope.countBy = scope.countDims.get(0).key;
						} else {
							// We figure out the unique aggregation dimension based on aggDim
							if(scope.aggDim.type === 'count') {
								scope.countBy = scope.aggDim.key;
								scope.aggregationType = 'COUNT';
								scope.aggregateKey = null;
								scope.aggDescription = scope.getAggDescription(scope.aggDim);
								scope.config.uniqueDimension = scope.countBy;
							} else {
								// We are summing
								scope.countBy = countDims.get(scope.aggDim.fileId).key;
								scope.aggregationType = 'SUM';
								scope.aggregateKey = scope.aggDim.key;
								scope.aggDescription = scope.getAggDescription(scope.aggDim);
								scope.config.uniqueDimension = scope.countBy;
							}
						}
					});
					scope.showAggModal = function () { $('#' + scope.uniqueModalId).find('#facet-agg-modal').modal('show'); };

					scope.showModal = function () { $('#' + scope.uniqueModalId).find('#facet-modal').modal('show'); };
					
					scope.fieldDescriptions = function () {
						return scope.dims.map( function (d) { return d.description; }).join(", ");
					};

					scope.countDescription = function () {
						if(scope.uniqueDimension) {
							return scope.uniqueDimension.countDescription;
						} else {
							return false;
						}
					};

					scope.getCountDescription = function (field) {
						return field.countDescription;
					};

					scope.uniqueDimension = undefined;

					// There can be only one unique key, so no selection for this one.
					if(scope.metadata.filter(function (d) { return d.countBy === true; })[0]) {
						scope.uniqueDimension = scope.metadata.filter(function (d) { return d.countBy === true; })[0];
						scope.config.uniqueDimension = scope.uniqueDimension.key;
					}

					// Get all the dimensions metadata that is type 'string' and not 'uniqueKey'.
					// Right now we also restrict cardinality to less than 1000 for performance/usability
					// reasons.
					scope.fields = scope.metadata.filter(function () {
						return true;
					}).sort(function (a, b) { return a.description < b.description ? -1 : 1; });

					// Get the countable fields.
					scope.countFields = scope.metadata.sort(function (a, b) { return a.countDescription < b.countDescription ? -1 : 1; });

					// Only take the first 10 valid dimensions. The reason is that the Cross-filter is limited
					// to 32 dimensions so we don't want to overload it.
					scope.dims = scope.fields.slice(0,4);

					scope.dimensions = scope.dims.map(function (d) {
						return {
							dimension: scope.xfilter.dimension(function (l) { return "" + l[d.key]; }),
							config: {
								key: d.key,
								// We can't allow spaces or dots because of CSS & jqueryscrollpane incompatibility
								domKey: calculateDomKey(d.key),
								description: d.description,
								identifier: d.description + Math.floor(Math.random() * 10000)
							}
						};
					});

					scope.$watch('dims', function (nv, ov) {
						if(nv.length < ov.length) {
							// Figure out which dimension was removed.
							var removedDim;
							var removedDimIdx;

							ov.forEach( function (d, i) {
								if(removedDim === undefined && nv[i] && d.key !== nv[i].key) {
									removedDim = d;
								}
							});

							// Handle situation with it being the last element in ov.
							if(removedDim === undefined) removedDim = ov[ov.length - 1];

							// Find the index;
							scope.dimensions.forEach(function(d, i) {
								if(d.config.key == removedDim.key) removedDimIdx = i;
							});

							// Remove the old dimension from the Crossfilter and from the scope.
							scope.dimensions[removedDimIdx].dimension.filterAll();
							scope.dimensions[removedDimIdx].dimension.remove();
							var removedInternalDimension = scope.dimensions.splice(removedDimIdx, 1)[0];

							scope.$broadcast('removeDim', [removedInternalDimension, removedInternalDimension.config.identifier]);
						}

						if(nv.length > ov.length) {
							// Figure out which dimension was added.
							var addedDim;

							nv.forEach( function (d, i) {
								if(addedDim === undefined && ov[i] && d.key !== ov[i].key) {
									addedDim = d;
								}
							});
							
							// Handle situation with it being the last element in nv.
							if(addedDim === undefined) addedDim = nv[nv.length - 1];

							// Add the new dimension.
							scope.dimensions.push(
								{
									dimension: scope.xfilter.dimension(function (l) { return "" + l[addedDim.key]; }),
									config: {
										key: addedDim.key,
										// We can't allow spaces or dots because of CSS & jqueryscrollpane incompatibility
										domKey: calculateDomKey(addedDim.key),
										description: addedDim.description,
										identifier: addedDim.description + Math.floor(Math.random() * 10000)
									}
								}
							);

							scope.$broadcast('addDim', [scope.dimensions[scope.dimensions.length - 1]]);
						}
					});

					function calculateDomKey(key) {
						return key.split("\n").join("").split('?').join("").split('"').join("").split(")").join("").split("(").join("").split(" ").join("").split(".").join("").split("#").join("").split("/").join("").split(",").join("");
					}

					// Clean up after ourselves. Remove dimensions that we have created. If we
					// created watches on another scope, destroy those as well.
					var destroyed = false;
					scope.$on('$destroy', function () {
						scope.dimensions.map(function(d) {
							d.dimension.filterAll();
							d.dimension.remove();
						});

						deregister.forEach(function (f) { f(); });

						destroyed = true;

						// Get rid of the modal.
						$('#' + scope.uniqueModalId).remove();
					});

					// Watch for filter changes and record them.

					scope.localFilters = [];
					var filtersMap = d3.map();

					scope.$on('updateFilter', function(event, args) {
						filtersMap.set(args[0], [args[1], args[2], args[3]]);

						if(!args[1]) {
							filtersMap.remove(args[0]);
						}

						// We do this because d3.js's d3.map().entries() doesn't play nice
						// with Angular.js's $digest function when used in an ng-repeat directive.
						scope.localFilters = filtersMap.entries();
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

					scope.setInternalState = function (state) {
						// Placeholder
						return state;
					};

					// Add internal state to the state.
					scope.readInternalState = function (state) {
						// Placeholder
						return state;
					};

					var importState = function(state) {
						// We have to manually manage digest()s between each stage of the load
						// because the way we handle dimension additions/deletions is really
						// really fragile.

						// Unfortunately we have to wait for the default dimensions to even get set up.
						// This is due to the use of setTimeout in the initial setup, which
						// creates a race condition. Sadness.

						window.setTimeout(function () {
							scope.config = state.config;
							scope.$digest();

							// Remove default dims. We have to copy the array to do this in order to trigger
							// our watcher.
							while(scope.dims.length > 0) {
								if(scope.dims.length > 1) {
									scope.dims = scope.dims.slice(0, scope.dims.length - 1);
								} else {
									scope.dims = [];
								}
								scope.$digest();
							}

							// Need to do this one-by-one because of the way we watch for changes.
							scope.fields.filter(function(f) { return state.dimKeys.indexOf(f.key) !== -1; })
								.forEach(function(d) {
									scope.dims = scope.dims.concat(d);
									scope.$digest();
								});

							// Set the aggregation.
							if(state.aggregationType) scope.aggregationType = state.aggregationType;
							if(state.aggregateKey) scope.aggregateKey = state.aggregateKey;
							if(state.aggDimKey) scope.aggDim = scope.aggDims.filter(function(f) { return f.key === state.aggDimKey; })[0];

							// Recalculate domKeys (in case we change format)
							state.domKeys = state.dimKeys.map(function(k) { return calculateDomKey(k); });

							scope.$digest();
								
							scope.setInternalState(state);
						}, 300);
					};

					var exportState = function() {
						return destroyed ? false : scope.readInternalState({
							config: scope.config,
							aggregationType: scope.aggregationType,
							aggregateKey: scope.aggregateKey,
							aggDimKey: scope.aggDim.key,
							dimKeys: scope.dims.map(function(d) { return d.key; }),
							domKeys: scope.dims.map(function(d) { return calculateDomKey(d.key); })
						});
					};

					deregister.push(palladioService.registerStateFunctions(scope.uniqueToggleId, 'facet', exportState, importState));
				},

				post : function(scope, element, attrs) {
					$(element[0]).find('.toggle').on("click", function() {
						$(element[0]).find('.settings-panel').toggle(0, function() {
							$(element[0]).find('.view').toggleClass('span12');
							$(element[0]).find('.view').toggleClass('span10');
						});
					});

					// Move the modal out of the fixed area.
					$(element[0]).find('#facet-modal').parent().appendTo('body');
				}
			}
		};
	});