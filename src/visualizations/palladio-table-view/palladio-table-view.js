angular.module('palladioTableView', [])
	.constant('version', '0.9')
	// Palladio Table View
	.directive('palladioTableView', function () {

		return {

			scope : {
				dimensions : '=',
				dimension : '=',
				searchText: '=',
				xfilter: '='
			},

			link: function (scope, element, attrs) {

				var uniqueDimension;
				var sortFunc = function(a, b) { };

				var sorting, desc = true;

				function update() {
					if (!scope.dimensions || !uniqueDimension) return;

					if (!sorting) sorting = scope.dimensions[0].key;

					var table = d3.select(element[0]).select("table");

					if(table.empty()) {
						table = d3.select(element[0]).append("table")
								.attr("class","table table-striped");

						table.append("thead").append("tr");
						table.append("tbody");
					}

					var headers = table.select("tr")
						.selectAll("th")
						.data(scope.dimensions, function (d) { return d.key; });
		
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
						.attr("class", function(d){ return desc ? "fa fa-sort-asc" : "fa fa-sort-desc"; })
						.style("opacity", function(d){ return d.key == sorting ? 1 : 0; });
					

					var rows = table.select("tbody")
							.selectAll("tr")
							.data(uniqueDimension.top(Infinity).filter(function (d){
									if(scope.searchText) {
										return scope.dimensions.map(function (m) {
											return d[m.key];
										}).join().toUpperCase().indexOf(scope.searchText.toUpperCase()) !== -1;
									} else {
										return true;
									}
								}).sort(sortFunc), function (d) {
									return scope.dimensions.map(function(m){
										return d[m.key];
									}).join() + uniqueDimension.accessor(d);
							});
						
					rows.exit().remove();
					rows.enter().append("tr");

					rows.order();

					var cells = rows.selectAll("td")
						.data(function(d){ return scope.dimensions.map(function(m){ return { key: m.key, value: d[m.key] }; }); },
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

				}

				scope.$on('update', function(event) {
					// Only update if the table is visible.
					if(element.is(':visible')) { update(); }
				});

				// Update when it becomes visible (updating when not visibile errors out)
				scope.$watch(function() { return element.is(':visible'); }, update);

				scope.$watchCollection('dimensions', update);

				scope.$watch('dimension', function (nv, ov) {
						if(scope.dimension) {
							if(uniqueDimension) uniqueDimension.remove();
							uniqueDimension = scope.xfilter.dimension(function (d) { return "" + d[scope.dimension.key]; });
						}
						update();
					});

				
				scope.$on('$destroy', function () {
					if(uniqueDimension) uniqueDimension.remove();
				});

				scope.$watch('searchText', update);
			}
		};
	})

	// Palladio Table View with Settings
	.directive('palladioTableViewWithSettings', function () {

		return {
			scope: true,
			template : '<!-- View -->' +
						'<div class="view">' +
							'<a class="toggle" data-toggle="tooltip" data-original-title="Settings" data-placement="bottom"><i class="fa fa-cog"></i></a>' +
							'<div data-palladio-table-view ' +
								'dimension="countDim" ' +
								'search-text="searchText"' +
								'dimensions="tableDimensions"' +
								'xfilter="xfilter">' +
							'</div>' +
						'</div> ' +
						'<!-- Settings -->' +
						'<div class="span4 settings"> ' +
							'<p class="super tiny">Table Settings</p>' +
							'<div class="row-fluid">' +

								'<div class="setting">' +
									'<label class="">Row dimension (at least one row for each)</label>' +
									'<span class="field" ng-click="showCountModal()">{{countDim.countDescription || "Choose..."}}<i class="fa fa-bars pull-right"></i></span>' +
								'</div>' +

								'<div class="setting"> ' +
									'<label>Dimensions</label> ' +
									'<span class="field" ng-click="showModal()">{{fieldDescriptions() || "Choose..."}}<i class="fa fa-bars pull-right"></i></span>' +
								'</div>' +

							'</div>' +
						'</div>' +
						'<!--Modal-->' +
						'<div id={{uniqueModalId}}>' +
							'<div id="table-modal" data-modal dimensions="fields" model="tableDimensions"></div>' +
							'<div id="count-modal" data-modal dimensions="countDims" model="countDim" description-accessor="getCountDescription"></div>' +
						'</div>',
			link: {

				pre: function (scope, element, attrs) {

					// In the pre-linking function we can use scope.data, scope.metadata, and
					// scope.xfilter to populate any additional scope values required by the
					// template.

					scope.uniqueToggleId = "mapView" + Math.floor(Math.random() * 10000);
					scope.uniqueModalId = scope.uniqueToggleId + "modal";

					scope.fields = scope.metadata.sort(function (a, b) { return a.description < b.description ? -1 : 1; });
					scope.tableDimensions = scope.fields.slice(1,5);

					// Set up count selection.
					scope.countDims = scope.metadata.filter(function (d) { return d.countable === true; })
							.sort(function (a, b) { return a.countDescription < b.countDescription ? -1 : 1; });
					scope.countDim = scope.metadata.filter(function (d) { return d.countBy === true; })[0];
					scope.getCountDescription = function (field) {
						return field.countDescription;
					};
					scope.showCountModal = function () { $('#' + scope.uniqueModalId).find('#count-modal').modal('show'); };

					scope.$on('search', function(event, args) {
						scope.searchText = args;
					});

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

					scope.$emit('registerStateFunctions', ['tableView', exportState, importState]);

				},

				post: function(scope, element, attrs) {

					$(element).find('.toggle').on("click", function() {
						element.find('.settings').toggleClass('open close');
					});

					
				}
			}
		};
	});