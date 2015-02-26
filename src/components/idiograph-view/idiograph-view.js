// Palladio template component module

angular.module('palladioIdiographView', ['palladio', 'palladio.services'])
	.directive('palladioIdiographView', function (palladioService, dataService) {
		var directiveObj = {
			scope: true,
			templateUrl: 'partials/idiograph-view/template.html',

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

					scope.uniqueToggleId = "idiographView" + Math.floor(Math.random() * 10000);

					scope.metadata = dataService.getDataSync().metadata;
					scope.xfilter = dataService.getDataSync().xfilter;
					scope.data = dataService.getDataSync().data;

					scope.nodeDims = dataService.getFiles();

					scope.layouts = [
					  {
					    "text": "None",
					    "click": "$alert()"
					  },
					  {
					    "text": "Links",
					    "click": "$alert()"
					  },
					  {
					    "text": "Groups",
					    "href": "#"
					  }
					];

					// selection
					scope.selectedNode = null;
					scope.selectedNodes = [];

					scope.showNodeModal = function(){
						$('#node-modal').modal('show');
					};

				}, post: function(scope, element) {

					// If you are building a d3.js visualization, you can grab the containing
					// element with:
					//
					// d3.select(element[0]);

					setup();
					update();

					var graph,
						data,
						dimension,
						group,
						nodeKeyField;

					function setup() {
						// Called when the entire visualization should be rebuilt.
						//d3.select(element[0]).selectAll('*').remove();
						if (!graph) graph = d3.graph();

						// If a dimension already exists, explicitly destroy it so that it is dropped from
						// the Crossfilter.
						if(dimension) {
							dimension.remove();
							dimension = undefined;
							group = undefined;
						}

						if(scope.nodeDim) {

							// nodeDim is a table, not a field. Find a field that is a unique key.
							// TODO: we need to always add a unique key to a table...
							nodeKeyField = scope.nodeDim.fields.filter(function(d) { return d.uniqueKey; })[0];

							// Create a dimension based on the key field.
							dimension = scope.xfilter.dimension(function(d) {
								return "" + d[nodeKeyField.key];
							});

							// Basic count - will overcount.
							group = dimension.group();
						}
					}

					function update() {

						// Incremental updates to existing visualization.
						graph
						.width(element.width())
						.height($(window).height())
						.on('selected', selected)

					/*	.size(size)
						.key(key)
						.on('selected', selected)*/

						if(scope.nodeDim) {

							// fake data
							data = {
								nodes: group.top(Infinity).map(function(d) {
									// groups have properties "key" and "value" so we need to
									// rewrite to what the graph chart expects.
									return { name: d.key, value: d.value };
								}),
								links: [
									{source:0,target:1,value:1},{source:0,target:2,value:1}
								]
							};

							d3.select(element[0])
								.select('.view')
								.datum(data)
								.call(graph);
						}

						// BAAAAAD
						function selected(d){

							// reset
							scope.selectedNode = null;
							scope.selectedNodes = [];

							// only one selected
							if (d.length == 1) {
								scope.$apply(function(scope){
									scope.selectedNode = scope.nodeDim.data.filter(function(f){ return f[nodeKeyField.key] === d[0].data.name; })[0] || {};
									scope.selectedNode = d3.entries(scope.selectedNode);
								});
								return;
							}

							// more than one selected
							scope.$apply(function(scope){
								var lu = d.map(function(a){ return a.data.name; });
								scope.selectedNodes = scope.nodeDim.data.filter(function(f){ return lu.indexOf(f[nodeKeyField.key]) !== -1; }) || [];
							});
						}

						scope.getFieldType = function(field){
							return scope.nodeDim.fields.filter(function(d){ return d.key == field; })[0].type;
						}

						scope.getUniques = function(field){
						//	return scope.nodeDim.fields.filter(function(d){ return d.key == field; })[0].uniques.map(function(d){});
						}

					}

					function reset() {
						// Tear down visualization.

					}

					// Watch scope elements that should trigger a full rebuild.
					scope.$watchGroup(['nodeDim'], function () {
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

						reset();

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

						deregister.forEach(function(f) { f(); });
						deregister = [];

					});


					// Support save/load. These functions should be able to fully recreate an instance
					// of this visualization based on the results of the exportState() function. Include
					// current filters, any type of manipulations the user has done, etc.

					function importState(state) {

						// Load a state object created by exportState().


					}

					function exportState() {

						// Return a state object that can be consumed by importState().
						return {

						};
					}

					deregister.push(palladioService.registerStateFunctions(scope.uniqueToggleId, 'idiograph', exportState, importState));

					$(document).ready(function(){
						element.find('.settings-toggle').click(function() {
							element.find('.settings').toggleClass('closed');
						});
					});
				}
			}
		};

		return directiveObj;
	});
