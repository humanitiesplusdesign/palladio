angular.module('palladioTableView', ['palladio', 'palladio.services'])
	// Palladio Table View
	.directive('palladioTableView', function (palladioService) {

		return {

			scope : {
				dimensions : '=',
				dimension : '=',
				height: '@',
				xfilter: '=',
				exportFunc: '='
			},

			link: function (scope, element, attrs) {

				function refresh() {
					if(!scope.height) {
						scope.calcHeight = $(window).height();
					} else {
						scope.calcHeight = scope.height;
					}

					element.height(scope.calcHeight);
					$(element[0].nextElementSibling).height(scope.calcHeight);
				}

				$(document).ready(refresh);
				$(window).resize(refresh);

				var uniqueDimension;
				var sortFunc = function() { };

				var sorting, desc = true;

				var search = '';

				var dims = [];

				var table, headers, rows, cells;

				scope.exportFunc = function () {

					var text =
						d3.csv.format(
							cells.map(function (r) {
								// Build rows
								var obj = {};
								r.forEach(function (c) { obj[c.__data__.key] = c.__data__.value; });
								return obj;
							})
						);

					var title = 'Palladio table export.csv';

					function getBlob() {
						return window.Blob || window.WebKitBlob || window.MozBlob;
					}

					var BB = getBlob();

					var isSafari = (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1);

					if (isSafari) {
						var csv = "data:text/csv," + text;
						var newWindow = window.open(csv, 'download');
					} else {
						var blob = new BB([text], { type: "data:text/csv" });
						saveAs(blob, title);
					}

				};

				function update() {
					if (!scope.dimension || !uniqueDimension || dims.length === 0) return;

					if (!sorting) sorting = dims[0].key;

					table = d3.select(element[0]).select("table");

					if(table.empty()) {
						table = d3.select(element[0]).append("table")
								.attr("class","table table-striped");

						table.append("thead").append("tr");
						table.append("tbody");
					}

					headers = table.select("tr")
						.selectAll("th")
						.data(dims, function (d) { return d.key; });

					headers.exit().remove();
					headers.enter().append("th")
						.text(function(d){ return d.key + " "; })
						.style("cursor","pointer")
						.on("click", function(d) {
								desc = sorting == d.key ? !desc : desc;
								sorting = d.key;
								sortFunc = function (a, b) { return desc ? a[sorting] < b[sorting] ? 1 : -1 : a[sorting] < b[sorting] ? -1 : 1; };
								update();
							})
						.append("i")
						.style("margin-left","5px");

					headers.select("i")
						.attr("class", function(){ return desc ? "fa fa-sort-asc" : "fa fa-sort-desc"; })
						.style("opacity", function(d){ return d.key == sorting ? 1 : 0; });

					headers.order();

					var tempArr = [];
					var nested = d3.nest()
							.key(uniqueDimension.accessor)
							.rollup(function(arr) {
								// Build arrays of unique elements for each scope dimension
								return dims.map(function (d) {
									tempArr = [];
									arr.forEach(function (a) {
										if(tempArr.indexOf(a[d.key]) === -1 && a[d.key]) {
											tempArr.push(a[d.key]);
										}
									});
									return { key: d.key, values: tempArr };
								}).reduce(function(prev, curr) {
									// Then build an object like the original object concatenating those values
									// Currently we just comma-delimit them, which can be a problem with some data sets.
									prev[curr.key] = curr.values.join(', ');
									return prev;
								}, {});
							})
							.entries(uniqueDimension.top(Infinity))
							.map(function (d) {
								d.values[scope.dimension.key] = d.key;
								return d.values;
							});

					rows = table.select("tbody")
							.selectAll("tr")
							.data(nested.filter(function (d){
									if(search) {
										return dims.map(function (m) {
											return d[m.key];
										}).join().toUpperCase().indexOf(search.toUpperCase()) !== -1;
									} else {
										return true;
									}
								}).sort(sortFunc), function (d) {
									return dims.map(function(m){
										return d[m.key];
									}).join() + uniqueDimension.accessor(d);
							});

					rows.exit().remove();
					rows.enter().append("tr");

					rows.order();

					cells = rows.selectAll("td")
						.data(function(d){ return dims.map(function(m){ return { key: m.key, value: d[m.key] }; }); },
								function(d) { return d.key; });

					cells.exit().remove();
					cells.enter().append("td");
					cells.html(function(d){
						// if URL let's create a link
						if ( d.value.indexOf("https://") === 0 || d.value.indexOf("http://") === 0 || d.value.indexOf("www.") === 0 ) {
							return "<a target='_blank' href='" + d.value + "'>" + d.value + "</a>";
						}
						return d.value;
					});

					cells.order();

				}

				var uniqueId = "tableView" + Math.floor(Math.random() * 10000);
				var deregister = [];

				deregister.push(palladioService.onUpdate(uniqueId, function() {
					// Only update if the table is visible.
					if(element.is(':visible')) { update(); }
				}));

				// Update when it becomes visible (updating when not visibile errors out)
				scope.$watch(function() { return element.is(':visible'); }, update);

				scope.$watchCollection('dimensions', function() {
					updateDims();
					update();
				});

				scope.$watch('dimension', function () {
					updateDims();
					if(scope.dimension) {
						if(uniqueDimension) uniqueDimension.remove();
						uniqueDimension = scope.xfilter.dimension(function (d) { return "" + d[scope.dimension.key]; });
					}
					update();
				});

				function updateDims() {
					if(scope.dimension) {
						dims = [scope.dimension].concat(scope.dimensions);
					}
				}


				scope.$on('$destroy', function () {
					if(uniqueDimension) uniqueDimension.remove();
					deregister.forEach(function(f) { f(); });
				});

				deregister.push(palladioService.onSearch(uniqueId, function(text) {
					search = text;
					update();
				}));
			}
		};
	})

	// Palladio Table View with Settings
	.directive('palladioTableViewWithSettings', function (palladioService, dataService) {

		return {
			scope: {
				height: '@'
			},
			templateUrl : 'partials/palladio-table-view/template.html',
			link: {

				pre: function (scope, element, attrs) {

					// In the pre-linking function we can use scope.data, scope.metadata, and
					// scope.xfilter to populate any additional scope values required by the
					// template.

					var deregister = [];

					scope.metadata = dataService.getDataSync().metadata;
					scope.xfilter = dataService.getDataSync().xfilter;

					scope.uniqueToggleId = "mapView" + Math.floor(Math.random() * 10000);
					scope.uniqueModalId = scope.uniqueToggleId + "modal";

					scope.fields = scope.metadata.sort(function (a, b) { return a.description < b.description ? -1 : 1; });
					scope.tableDimensions = [];

					// Set up count selection.
					// scope.countDims = scope.metadata.filter(function (d) { return d.countable === true; })
					// 		.sort(function (a, b) { return a.countDescription < b.countDescription ? -1 : 1; });
					scope.countDims = scope.metadata
							.sort(function (a, b) { return a.description < b.description ? -1 : 1; });
					scope.countDim = null;
					scope.getCountDescription = function (field) {
						// return field.countDescription;
						return field.description;
					};
					scope.showCountModal = function () { $('#' + scope.uniqueModalId).find('#count-modal').modal('show'); };

					scope.showModal = function(){
						$('#table-modal').modal('show');
					};

					scope.fieldDescriptions = function () {
						return scope.tableDimensions.map( function (d) { return d.description; }).join(", ");
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

					scope.exportCsv = function () {};

					function importState(state) {
						scope.$apply(function () {
							scope.tableDimensions = state.tableDimensions;
							scope.countDim = state.countDim;

							scope.setInternalState(state);
						});
					}

					function exportState() {
						return scope.readInternalState({
							tableDimensions: scope.tableDimensions,
							countDim: scope.countDim
						});
					}

					deregister.push(palladioService.registerStateFunctions(scope.uniqueToggleId, 'tableView', exportState, importState));

					scope.$on('$destroy', function () {
						deregister.forEach(function (f) { f(); });
					});

				},

				post: function(scope, element, attrs) {


						element.find('.settings-toggle').click(function() {
						  element.find('.settings').toggleClass('closed');
						});


				}
			}
		};
	});
