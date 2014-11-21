angular.module('palladioGraphView', ['palladioApp.services', 'palladio', 'palladioApp.services'])
	// Palladio Timechart View
	.directive('palladioGraphView', function (palladioService) {

		return {

			scope : {
				linkDimension: '=',
				showLinks: '=',
				showLabels: '=',
				nodeSize: '=',
				// circleLayout: '=',
				highlightSource: '=',
				highlightTarget: '=',
				countBy : '@',
				countDescription: '@',
				aggregationType: '@',
				aggregateKey: '@',
				readInternalState: '=',
				setInternalState: '=',
				getSvg: '='
			},

			link: function (scope, element, attrs) {

				var deregister = [];
				var uniqueId = "graphView" + Math.floor(Math.random() * 10000);

				scope.readInternalState = function (state) {
					// Placeholder
					state.fixedNodes = chart.fixedNodes();
					return state;
				};

				scope.setInternalState = function (state) {
					chart.fixedNodes(state.fixedNodes);
					return state;
				};

				scope.getSvg = function () {
					return chart.getSvg();
				};

				var search = "";

				var width = element.width() || 1000,
					height = element.height() || 800;

				var canvas = d3.select(element[0])
					.append('canvas')
						.attr('style', 'position: absolute; left: 0; top: 0; z-index: -100');

				var svg = d3.select(element[0])
					.append('svg:svg')
					.attr("pointer-events", "all");

				var chart = d3.graph();

				var linkGroup = null;

				function update() {

					if (!scope.linkDimension) return;

					chart
						.width(width)
						.height(height)
						.showLinks(scope.showLinks)
						.showLabels(scope.showLabels)
						.nodeSize(scope.nodeSize)
						.searchText(search)
						.circle(scope.circleLayout);

					canvas
						.attr('width', width)
      					.attr('height', height);

					svg
						.attr('width', width)
						.attr('height', height)
						.datum(links())
						.call(chart);

					if(scope.highlightSource) chart.highlightSource();
					if(scope.highlightTarget) chart.highlightTarget();

				}

				function links() {

					if(!linkGroup) {

						var helpers = crossfilterHelpers.countByDimensionWithInitialCountAndData(
							function(v) { return v[scope.countBy]; },
							// This function sets up the 'data' attribute of each link
							function (d, p, t) {
								if(p === undefined) {
									p = {
										source: scope.linkDimension.accessor(d)[0],
										target: scope.linkDimension.accessor(d)[1],
										data: d,
										agg: 0,
										initialAgg: 0
									};
								}
								if(t === 'add') {
									// Adding a new record.
									if(scope.aggregationType === 'COUNT') {
										p.agg++;
									} else {
										p.agg = p.agg + (+d[scope.aggregateKey] ? +d[scope.aggregateKey] : 0); // Make sure to cast or you end up with a String!!!
									}
									if(p.agg > p.initialAgg) p.initialAgg = p.agg;
								} else {
									// Removing a record.
									if(scope.aggregationType === 'COUNT') {
										p.agg--;
									} else {
										p.agg = p.agg - (+d[scope.aggregateKey] ? +d[scope.aggregateKey] : 0); // Make sure to cast or you end up with a String!!!
									}
								}
								return p;
							}
						);

						linkGroup = scope.linkDimension.group().reduce(
							helpers.add,
							helpers.remove,
							helpers.init
						).order(function (a) { return a.data.agg; });
					}

					return linkGroup
						.top(Infinity)
						.map(function (d) { return d.value; })
						// If we want to show 0-count nodes, remove this line.
						// But we need to do something to indicate the 0-count state in d3.graph.js
						.filter(function (d) { return d.data.agg > 0; });
				}

				scope.$on('zoomIn', function(){
					chart.zoomIn();
				});

				scope.$on('zoomOut', function(){
					chart.zoomOut();
				});

				// update on xfilters events
				deregister.push(palladioService.onUpdate(uniqueId, function() {
					// Only update if the table is visible.
					if(element.is(':visible')) { update(); }
				}));

				// Update when it becomes visible (updating when not visibile errors out)
				scope.$watch(function() { return element.is(':visible'); }, update);

				scope.$on('resetNodes', function() {
					chart.resetNodes();
				});
				scope.$watch('linkDimension', function() {
					chart.reset();
					if(linkGroup) {
						linkGroup.remove();
						linkGroup = null;
					}
					update();
				});

				scope.$watchGroup(['countBy', 'aggregationType',
					'aggregationKey'], function() {
					chart.reset();
					if(linkGroup) {
						linkGroup.remove();
						linkGroup = null;
					}
					update();
				});

				scope.$watch('showLinks', update);
				scope.$watch('showLabels', update);
				scope.$watch('nodeSize', update);
				deregister.push(palladioService.onSearch(uniqueId, function(text) { search = text; update(); }));
				scope.$watch('circleLayout', update);
				scope.$watch('highlightSource', function (nv, ov) {
					if(nv !== ov) {
						if(nv) {
							scope.highlightTarget = false;
							chart.highlightSource();
						} else {
							if(!scope.highlightTarget) chart.removeHighlight();
						}
					}
				});
				scope.$watch('highlightTarget', function (nv, ov) {
					if(nv !== ov) {
						if(nv) {
							scope.highlightSource = false;
							chart.highlightTarget();
						} else {
							if(!scope.highlightSource) chart.removeHighlight();
						}
					}
				});

				scope.$on("resize", function(){
					width = element.width();
					update();
				});

				function refresh() {
					element.height($(window).height());
				}

				$(document).ready(refresh);
				$(window).resize(refresh);

			}

		};
	})

	// Palladio Timechart View with Settings
	.directive('palladioGraphViewWithSettings', function (exportService, palladioService, dataService) {

		return {
			scope: true,

			templateUrl : 'partials/palladio-graph-view/template.html',

			link : {

				pre: function (scope, element, attrs) {

					var deregister = [];

					scope.metadata = dataService.getDataSync().metadata;
					scope.xfilter = dataService.getDataSync().xfilter;

					scope.uniqueToggleId = "graphView" + Math.floor(Math.random() * 10000);
					scope.uniqueModalId = scope.uniqueToggleId + "modal";

					scope.fields = scope.metadata.sort(function (a, b) { return a.description < b.description ? -1 : 1; });

					scope.dateFields = scope.metadata.filter(function (d) { return d.type === 'date'; });

					scope.mapping = {};

					scope.nodeSize = false;
					scope.showLabels = true;
					scope.circleLayout = false;

					scope.highlightSource = false;
					scope.highlightTarget = false;

					scope.showLinks = true;

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
								scope.aggDescription = scope.getAggDescription(scope.aggDim);
							} else {
								// We are summing
								scope.countBy = countDims.get(scope.aggDim.fileId).key;
								scope.aggregationType = 'SUM';
								scope.aggregateKey = scope.aggDim.key;
								scope.aggDescription = scope.getAggDescription(scope.aggDim);
							}
						}
					});
					scope.showAggModal = function () { $('#' + scope.uniqueModalId).find('#agg-modal').modal('show'); };

					scope.$watch('mapping.sourceDimension', function(){
						updateLinkDimension();
					});

					scope.$watch('mapping.targetDimension', function(){
						updateLinkDimension();
					});

					function updateLinkDimension() {
						var sourceAccessor = !scope.mapping.sourceDimension ? null : function(d) { return d[scope.mapping.sourceDimension.key]; };
						var targetAccessor = !scope.mapping.targetDimension ? null : function(d) { return d[scope.mapping.targetDimension.key]; };
						if(scope.linkDimension) scope.linkDimension.remove();
						if(scope.mapping.sourceDimension && scope.mapping.targetDimension) {
							scope.linkDimension = scope.xfilter.dimension(function(d) { return [ sourceAccessor(d), targetAccessor(d) ]; });
						}
					}

					// Clean up after ourselves. Remove dimensions that we have created. If we
					// created watches on another scope, destroy those as well.
					scope.$on('$destroy', function () {
						if(scope.linkDimension) scope.linkDimension.remove();
						deregister.forEach(function (f) { f(); });
					});

					scope.resetNodes = function () {
						scope.$broadcast('resetNodes');
					};

					scope.showSourceModal = function(){
						$('#source-modal').modal('show');
					};

					scope.showTargetModal = function(){
						$('#target-modal').modal('show');
					};

					scope.clearDimensions = function () {
						scope.mapping.sourceDimension = null;
						scope.mapping.targetDimension = null;
					};

					scope.zoomIn = function(){
						scope.$broadcast('zoomIn');
					};

					scope.zoomOut = function(){
						scope.$broadcast('zoomOut');
					};

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

					scope.getSvg = function () {
						// Placeholder
						return {};
					}

					scope.exportSvg = function(source, title){
						console.log(scope.getSvg());
						exportService(scope.getSvg(), title);
					};

					function importState(state) {
						scope.showLinks = state.showLinks;
						scope.showLabels = state.showLabels;
						scope.nodeSize = state.nodeSize;
						scope.highlightSource = state.highlightSource;
						scope.highlightTarget = state.highlightTarget;
						scope.countDim = state.countDim;
						scope.mapping.sourceDimension = scope.fields.filter(function(f) { return f.key === state.sourceDimension; })[0];
						scope.mapping.targetDimension = scope.fields.filter(function(f) { return f.key === state.targetDimension; })[0];
						if(state.aggDimKey) scope.aggDim = scope.aggDims.filter(function(f) { return f.key === state.aggDimKey; })[0];

						scope.$digest();

						scope.setInternalState(state);
					}

					function exportState() {
						return scope.readInternalState({
							showLinks: scope.showLinks,
							showLabels: scope.showLabels,
							aggregateKey: scope.aggregateKey,
							aggregationType: scope.aggregationType,
							nodeSize: scope.nodeSize,
							highlightSource: scope.highlightSource,
							highlightTarget: scope.highlightTarget,
							countDim: scope.countDim,
							aggDimKey: scope.aggDim.key,
							sourceDimension: scope.mapping.sourceDimension ? scope.mapping.sourceDimension.key : null,
							targetDimension: scope.mapping.targetDimension ? scope.mapping.targetDimension.key : null
						});
					}

					deregister.push(palladioService.registerStateFunctions(scope.uniqueToggleId, 'graphView', exportState, importState));

				},

				post: function(scope, element, attrs) {
					$(element).find('.toggle').on("click", function() {
						element.find('.settings').toggleClass('open close');
					});
				}
			}

		};
	});
