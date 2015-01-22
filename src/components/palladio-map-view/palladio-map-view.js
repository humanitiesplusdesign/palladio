angular.module('palladioMapView', ['palladio', 'palladio.services'])
	.directive('palladioMapView', function (palladioService) {

		var directiveDefObj = {

			scope: {
				sourceDimension : '=',
				sourceAccessor : '=',
				sourceCoordinatesAccessor : '=',
				destinationDimension : '=',
				destinationAccessor : '=',
				destinationCoordinatesAccessor : '=',
				filterDimension : '=',
				sequenceAccessor : '=',
				tileSets: '=',
				pointSize : '=',
				maxPointSize : '=',
				showLinks : '=',
				type : '=',
				countBy : '@',
				countDescription: '@',
				aggregationType: '@',
				aggregateKey: '@',
				descriptionField: '='
			},

			link: function (scope, element, attrs) {

				var uniqueId = "mapView" + Math.floor(Math.random() * 10000);
				var deregister = [];
				var search = '';
				var l; // User-defined map layer

				deregister.push(palladioService.onUpdate(uniqueId, function() {
					// Only update if the table is visible.
					if(element.is(':visible')) { update(); }
				}));

				// Update when it becomes visible (updating when not visibile errors out)
				scope.$watch(function() { return element.is(':visible'); }, update);

				scope.$watchGroup(['countBy', 'aggregationType', 'pointSize',
					'aggregationKey', 'type', 'descriptionField', 'maxPointSize'], function (nv, ov) {

					if(nv[0] !== ov[0] || nv[1] !== ov[1] || nv[2] !== ov[2] || nv[3] !== ov[3] ||
						nv[4] !== ov[4] || nv[5] !== ov[5]) {

						clearGroups();
						update();
					}
				});

				scope.$watch('sourceCoordinatesAccessor', function (nv, ov) {
					if(scope.sourceCoordinatesAccessor) {
						clearGroups();
					}
				});

				scope.$watch('destinationCoordinatesAccessor', function (nv, ov) {
					if(scope.destinationCoordinatesAccessor) {
						clearGroups();
					}
				});

				function clearGroups() {
					if(sourceGroups) sourceGroups.remove();
					sourceGroups = null;
					if(destGroups) destGroups.remove();
					destGroups = null;
					if(nestedGroups) nestedGroups.remove();
					nestedGroups = null;
				}

				scope.$watchGroup(['sourceAccessor', 'destinationAccessor', 'sourceDimension',
					'destinationDimension', 'sequenceAccessor', 'pointSize', 'showLinks'] , update);
				scope.$watch('filterDimension', function () {
					palladioService.removeFilter(identifier);
					palladioService.update();
					update(); // Necessary?
				});

				deregister.push(palladioService.onSearch(uniqueId, function(text) {
					search = text;
					highlight();
				}));

				var sourceGroups, destGroups, nestedGroups;

				/* Creates geoJson features for points */

				function createPoints(objects, accessor) {

					var obj = { "type": "FeatureCollection", "features": [] };

					obj.features = objects.map(function(d){
						return {
							"type": "Feature",
							"geometry": {
								"type": "Point",
								"coordinates": accessor(d)
							},
							"properties": d
						};
					});

					return obj;
				}

				/* Creating geoJson Lines features */

				function createLines(objects, accessor) {

					var obj = { "type": "FeatureCollection", "features": [] };

					obj.features = objects.map(function(d){
						// Check these are valid numbers
						if(	!isNaN(+accessor(d)[0][0]) &&
							!isNaN(+accessor(d)[0][1]) &&
							!isNaN(+accessor(d)[1][0]) &&
							!isNaN(+accessor(d)[1][1]) ) {

							return {
								"type": "Feature",
								"geometry": {
									"type": "LineString",
									"coordinates": accessor(d)
								},
								"properties": d
								};
							}
						}
					).filter(function (d) { return d; });

					return obj;
				}

				function points() {

					var helpers;

					var sourceAccessor =  scope.sourceAccessor || scope.sourceCoordinatesAccessor,
						destinationAccessor =  scope.destinationAccessor || scope.destinationCoordinatesAccessor;

					if(!sourceGroups) {
						if(!scope.countBy) {
							sourceGroups = scope.sourceDimension.group().reduce(
								function (p, v) {
									p.data.description = sourceAccessor(v);
									p.data.agg++;
									if(p.data.agg > p.data.initialAgg) p.data.initialAgg = p.data.agg;
									return p;
								},
								function (p, v) {
									p.data.agg--;
									return p;
								},
								function () {
									return { data: { agg: 0, initialAgg: 0 }, initialCount: 0 };
								}
							).order(function (p) { return p.data.agg; });
						} else {
							helpers = crossfilterHelpers.countByDimensionWithInitialCountAndData(
								function(v) { return v[scope.countBy]; },
								function (d, p, t) {
									if(p === undefined) {
										p = { agg: 0, initialAgg: 0, description: sourceAccessor(d) };
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
							sourceGroups = scope.sourceDimension.group().reduce(
								helpers.add,
								helpers.remove,
								helpers.init
							).order(function (p) { return p.data.agg; });
						}
					}

					// from destinationDimension
					if (scope.type == "point-to-point" && scope.destinationDimension && !destGroups) {
						// adding destinations
						if(!scope.countBy) {
							destGroups = scope.destinationDimension.group().reduce(
								function (p, v) {
									p.data.description = destinationAccessor(v);
									p.data.agg++;
									if(p.data.agg > p.data.initialAgg) p.data.initialAgg = p.data.agg;
									return p;
								},
								function (p, v) {
									p.data.agg--;
									return p;
								},
								function () {
									return { data: { agg: 0, initialAgg: 0 }, initialCount: 0 };
								}
							).order(function (p) { return p.data.agg; });
						} else {
							helpers = crossfilterHelpers.countByDimensionWithInitialCountAndData(
								function(v) { return v[scope.countBy]; },
								function (d, p, t) {
									if(p === undefined) {
										p = { agg: 0, initialAgg: 0, description: destinationAccessor(d) };
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
							destGroups = scope.destinationDimension.group().reduce(
								helpers.add,
								helpers.remove,
								helpers.init
							).order(function (p) { return p.data.agg; });
						}
					}

					var groupPoints = d3.map();

					sourceGroups.top(Infinity)
						.filter( function (d) { return d.key && d.value.data.agg > 0; })
						.forEach( function (d) {
							// Must copy the group value because these values will be updated if we have a destGroup.
							groupPoints.set(d.key, { data: angular.copy(d.value.data), count: d.value.count, initialCount: d.value.initialCount });
						});

					// Having to merge is not ideal. Would be better to maintain a different grouping,
					// but we'll get to that eventually.
					if(destGroups) {
						// Merge sources and destinations;
						var dests = destGroups.top(Infinity)
							.filter( function (d) { return d.key && d.value.data.agg > 0; })
							.forEach( function (d) {
								if(groupPoints.has(d.key)) {
									groupPoints.get(d.key).data.agg += +d.value.data.agg;
								} else {
									// Must copy the group value because these values will be updated.
									groupPoints.set(d.key, { data: angular.copy(d.value.data), count: d.value.count, initialCount: d.value.initialCount });
								}
							});
					}

					// remove entries for undefined coordinates
					groupPoints.remove(undefined);

					return createPoints(groupPoints.entries(), function(d){ return [ +d.key.split(',')[0], +d.key.split(',')[1] ]; });

				}


				function links() {
					if (scope.type == "points") return [];
					return scope.type == "point-to-point" ? pointToPoint() : sequence();
				}

				/* Generates links by connecting two points (i.e. source/destination) */

				function pointToPoint() {

					// aggregating links with same source and dest
					if (!scope.destinationDimension) return [];

					if(!nestedGroups) {
						var helpers = crossfilterHelpers.countByDimensionWithInitialCountAndData(
							function(v) { return v[scope.countBy]; },
							function (d, p, t) {
								if(p === undefined) {
									p = { agg: 0, initialAgg: 0, description: "Placeholder", record: d };
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

						nestedGroups = scope.filterDimension.group().reduce(
							helpers.add,
							helpers.remove,
							helpers.init
						);
					}

					var tempLinks = [];

					nestedGroups.all().forEach( function (d) {
						// s.value.nest.entries().forEach( function (d) {
							// Don't use blank latlongs.
							if(d.key[0] && d.key[1] && d.value.data.agg > 0) tempLinks.push(
								{
									source: d.key[0],
									destination: d.key[1],
									value: d.value.data.agg,
									description: d.value.data.description,
									data: d.value.data.record
								}
							);
						// });
					});

					var lines = createLines(tempLinks, function(d) { return [
						// source
						[ +d.source.split(',')[0], +d.source.split(',')[1] ],
						//destination
						[ +d.destination.split(',')[0], +d.destination.split(',')[1] ]
						];
					});

					return lines;
				}

				/* Generates links by creating a sequence */

				function sequence() {
					// aggregating links with same source and dest
		        	if (!scope.sequenceAccessor) return [];

		        	var nodes = scope.sourceDimension.top(Infinity).filter( function (d) { return scope.sourceDimension.accessor(d); });

		        	nodes = nodes.sort( function(a,b){ return scope.sequenceAccessor(a) - scope.sequenceAccessor(b); });

		        	var links = []

		        	for (var l=0; l<nodes.length-2; l++){
		        		links.push({ source: scope.sourceCoordinatesAccessor(nodes[l]), destination: scope.sourceCoordinatesAccessor(nodes[l+1]) });
		        	}

		        	links = createLines(links, function(d) { return [
		        		// source
			        		[ +d.source.split(',')[0], +d.source.split(',')[1] ],
			        		//destination
			        		[ +d.destination.split(',')[0], +d.destination.split(',')[1] ]
		        		];
		        	})

		        	return links;
				}

				function update() {

					if (!scope.sourceDimension) return;

					var svg = d3.select(m.getPanes().overlayPane).selectAll("svg")
		          		.data([Object])
		          	svg.enter().append("svg");
		          	svg.exit().remove();

		        	var g = svg.selectAll("g.leaflet-zoom-hide")
		          		.data(function(d){ return [d]; })
		          	g.enter().append("g").attr("class", "leaflet-zoom-hide");
					g.exit().remove();

					// creation of nodes and links

					var nodes = points(),
						edges = links,
						line = d3.svg.line().interpolate('bundle'),
						maxPointSize = scope.maxPointSize ? +scope.maxPointSize : d3.max(nodes.features, function(d){ return d.properties.value.data.initialAgg; });
						pointSize = scope.pointSize ?
							d3.scale.sqrt().domain(
					       		[ 1, maxPointSize ]
					       	).range([3,26]) :
					       	function(){ return 3; },
						path = d3.geo.path()
							.pointRadius(function(d){ return pointSize(d.properties.value.data.agg);})
							.projection(project),
   						value = edges.feature ? d3.scale.linear().domain([ d3.min(edges.features, function(d){ return d.properties.value; }), d3.max(edges.features, function(d){ return d.properties.value; }) ]).range([2,20]) : function(d){ return 2; };

   					if(!scope.maxPointSize) scope.maxPointSize = maxPointSize;

					svg.call(nodeTip);
					svg.call(linkTip);

			        m.on("viewreset", draw);
			        m.on("moveend", draw);

			        draw();

			        function draw() {

			        	var w = d3.select(element[0]).style("width"),
			        		h = d3.select(element[0]).style("height")

			        	var bounds = m.getBounds(),
			        		topRight = project(bounds._northEast),
			              	bottomLeft = project(bounds._southWest);

			          	svg .attr("width", w)//topRight[0] - bottomLeft[0])
			              	.attr("height", h)//bottomLeft[1] - topRight[1])
			              	.style("margin-left", bottomLeft[0] + "px")
			              	.style("margin-top", topRight[1] + "px");

					    g 	.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");


					    // links, if any...

					    var links = scope.showLinks ? edges().features || [] : [];

					    link = g.selectAll(".link")
							.data(links, function(d) { return d.properties.source + "-" + d.properties.destination; })

						link.exit().remove();

						link
							.attr("stroke-width", function(d){ return value(d.properties.value); })
							.attr("d", curve)
							//.tooltip(tooltipLink)
							.on("click", function(d){
								scope.filterDimension.filter(function (c) {
									return c[0] === d.properties.source &&
										c[1] === d.properties.destination;
								});
						    	// scope.sourceDimension.filter(d.properties.source);
						    	// scope.destinationDimension.filter(d.properties.destination);
						    	deregister.push(palladioService.setFilter(identifier, scope.title, scope.sourceAccessor(d.properties.data) + "/" + scope.destinationAccessor(d.properties.data), resetLink));
								palladioService.update();
						    })
						    .on("mouseover", linkTip.show)
							.on("mouseout", linkTip.hide)

						link.enter().append("path")
							.classed("link",true)
							.attr("stroke-width", function(d){ return value(d.properties.value); })
							.attr("stroke-linecap", "round")
							.style("fill","none")
							.style("stroke","#000")
							.style("opacity",".2")
							.attr("d", curve)
							//.tooltip(tooltipLink)
							.on("click", function(d){
								scope.filterDimension.filter(function (c) {
									return c[0] === d.properties.source &&
										c[1] === d.properties.destination;
								});
						    	// scope.sourceDimension.filter(d.properties.source);
						    	// scope.destinationDimension.filter(d.properties.destination);
						    	deregister.push(palladioService.setFilter(identifier, scope.title, scope.sourceAccessor(d.properties.data) + "/" + scope.destinationAccessor(d.properties.data), resetLink));
								palladioService.update();
						    })
						    .on("mouseover", linkTip.show)
							.on("mouseout", linkTip.hide)

						// This function should do what needs to be done to remove the filter.
				    	var resetLink = function () {
				    		scope.filterDimension.filterAll();
				    		palladioService.removeFilter(identifier);
				    		palladioService.update();
				    	}


			        	// nodes

			        	node = g.selectAll(".node")
			            	.data(nodes.features, function (d) { return d.properties.key; });

			            node.exit().remove();

			          	node
				          	.attr("d", path)
				          	//.tooltip(tooltipNode)
				          	.on("click", function(d){
						    	scope.filterDimension.filter(function (c) {
									return c[0] === d.properties.key ||
										c[1] === d.properties.key;
								});
						    	// scope.sourceDimension.filter(d.properties.key);
						    	deregister.push(palladioService.setFilter(identifier, scope.title, d.properties.value.data.description, resetNode));
								palladioService.update();
						    })
						    .on("mouseover", nodeTip.show)
							.on("mouseout", nodeTip.hide)

				        node.enter().append('path')
				          	.classed("node",true)
						    .attr("d", path)
						    .style("fill", "#444")
						    .style("stroke", "#fff")
						    //.tooltip(tooltipNode)
						    .on("click", function(d){
						    	nodeTip.hide();
						    	scope.filterDimension.filter(function (c) {
									return c[0] === d.properties.key ||
										c[1] === d.properties.key;
								});
						    	// scope.sourceDimension.filter(d.properties.key);
						    	deregister.push(palladioService.setFilter(identifier, scope.title, d.properties.value.data.description, resetNode));
								palladioService.update();
						    })
						    .on("mouseover", nodeTip.show)
							.on("mouseout", nodeTip.hide)

						// This function should do what needs to be done to remove the filter.
				    	var resetNode = function () {
				    		scope.filterDimension.filterAll();
				    		palladioService.removeFilter(identifier);
				    		palladioService.update();
				    	}

				    	highlight();

				    	// legend

				    	if(scope.pointSize) {
							
					    	d3.select(element[0]).selectAll("div.legend").remove();

					    	if (!scope.pointSize) return;

					    	var circles,legend,labels;

					    	legend = d3.select(element[0]).selectAll("div.legend")
			          			.data(function(d){ return [d]; })
			          			.enter()
			          			.append("div")
			          			.attr("class", "legend")
			          			//.style("min-width", function(){ return pointSize(maxPointSize) * 2 + "px"; })
			          			//.style("min-height", function(){ return pointSize(maxPointSize) * 2 + "px"; })
			          			.append("div")
			          				.style("position","relative");

							legend.append("div")
								.attr("class","legend-title")
								.html(scope.countDescription);

							legend.selectAll("div.circle")
								.data([ maxPointSize, 1 ])
								.enter().append("div")
									.attr("class", "circle")
									.style("width", function (d,i){ return (pointSize(d) * 2) + "px"; })
									.style("height", function (d,i){ return (pointSize(d) * 2) + "px"; })
									.style("border-radius", "50%")
									.style("margin-top", function(d,i){ return d < maxPointSize ? -(pointSize(d)*2) + "px" : 0; })
									.style("margin-left", function(d,i){ return d < maxPointSize ? (pointSize(maxPointSize)-pointSize(d)) + "px" : 0; })
									.append("span")
										.attr("class","legend-title")
										.style("margin-left", function(d){ return (-(pointSize(maxPointSize)-pointSize(d))+pointSize(maxPointSize)*2 + 10) + "px"; })
										.html(String)
							
						}
			        }

			        function tooltipNode(d,i){

					    return {
						    type: "tooltip",
						    text: d.properties.value.data.description + " (" + d.properties.value.data.agg + ")",//source + " → " + destination + " (" + d.properties.value + ")",
						    detection: "shape",
						    placement: "mouse",
						    gravity: "top",
						    displacement: [-(d.properties.value.data.description).length*7/2, 0],
						    mousemove: true
					    };
					}

					function tooltipLink(d,i){

						var source = scope.sourceAccessor ? scope.sourceAccessor(d.properties.data) : scope.sourceCoordinatesAccessor(d.properties.data),
							destination = scope.destinationAccessor ? scope.destinationAccessor(d.properties.data) : scope.destinationCoordinatesAccessor(d.properties.data);

						return {
						    type: "tooltip",
						    text: source + " → " + destination + " (" + d.properties.value + ")",
						    detection: "shape",
						    placement: "mouse",
						    gravity: "top",
						    displacement: [-(source + " → " + destination + " (" + d.properties.value + ")").length*5/2, 0],
						    mousemove: true
					    };
					}

			        function project(x) {
			        	var point = m.latLngToLayerPoint(x);
			        	return [point.x, point.y];
			        }

			        function curve(d) {

			        	var source = project(d.geometry.coordinates[0]),
							target = project(d.geometry.coordinates[1]),
			        		rad = Math.sqrt( Math.pow(target[0]-source[0],2) + Math.pow(target[1]-source[1], 2) )/4,
							sourceP = Math.atan2((target[1]-source[1]),(target[0]-source[0])) - Math.PI/10,
							targetP = Math.atan2((source[1]-target[1]),(source[0]-target[0])) + Math.PI/10

						return line([
							[source[0], source[1]],
							[source[0]+rad*Math.cos(sourceP),source[1]+rad*Math.sin(sourceP)],
							[target[0]+rad*Math.cos(targetP),target[1]+rad*Math.sin(targetP)],
							[target[0],target[1]]
						]);
			        }


				}

				function highlight(){

					if (!node) return;

					var sourceAccessor =  scope.sourceAccessor || scope.sourceCoordinatesAccessor,
						destinationAccessor =  scope.destinationAccessor || scope.destinationCoordinatesAccessor;

		        	// no highlight
		        	if (!search || !search.length) {
		        		node.classed("hidden-node", false);
		        		link.classed("hidden-link", false);
		        		return;
		        	}

		        	// some highlight
		        	node.classed("hidden-node", function(d){
		        		var found = d.properties.value.data.description.toLowerCase().indexOf(search.toLowerCase()) !== -1;
		        		return found ? false : true;
		        	})

		        	link.classed("hidden-link", function(d){
		        		var found = sourceAccessor(d.properties.data).toLowerCase().indexOf(search.toLowerCase()) !== -1 || destinationAccessor(d.properties.data).toLowerCase().indexOf(search.toLowerCase()) !== -1;
		        		return found ? false : true;
		        	})

		        }

		        function reCalculatePointSize() {
		        	return d3.scale.sqrt().domain(
			       		[ 1, d3.max(nodes.features, function(d){ return d.properties.value.data.agg; }) ]).range([3,26]);
		        }

		        // Set up HTTPS URLS for 1.0 API
		        L.mapbox.config.HTTP_URLS = ["https://a.tiles.mapbox.com/v3/", "https://b.tiles.mapbox.com/v3/", "https://c.tiles.mapbox.com/v3/", "https://d.tiles.mapbox.com/v3/"]

				// init map
				var node,
					link,
					zoom = 3,
		        	minZoom = 1,
		        	maxZoom = 20,
		        	coordinates = [45.4640, 9.1916],
		        	m = new L.Map(element[0], {
		            	center: new L.LatLng(coordinates[0], coordinates[1]),
		            	zoom: zoom,
		            	minZoom : minZoom,
		            	maxZoom : maxZoom,
		            	scrollWheelZoom : true
		       		});

				// Tooltips
				var nodeTip = d3.tip()
				  	.offset([-10, 0])
				  	.attr("class","d3-tip")
				  	.html(function(d){ return d.properties.value.data.description + " (" + d.properties.value.data.agg + ")"; });

				var linkTip = d3.tip()
				  	//.offset([0, 0])
				  	.attr("class","d3-tip")
				  	.html(function(d){
				  		var source = scope.sourceAccessor ? scope.sourceAccessor(d.properties.data) : scope.sourceCoordinatesAccessor(d.properties.data),
						destination = scope.destinationAccessor ? scope.destinationAccessor(d.properties.data) : scope.destinationCoordinatesAccessor(d.properties.data);
						return source + " → " + destination + " (" + d.properties.value + ")"
				  	});

		 		scope.title = "Map View"
		       	var identifier = "" + scope.title + Math.floor(Math.random() * 10000);

		       	var filterDimension = null;

		       	scope.$watchCollection('tileSets', function () {
					scope.tileSets.forEach(function(ts, i) {
						if(!ts.layer) {
							if(ts.url) {
								// Example: http://a.tile.stamen.com/watercolor/{z}/{x}/{y}.png
								ts.layer = L.tileLayer(ts.url);
							}
							if(ts.mbId) {
								// Assume we have a mapbox id. Example: esjewett.k36b48ge
								ts.layer = L.mapbox.tileLayer(ts.mbId);
							}
							if(ts.geoJson) {
								// User has pasted in geoJson
								ts.layer = L.geoJson(ts.geoJson, {
									style: function (feature) {
										return {
											'color': feature.properties.color ? feature.properties.color : "black",
											'stroke': feature.properties.color ? feature.properties.color : "black",
											'fill': feature.properties.color ? feature.properties.color : "black",
											'opacity': feature.properties.opacity ? feature.properties.opacity : 1,
											'stroke-opacity': feature.properties.opacity ? feature.properties.opacity : 1,
											'fill-opacity': feature.properties.opacity ? feature.properties.opacity : 1
										};
									},
									onEachFeature: function (feature, layer) {
										if(feature.properties.description) {
											layer.bindPopup(feature.properties.description);
										}
									}
								});
							}

							if(ts.layer) {
								m.addLayer(ts.layer);
								ts.toggle = function () {
									ts.enabled = !ts.enabled;
									if(ts.enabled) {
										ts.layer.setOpacity(1);
									} else {
										ts.layer.setOpacity(0);
									}
								}
							}
						}

						if(ts.layer) {
							// As we cycle through the layers, bring them to the front in order,
							// resulting in them being re-ordered according to the current sort.
							ts.layer.bringToBack();
							
							// Update remove function to the current index.
							ts.remove = function() {
								m.removeLayer(ts.layer);
								scope.tileSets.splice(i, 1);
							};
						}
					});
				});

				scope.$on("resize", function(){
					m.invalidateSize(false);
				});

				function refresh() {
					element.height($(window).height()-50);
					m.invalidateSize(false);
				}

				$(document).ready(refresh);
				$(window).resize(refresh);
				scope.$on("changeLayout", function(){
					m.invalidateSize(false);
				});
			}
		};

		return directiveDefObj;
	})
	.directive('palladioMapViewWithSettings', function (dataService, palladioService) {
		var directiveObj = {
			scope: true,

			templateUrl : 'partials/palladio-map-view/template.html',

			link: { pre: function(scope, element, attrs) {

				scope.metadata = dataService.getDataSync().metadata;
				scope.xfilter = dataService.getDataSync().xfilter;

				scope.tileSets = [
					{
						"url": null,
						"mbId": 'cesta.hd9ak6ie',
						"enabled": true,
						"description": "Land",
						"layer": null
					}
				];

				scope.uniqueToggleId = "mapView" + Math.floor(Math.random() * 10000);
				scope.uniqueModalId = scope.uniqueToggleId + "modal";

				var deregister = [];

				scope.mapTypes = [
					{
						label : 'Points',
						value : 'points',
						description : 'Use this map to display points on the map...'
					},
					{
						label : 'Point to point',
						value : 'point-to-point'
					}/*,
					{
						label : 'Sequence of points',
						value : 'sequence'
					}*/
				];

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
				scope.showLayerModal = function () { $('#' + scope.uniqueModalId).find('#layer-modal').modal('show'); }

				scope.descriptiveDims = scope.metadata
						// We only allow choosing dimensions from the same origin file as the first coordinate dimension
						.filter( function (d) { return scope.metadata.filter(function (d) { return d.type === 'latlong' })[0] ? d.originFileId ===  scope.metadata.filter(function (d) { return d.type === 'latlong' })[0].originFileId : true; })
						.sort(function (a, b) { return a.countDescription < b.countDescription ? -1 : 1; });
				// If the first coordinates field has a descriptive field defined, default to that. Otherwise
				// just use the coordinates field directly.
				if(scope.metadata.filter(function (d) { return d.type === 'latlong' })[0]) {
					scope.descriptiveDim = scope.metadata.filter(function (d) { return d.type === 'latlong' })[0].descriptiveField ?
						scope.metadata.filter(function (d) { return d.type === 'latlong' })[0].descriptiveField :
						scope.metadata.filter(function (d) { return d.type === 'latlong' })[0];
				}
				scope.showDescriptionModal = function () { $('#' + scope.uniqueModalId).find('#description-modal').modal('show'); };

				scope.stringFields = scope.metadata.filter(function (d) { return d.type === 'text'; });
				scope.latlonFields = []

				scope.filterDimension = null;

				scope.metadata.filter(function (d) { return d.type === 'latlong'; }).forEach( function(d) {
					if(d.typeField === undefined || d.typeField.length === 0) {
						scope.latlonFields.push(d);
					} else {
						d.typeFieldUniques.forEach( function (u) {
							u.forEach( function (v) {
								var tempField = angular.copy(d);
								// Get the description of the link field
								tempField.description = scope.metadata.filter( function (n) { return n.key === v; })[0].description;
								scope.latlonFields.push(tempField);
							});
						});
					}
				});

				var oldMax;
				scope.$watch('fixScale', function (nv) {
					// When fixScale is unchecked, squirrel away the old maxPointSize and set it to null.
					if(!nv) {
						oldMax = scope.maxPointSize;
						scope.maxPointSize = null;
					} else {
						if(oldMax) scope.maxPointSize = oldMax;
					}
				});

				scope.dateFields = scope.metadata.filter(function (d) { return d.type === 'date'; });

				scope.showLinks = true;

				scope.mapType = scope.mapTypes[0];

				scope.mapping = {};

				// There can be only one count-by key, so no selection for this one.
				if(scope.metadata.filter(function (d) { return d.countBy === true; })[0]) {
					scope.countBy = scope.metadata.filter(function (d) { return d.countBy === true; })[0].key;
					scope.countDescription = scope.metadata.filter(function (d) { return d.countBy === true; })[0].description;
				}

				/*scope.$watch('mapping.source', function(){
					scope.sourceAccessor = !scope.mapping.source ? null : function(d) { return d[scope.mapping.source.key]; };
				})*/

				scope.$watch('mapping.sourceCoordinates', function (nv, ov){
					if(nv !== ov) {
						// If we are dealing with a type-based field, build a lookup mapping.
						var typeMap = d3.map();

						if(scope.mapping.sourceCoordinates && scope.mapping.sourceCoordinates.typeField !== undefined) {
							scope.data.filter( function (d) {
								return d[scope.mapping.sourceCoordinates.typeField].indexOf(scope.mapping.sourceCoordinates.description) !== -1;
							}).forEach( function (d) {
								typeMap.set(d[scope.mapping.sourceCoordinates.description], d);
							})
						}

						scope.sourceCoordinatesAccessor = !scope.mapping.sourceCoordinates ? null :
							function(d) {
								if(scope.mapping.sourceCoordinates.typeField === undefined) {
									return "" + d[scope.mapping.sourceCoordinates.key];
								} else {
									if(typeMap.has(d[scope.mapping.sourceCoordinates.description])) {
										return "" + typeMap.get(d[scope.mapping.sourceCoordinates.description])[scope.mapping.sourceCoordinates.key];
									} else {
										return "" + d[scope.mapping.sourceCoordinates.key];
									}
								}
							};

						scope.sourceAccessor = !scope.mapping.sourceCoordinates ? null :
							function(d) {
								if(scope.mapping.sourceCoordinates.typeField === undefined) {
									if(scope.descriptiveDim) {
										return "" + d[scope.descriptiveDim.key];
									} else {
										return "" + d[scope.mapping.sourceCoordinates.key];
									}
								} else {
									if(typeMap.has(d[scope.mapping.sourceCoordinates.description])) {
										return "" + typeMap.get(d[scope.mapping.sourceCoordinates.description])[scope.descriptiveDim.key];
									} else {
										return "" + d[scope.mapping.sourceCoordinates.key];
									}
								}
							};

						if (scope.source) scope.source.remove();
						scope.source = !scope.mapping.sourceCoordinates ? null : scope.xfilter.dimension(scope.sourceCoordinatesAccessor);
						buildFilterDimension();
					}
				});


				/*scope.$watch('mapping.destination', function(){
					scope.destinationAccessor = !scope.mapping.destination ? null : function(d) { return d[scope.mapping.destination.key]; };
				})*/

				scope.$watch('mapping.destinationCoordinates', function (nv, ov){
					if(nv !== ov) {
						// If we are dealing with a type-based field, build a lookup mapping.
						var typeMap = d3.map();
						if(scope.mapping.destinationCoordinates && scope.mapping.destinationCoordinates.typeField !== undefined) {
							scope.data.filter( function (d) {
								return d[scope.mapping.destinationCoordinates.typeField].indexOf(scope.mapping.destinationCoordinates.description) !== -1;
							}).forEach( function (d) {
								typeMap.set(d[scope.mapping.destinationCoordinates.description], d);
							})
						}

						scope.destinationCoordinatesAccessor = !scope.mapping.destinationCoordinates ? null :
							function(d) {
								if(scope.mapping.destinationCoordinates.typeField === undefined) {
									return "" + d[scope.mapping.destinationCoordinates.key];
								} else {
									if(typeMap.has(d[scope.mapping.destinationCoordinates.description])) {
										return "" + typeMap.get(d[scope.mapping.destinationCoordinates.description])[scope.mapping.destinationCoordinates.key];
									} else {
										return "";
									}
								}
							};

						scope.destinationAccessor = !scope.mapping.destinationCoordinates ? null :
							function(d) {
								if(scope.mapping.destinationCoordinates.typeField === undefined) {
									if(scope.descriptiveDim) {
										return "" + d[scope.descriptiveDim.key];
									} else {
										return "" + d[scope.mapping.destinationCoordinates.key];
									}
								} else {
									if(typeMap.has(d[scope.mapping.destinationCoordinates.description])) {
										return "" + typeMap.get(d[scope.mapping.destinationCoordinates.description])[scope.descriptiveDim.key];
									} else {
										return "";
									}
								}
							};

						if (scope.destination) scope.destination.remove();
						scope.destination = !scope.mapping.destinationCoordinates ? null : scope.xfilter.dimension(scope.destinationCoordinatesAccessor);
						buildFilterDimension();
					}
				});

				scope.$watch('mapping.sequence', function(){
					scope.sequenceAccessor = !scope.mapping.sequence ? null : function(d) { return new Date(d[scope.mapping.sequence.key]); };
				})

				// Clean up after ourselves. Remove dimensions that we have created. If we
				// created watches on another scope, destroy those as well.
				scope.$on('$destroy', function () {
					if(scope.source) scope.source.remove();
					if(scope.destination) scope.destination.remove();
					deregister.forEach(function(f) { f(); });
				});

				function buildFilterDimension () {
					if(scope.filterDimension) {
						scope.filterDimension.filterAll();
						scope.filterDimension.remove();
					}
					if(scope.source) {
						if(scope.destination) {
							scope.filterDimension = scope.xfilter.dimension(function (d) {
								return [scope.source.accessor(d), scope.destination.accessor(d)];
							});
						} else {
							scope.filterDimension = scope.xfilter.dimension(function (d) {
								return [scope.source.accessor(d)];
							});
						}
					}
				}

				// State save/load.

				function importState(state) {
					scope.$apply(function (s) {
						s.countDim = state.countDim;
						s.descriptiveDim = state.descriptiveDim;
						s.showLinks = state.showLinks;
						s.tileSets = state.tileSets;
						s.pointSize = state.pointSize;
						s.mapType = s.mapTypes.filter(function (d) { return d.value === state.mapType.value; })[0];
						if(state.mapping.sourceCoordinates) {
							s.mapping.sourceCoordinates =
								s.latlonFields
									.filter(function (d) {
										return d.description === state.mapping.sourceCoordinates.description; })[0];
						}

						if(state.mapping.destinationCoordinates) {
							s.mapping.destinationCoordinates =
								s.latlonFields
									.filter(function (d) {
										return d.description === state.mapping.destinationCoordinates.description; })[0];
						}
						if(state.aggDimKey) {
							s.aggDim = s.aggDims.filter(function(f) { return f.key === state.aggDimKey; })[0];
						}
					});
				}

				function exportState() {
					return {
						countDim: scope.countDim,
						descriptiveDim: scope.descriptiveDim,
						showLinks: scope.showLinks,
						tileSets: scope.tileSets.map(function (t) {
							return {
								"url": t.url,
								"mbId": t.mbId,
								"geoJson": t.geoJson,
								"enabled": t.enabled,
								"description": t.description,
							};
						}),
						pointSize: scope.pointSize,
						mapType: scope.mapType,
						mapping: scope.mapping,
						aggDimKey: scope.aggDim.key
					};
				}

				deregister.push(palladioService.registerStateFunctions(scope.uniqueToggleId, 'mapView', exportState, importState));

			}, post: function(scope, element, attrs) {

				$(document).ready(function(){

					element.find('.toggle').click(function() {

					  //element.find('a.toggle i').toggleClass('icon-edit icon-arrow-left');
					  element.find('.settings').toggleClass('open close');

					  // resize signal
					  //scope.$broadcast("resize")

					});
				});
			} }
		};

		return directiveObj;
	})
	.directive('layerModal', function () {
		return {
			replace : true,
			scope : {
				layers: '='
			},
			template: '<div class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
  				'<div class="modal-header">' +
			    	'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>' +
			    	'<h4 style="line-height: normal">Add a new map layer</h4>' +
			  	'</div>' +
			  	'<div class="modal-body" style="min-height: 280px">' +
			    	'<form class="form-horizontal">' +
						
						'<div class="control-group">' +
							'<label class="control-label" for="layerDescription">Description</label>' +
							'<div class="controls">' +
								'<input type="text" placeholder="Description" id="layerDescription" ng-model="description" class="span8">' +
							'</div>' +
						'</div>' +
						
						'<div class="control-group">' +
							'<label class="control-label">Choose one of Palladio default layers or create a new one.</label>' +
							'<div class="controls">' +
								'<div class="span8">' +
									'<select bs-select data-placeholder="Choose a style" ng-model="layerOption" ng-options="t as t.description for t in layerOptions" class="form-control show-tick"></select>' +
								'</div>' +
							'</div>' +
						'</div>' +

						'<div class="control-group" ng-show="layerOption && layerOption.custom">' +
							'<label class="control-label" for="layerUrl">Tileset URL <span class="help-block">Includes {x}, {y}, {z}</span></label>' +
							'<div class="controls">' +
								'<input type="text" id="layerUrl" ng-model="url" class="span8">' +
							'</div>' +
						'</div>' +

						'<div class="control-group" ng-show="layerOption && layerOption.custom">' +
							'<label class="control-label" for="layerMbId">Mapbox ID<span class="help-block">A Mapbox project ID</span></label>' +
							'<div class="controls">' +
								'<input type="text" id="layerMbId" ng-model="mbId" class="span8">' +
							'</div>' +
						'</div>' +

						'<div class="control-group" ng-show="layerOption && layerOption.custom">' +
							'<label class="control-label" for="layerGeoJSON">geoJSON<span class="help-block">Paste geoJSON</span></label>' +
							'<div class="controls">' +
								'<textarea class="span8" id="layerGeoJSON" ng-model="geoJson" ui-codemirror="{ mode : \'javascript\', lineNumbers : true, lineWrapping: true }" placeholder="Paste your geoJSON data or drop a file here"></textarea>' +
							'</div>' +
						'</div>' +
					'</form>' +
			  	'</div>' +
			  	'<div class="modal-footer" style="display:block;">' +
			  		'<button class="btn" data-dismiss="modal" data-ng-click="addLayer()">Add</button>' +
			    	'<button class="btn" data-dismiss="modal">Close</button>' +
			  	'</div>' +
			'</div>',

			link: function postLink(scope, elements, attrs) {

				scope.layerOptions = [
					{
						"mbId": "cesta.hd9ak6ie",
						"description": "Land",
					},
					{
						"mbId": "cesta.k8g7eofo",
						"description": "Buildings and Areas",
					},
					{
						"mbId": "cesta.k8m9p19p",
						"description": "Streets",
					},
					{
						"mbId": "cesta.k8ghh462",
						"description": "Terrain",
					},
					{
						"mbId": "cesta.k8gof2np",
						"description": "Satellite",
					},
					{
						"custom" : true,
						"description": "Custom...",
					}
				]

				scope.layerOption = scope.layerOptions[0];
				
				scope.addLayer = function () {

					if (scope.layerOption && !scope.layerOption.custom) {
						scope.layers.push({
							"url": null,
							"geoJson": null,
							"mbId": scope.layerOption.mbId,
							"enabled": true,
							"description": scope.description ? scope.description : scope.layerOption.description,
							"layer": null
						});
					}
					else if (scope.url || scope.mbId || scope.geoJson) {
						scope.layers.push({
							"url": scope.url ? scope.url : null,
							"geoJson": scope.geoJson ? JSON.parse(scope.geoJson) : null,
							"mbId": scope.mbId ? scope.mbId : null,
							"enabled": true,
							"description": scope.description,
							"layer": null
						});
					}

					scope.url = null;
					scope.mbId = null;
					scope.geoJson = null;
					scope.description = null;
				}
			}
		};
	});
