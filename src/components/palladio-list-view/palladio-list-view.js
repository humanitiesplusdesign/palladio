// List view module

angular.module('palladioListView', ['palladio', 'palladio.services'])
	.directive('palladioListView', function (palladioService) {

		var directiveDefObj = {
			scope: {
				listDimension: '=listDimension',
				max: '=maxToDisplay',
				imageURLFunc: '=imgUrlAccessor',
				titleFunc: '=titleAccessor',
				subtitleFunc: '=subtitleAccessor',
				textFunc: '=textAccessor',
				linkFunc: '=linkAccessor',
				sortOptions: '=sortOptions'
			},
			link: function (scope, element) {


				///////////////////////////////////////////////////////////////////////
				//
				// Listen for Palladio events we need to respond to.
				//
				///////////////////////////////////////////////////////////////////////

				var uniqueId = "listView" + Math.floor(Math.random() * 10000);
				var deregister = [];

				deregister.push(palladioService.onUpdate(uniqueId, function() {
					// Only update if the table is visible.
					if(element.is(':visible')) { buildList(); }
				}));

				// Update when it becomes visible (updating when not visibile errors out)
				scope.$watch(function() { return element.is(':visible'); }, buildList);

				///////////////////////////////////////////////////////////////////////
				//
				// Watch for scope parameter changes that we need to do respond to.
				//
				///////////////////////////////////////////////////////////////////////

				function watchListener(nv, ov) {
					if(nv !== ov) {
						buildList();
					}
				}

				scope.$watch('listDimension', watchListener);
				scope.$watch('max', watchListener);
				scope.$watch('imageURLFunc', watchListener);
				scope.$watch('titleFunc', watchListener);
				scope.$watch('subtitleFunc', watchListener);
				scope.$watch('textFunc', watchListener);
				scope.$watch('linkFunc', watchListener);
				scope.$watch('sortOptions', watchListener);

				///////////////////////////////////////////////////////////////////////
				//
				// Set default values.
				//
				///////////////////////////////////////////////////////////////////////

				var max = scope.max ? scope.max : Infinity;

				///////////////////////////////////////////////////////////////////////
				//
				// Variables global to the list view scope.
				//
				///////////////////////////////////////////////////////////////////////

				var listGroups, listLookup, sortIndex, listDisplay;

				buildList();

				function buildList() {

					// Groups
					listGroups = scope.listDimension.group();

					// The grid lookup.
					listLookup = d3.map();

					// This is just a placeholder for the moment.
					sortIndex = 0;

					scope.listDimension.top(Infinity).forEach(function(d) {
						listLookup.set(scope.listDimension.accessor(d), {
							title: scope.titleFunc(d),
							imageURL: scope.imageURLFunc(d),
							subtitle: scope.subtitleFunc(d),
							text: scope.textFunc(d),
							link: scope.linkFunc(d),
							sortBy: scope.sortOptions.map(function(s) { return d[s.attribute]; })
						});
					});

					// If the list already exists, remove it.
					d3.select(element[0])
						.select("div#list-display")
						.remove();

					listDisplay = d3.select(element[0])
						.append("div")
						.attr("class","row")
						.attr("id", "list-display");

					/*d3.select(element[0])
						.append("div")
						.attr("class","clearfix");*/

					updateList();
				}

				// Function to update the grid in the future.
				function updateList() {

					listBoxes = listDisplay.selectAll(".list-wrap")
						.data(listGroups.top(scope.max).filter(function(d){
							return d.value !== 0;
						}), function(d) { return d.key; });

					listBoxes.enter()
						.append("div")
						.attr("class", "col-lg-3 col-md-4 col-sm-6 list-wrap")
						.append("a")
							.attr("href", function(d) { return listLookup.get(d.key).link; })
							.attr("target", "_blank")
							.attr("class", "list-link")
						.append("div")
							.attr("class","list-box")
							.each(buildListBox)

					listBoxes.exit().remove();

					listBoxes.sort(function(a, b) {
							if(listLookup.get(a.key).sortBy[sortIndex] > listLookup.get(b.key).sortBy[sortIndex]) {
								return 1;
							} else {
								return -1;
							}
						});
				}

				function buildListBox() {

					var listBox = d3.select(this);

					listBox.append("div").style("background-image", function(d) {
						return "url(" + listLookup.get(d.key).imageURL + ")";
					}).attr("class", "list-image")
					.append('span').html(function(d){
						return listLookup.get(d.key).imageURL ? '' : 'Image';
					})


					listBox.append("div").text(function(d){
						return listLookup.get(d.key).title;
					}).attr("class", "list-title");

					listBox.append("div").text(function(d){
						return listLookup.get(d.key).subtitle;
					}).attr("class", "list-subtitle");

					listBox.append("div").text(function(d){
						return listLookup.get(d.key).text;
					}).attr("class", "list-text margin-top");
				}


			}
		};

		return directiveDefObj;
	})
	// Palladio Grid/List View with Settings
	.directive('palladioListViewWithSettings', function (palladioService, dataService) {

		return {
			scope: true,
			templateUrl: 'partials/palladio-list-view/template.html',
			link: {

				pre: function (scope, element, attrs) {

					// In the pre-linking function we can use scope.data, scope.metadata, and
					// scope.xfilter to populate any additional scope values required by the
					// template.

					var deregister = [];

					scope.metadata = dataService.getDataSync().metadata;
					scope.xfilter = dataService.getDataSync().xfilter;

					scope.fields = scope.metadata.sort(function (a, b) { return a.description < b.description ? -1 : 1; });

					scope.urlDims = scope.metadata.filter(function (d) { return d.type === 'url'; })
							.sort(function (a, b) { return a.description < b.description ? -1 : 1; });

					// There can be only one unique key, so no selection for this one.
					if(scope.metadata.filter(function (d) { return d.countBy === true; })[0]) {
						scope.listDim = scope.metadata.filter(function (d) { return d.countBy === true; })[0];
						scope.titleDim = scope.listDim;
					}

					scope.id = scope.xfilter.dimension(function (d) { return "" + d[scope.listDim.key]; });
					scope.titleAccessor = function (d) { return "" + d[scope.titleDim.key]; };
					scope.subtitleAccessor = function (d) { return "Select a sub-title dimension"; };
					scope.textAccessor = function (d) { return "Select a text dimension"; };
					scope.linkAccessor = function (d) { return ""; };
					scope.imgurlAccessor = function (d) { return ""; };
					scope.sortOptions = [{ attribute: scope.listDim.key }];

					scope.$watch('titleDim', function (nv, ov) {
						scope.titleAccessor = function (d) { return "" + d[nv.key]; };
					});

					scope.$watch('subtitleDim', function (nv, ov) {
						if(nv !== ov) {
							scope.subtitleAccessor = function (d) { return "" + d[nv.key]; };
						}
					});

					scope.$watch('textDim', function (nv, ov) {
						if(nv !== ov) {
							scope.textAccessor = function (d) { return "" + d[nv.key]; };
						}
					});

					scope.$watch('linkDim', function (nv, ov) {
						if(nv !== ov) {
							scope.linkAccessor = function (d) { return "" + d[nv.key]; };
						}
					});

					scope.$watch('imgurlDim', function (nv, ov) {
						if(nv !== ov) {
							scope.imgurlAccessor = function (d) { return "" + d[nv.key]; };
						}
					});

					scope.$watch('sortDim', function (nv, ov) {
						if(nv !== ov) {
							scope.sortOptions = [{
								attribute: nv.key
							}];
						}
					});

					// Clean up after ourselves. Remove dimensions that we have created. If we
					// created watches on another scope, destroy those as well.
					scope.$on('$destroy', function () {
						if(scope.id) scope.id.remove();
						deregister.forEach(function(f) { f(); });
					});

					scope.showTitleModal = function(){
						$('#title-modal').modal('show');
					};

					scope.showSubtitleModal = function(){
						$('#subtitle-modal').modal('show');
					};

					scope.showTextModal = function(){
						$('#text-modal').modal('show');
					};

					scope.showLinkModal = function(){
						$('#link-modal').modal('show');
					};

					scope.showImgURLModal = function(){
						$('#imgurl-modal').modal('show');
					};

					scope.showSortModal = function(){
						$('#sort-modal').modal('show');
					};

					function refresh() {
						element.css("min-height",$(window).height()-50);
					}

					$(document).ready(refresh);
					$(window).resize(refresh);

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
						scope.$apply(function (s) {
							s.titleDim = scope.metadata.filter(function(f) { return f.key === state.titleDim; })[0];
							s.subtitleDim = scope.metadata.filter(function(f) { return f.key === state.subtitleDim; })[0];
							s.textDim = scope.metadata.filter(function(f) { return f.key === state.textDim; })[0];
							s.linkDim = scope.metadata.filter(function(f) { return f.key === state.linkDim; })[0];
							s.imgurlDim = scope.metadata.filter(function(f) { return f.key === state.imgurlDim; })[0];
							s.sortDim = scope.metadata.filter(function(f) { return f.key === state.sortDim; })[0];

							s.setInternalState(state);
						});
					}

					function exportState() {
						return scope.readInternalState({
							titleDim: scope.titleDim.key,
							subtitleDim: scope.subtitleDim ? scope.subtitleDim.key : undefined,
							textDim: scope.textDim ? scope.textDim.key : undefined,
							linkDim: scope.linkDim ? scope.linkDim.key : undefined,
							imgurlDim: scope.imgurlDim ? scope.imgurlDim.key : undefined,
							sortDim: scope.sortDim ? scope.sortDim.key : undefined
						});
					}

					deregister.push(palladioService.registerStateFunctions('listView', 'listView', exportState, importState));

				},

				post: function(scope, element, attrs) {

					$(document).ready(function(){
						element.find('.settings-toggle').click(function() {
							element.find('.settings').toggleClass('closed');
						});
					});
				}
			}
		};
	});
