(function(){

	d3.graph = function(){

		var width = 700,
			height = 600,
			showLinks = true,
			showLables = true,
			searchText = "",
			circle = false,
			nodeSize = false,
			nodeSizeChange = function () {},
			highlightSource = function () {},
			highlightTarget = function () {},
			removeHighlight = function () {};

		var force, forceLabel, drag, line, zoom, overlay, main, nodes, path, paths, node, anchorLink, anchorNode, anchorNodeText, anchorNodeCircle, labelAnchors, labelAnchorLinks, nodeLabel, nodeLabelShadow,
			nodeLabelText, initialAggs, resetFunc, canvas, links;

		resetFunc = function () { };

		initialAggs = d3.map();
		nodes = d3.map();
		links = [];
		labelAnchors = d3.map();
		labelAnchorLinks = [];

		var sizeScale = d3.scale.sqrt().range([5,20]);

		/* Chart function */

		function chart(selection){
			selection.each(function (data) {

				if(!force) initialize();

				// Creating nodes

				nodes.keys().forEach(function (k) {
					nodes.get(k).current = false;
					nodes.get(k).agg = 0;
				});

				data.forEach(function (link) {
					if(nodes.has(link.data.source)) {
						nodes.get(link.data.source).current = true;
						nodes.get(link.data.source).agg += link.data.agg;

						// Apply both classes if necessary.
						if(nodes.get(link.data.source).dimension === "target") {
							nodes.get(link.data.source).dimension = "target source";
						}
					} else {
						nodes.set(link.data.source, {
							name: link.data.source,
							current: true,
							agg: link.data.agg,
							initialAgg: initialAggs.get(link.data.source),
							dimension: "source",
							x: (width / 2) + (Math.random() * 10),
							y: (height / 2) + (Math.random() * 10)
						});

						labelAnchors.set(link.data.source, { name: link.data.source, node : nodes.get(link.data.source) });
						labelAnchors.set(link.data.source + "__$", { name: link.data.source + "__$", node: nodes.get(link.data.source), fake:true });
					}
					if(nodes.has(link.data.target)) {
						nodes.get(link.data.target).current = true;
						nodes.get(link.data.target).agg += link.data.agg;

						// Apply both classes if necessary.
						if(nodes.get(link.data.target).dimension === "source") {
							nodes.get(link.data.target).dimension = "source target";
						}
					} else {
						nodes.set(link.data.target, {
							name: link.data.target,
							current: true,
							agg: link.data.agg,
							initialAgg: initialAggs.get(link.data.target),
							dimension: "target",
							x: (width / 2) + (Math.random() * 10),
							y: (height / 2) + (Math.random() * 10)
						});

						labelAnchors.set(link.data.target, { name: link.data.target, node : nodes.get(link.data.target) });
						labelAnchors.set(link.data.target + "__$", { name: link.data.target + "__$", node: nodes.get(link.data.target), fake:true });
					}
				});

				nodes.keys().forEach(function (k) {
					if(!nodes.get(k).current) {
						nodes.remove(k);
						labelAnchors.remove(k);
						labelAnchors.remove(k + "__$");
					}
				});

				// Set the domain on the size scale.
				sizeScale.domain([
					d3.min(nodes.values(), function (d) { return d.initialAgg; }),
					d3.max(nodes.values(), function (d) { return d.initialAgg; })
				]);

				// Build links.
				links = data.map(function (l) {
					return {
						source: nodes.get(l.data.source),
						target: nodes.get(l.data.target),
						agg: l.data.agg
					};
				});
				// Labels

				labelAnchorLinks = [];

				labelAnchorLinks = labelAnchors.entries().filter(function(d){ return !d.value.fake; }).map(function (d,i){
					return {
						source : labelAnchors.get(d.key),
						target : labelAnchors.get(d.key + "__$"),
						weight : 1
					};
				});

				force
					.nodes(nodes.values())
					.links(links)
					.start();

				forceLabel
					.nodes(labelAnchors.values())
					.links(labelAnchorLinks)
					.start();

				// SVG

				// Main layers
				main.selectAll(".layer").remove();
				// main.append("g").attr("class","layer links");
				main.append("g").attr("class","layer nodes");
				main.append("g").attr("class","layer labels");

				// Links

				paths = document.createElement("g");

				path = d3.select(paths)
						.attr("class", "layer links")
					.selectAll("path.link")
						.data(showLinks ? force.links() : [ ], function (d) { return d.source.name + "-" + d.target.name; });

				// Don't remove all paths. Only remove paths that have been exited before updating
				// the remaining.
				path.exit().remove();

				path.enter().append("svg:path")
					.attr("class", "link")
					.style('fill','none')
					.style('stroke-opacity','.5')
					.style('stroke','#666')
					.style('stroke-width', 1);

				// Nodes

				node = main.select(".nodes").selectAll(".node")
					.data(force.nodes(), function (d) { return d.name; });

				// Don't remove all nodes. Only remove nodes that have been exited before updating
				// the remaining.
				node.exit().remove();

				node.enter().append("circle")
					.attr("class", function (d) { return "node " + d.dimension; })
					.classed("fixed", function (d) { return d.fixed; })
					.attr("r", function (d) { return nodeSize ? sizeScale(d.agg) : 5; })
					.style('fill','#bbbbbb')
					.style('stroke', function (d) { return d.fixed ? "#222" : "#eee"; } )
					.style('stroke-width','2px')
					.style('fill-opacity','.95')
					.on("mouseover", mouseover)
					.on("mouseout", mouseout)
					.call(drag);

				// Labels

				anchorNode = main.select(".labels")
					.selectAll("g.anchor-node")
					.data(
						(showLabels ? forceLabel.nodes() : [ ]).filter(function (d){ return !d.fake; }),
						function (d) { return d.name; });

				// Don't remove all nodes. Only remove nodes that have been exited before updating
				// the remaining.
				anchorNode.exit().remove();

				anchorNode.enter().append("g")
					.attr("class", "anchor-node")
					.append("svg:text")
						.style("fill", "#555")
						.style("font-family", "merriweather, Arial, Helvetica")
						.style("font-size", 11)
						.text(function(d, i) {
							return d.fake ? "" : d.node.name;
						});

			});



			nodeSizeChange = function () {
				node = main.selectAll("g.node")
					.data(force.nodes(), function (d) { return d.name; })
					.attr("r", function (d) { return nodeSize ? sizeScale(d.agg) : 5; });
			};

			highlightSource = function () {
				main.selectAll(".node")
					.classed("highlighted", false)
					.style("fill","#bbb");
				main.selectAll(".source")
					.classed("highlighted", true)
					.style("fill","#666");
			};

			highlightTarget = function () {
				main.selectAll(".node")
					.classed("highlighted", false)
					.style("fill","#bbb");
				main.selectAll(".target")
					.classed("highlighted", true)
					.style("fill","#666");
			};

			removeHighlight = function () {
				main.selectAll(".node")
					.classed("highlighted", false)
					.style("fill","#bbb");
			};

			function mouseover (d,i) {
				anchorNode.classed("strong", function(a,h){ return h == i; });
			}

			function mouseout (d,i) {
				anchorNode.classed("strong", false);
			}

			function initialize() {

				force = d3.layout.force()
					.size([width, height])
					.charge(-300)
					.on("tick", redraw);

				forceLabel = d3.layout.force()
					.gravity(0)
					.linkDistance(0)
					.linkStrength(8)
					.charge(-70)
					.size([width, height]);

				drag = force.drag()
					.on("dragstart", function (d) {
						d3.event.sourceEvent.stopPropagation();
						d.fixed = true;
						d3.select(this).classed("fixed", true).style('stroke', "#222");
					})
					.on("drag.force", function (d) {
						d.px = d.x + d3.event.dx / zoom.scale();
						d.py = d.y + d3.event.dy / zoom.scale();
						force.resume();
						forceLabel.resume();
					});

				line = d3.svg.line().interpolate('bundle');

				zoom = d3.behavior.zoom().scaleExtent([0.1,10]).on("zoom", function () { zoomed = true; redraw();} );

				zoomByFactor(2);

				overlay = selection.selectAll("rect.overlay")
					.data(function(d){ return [d]; });

				overlay.attr("width", width)
					.attr("height", height)
					.attr("fill","none");

				overlay.enter().append("rect")
					.attr("class", "overlay")
					.attr("width", width)
					.attr("height", height)
					.attr("fill","none");

				overlay.exit().remove();

				selection.call(zoom);

				// main g

				main = selection.selectAll("g.main")
						.data([{}]);

				main.enter().append("g")
						.attr("class", "main");

				main.exit().remove();

				// Determine the initialAggs for each node.
				selection.each(function (data) {
					data.forEach( function (link) {
						if(initialAggs.has(link.data.source)) {
							initialAggs.set(link.data.source, initialAggs.get(link.data.source) + link.data.initialAgg);
						} else {
							initialAggs.set(link.data.source, link.data.initialAgg);
						}
						if(initialAggs.has(link.data.target)) {
							initialAggs.set(link.data.target, initialAggs.get(link.data.target) + link.data.initialAgg);
						} else {
							initialAggs.set(link.data.target, link.data.initialAgg);
						}
					});
				});

				canvas = d3.select(selection[0][0].parentElement).select('canvas').node().getContext('2d');
			}

			resetFunc = function () {
				if(node) node.remove();
				if(path) path.remove();
				if(nodeLabel) nodeLabel.remove();
				if(nodeLabelShadow) nodeLabelShadow.remove();
				nodes = d3.map();
				labelAnchors = d3.map();
				labelAnchorLinks = [];
				links = [];
				initialAggs = d3.map();
				force = null;
				initialize();
			};
		}

		function curve(d) {
			var source = d.source,
				target = d.target,
				sourceX = source.x * zoom.scale() + zoom.translate()[0],
				sourceY = source.y * zoom.scale() + zoom.translate()[1],
				targetX = target.x * zoom.scale() + zoom.translate()[0],
				targetY = target.y * zoom.scale() + zoom.translate()[1];
				// rad = Math.sqrt( Math.pow(targetX-sourceX,2) + Math.pow(targetY-sourceY, 2) )/4,
				// sourceP = Math.atan2((targetY-sourceY),(targetX-sourceX)) - Math.PI/8,
				// targetP = Math.atan2((sourceY-targetY),(sourceX-targetX)) + Math.PI/8;

			return line([
				[sourceX, sourceY],
				// [sourceX+rad*Math.cos(sourceP),sourceY+rad*Math.sin(sourceP)],
				// [targetX+rad*Math.cos(targetP),targetY+rad*Math.sin(targetP)],
				[targetX,targetY]
			]);
		}

		function updateNode() {
			this.attr("transform", function (d) {
				return "translate(" +
					(d.x * zoom.scale() + zoom.translate()[0]) + "," +
					(d.y * zoom.scale() + zoom.translate()[1]) + ")";
			});
		}

		// Flag to indicate that a zoom happened. In this case, we need to recalculate widths
		// from getBBox()
		var zoomed = true;

		function redraw() {

			node.classed("hidden", function (d) {
				return searchText &&
					d.name.toLowerCase().indexOf(searchText.toLowerCase()) === -1;
			});

			anchorNode.classed("hidden", function (d) {
				return searchText &&
					d.node.name.toLowerCase().indexOf(searchText.toLowerCase()) === -1;
			});

			// Draw canvas paths
			canvas.clearRect(0, 0, width, height);
			canvas.strokeStyle = "#ccc";
			canvas.beginPath();
			path.each(function (d) {
				if(!(searchText &&
					( d.source.name.toLowerCase().indexOf(searchText.toLowerCase()) === -1 &&
						d.target.name.toLowerCase().indexOf(searchText.toLowerCase()) === -1 ))) {
					canvas.moveTo(
						d.source.x * zoom.scale() + zoom.translate()[0],
						d.source.y * zoom.scale() + zoom.translate()[1]);
					canvas.lineTo(
						d.target.x * zoom.scale() + zoom.translate()[0],
						d.target.y * zoom.scale() + zoom.translate()[1]);
				}
			});
			canvas.stroke();

			node.call(updateNode);

			forceLabel.nodes().forEach(function(d){
				if (!d.fake) return;
				d.x = d.node.x;
				d.y = d.node.y;
			});

			var shiftX, shiftY, diffX, diffY, dist;
			anchorNode.each(function (d) {
				if(zoomed) {
					d.width = this.childNodes[0].getBBox().width;
				}
				// b = this.childNodes[0].getBBox();
				diffX = d.x - d.node.x;
				diffY = d.y - d.node.y;
				dist = Math.sqrt(diffX * diffX + diffY * diffY);

				shiftX = d.width * (diffX - dist) / (dist * 2);
				shiftX = Math.max(-d.width, Math.min(0, shiftX));
				shiftY = 5;
				if(shiftX && shiftY) {
					this.childNodes[0].setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
				}
			});

			anchorNode.call(updateNode);

			zoomed = false;
		}

		function zoomByFactor(factor) {
			zoomed = true;
			var scale = zoom.scale();
			var extent = zoom.scaleExtent();
			var newScale = scale * factor;
			if (extent[0] <= newScale && newScale <= extent[1]) {
				var t = zoom.translate();
				var c = [width / 2, height / 2];
				zoom
				.scale(newScale)
				.translate(
					[c[0] + (t[0] - c[0]) / scale * newScale,
					c[1] + (t[1] - c[1]) / scale * newScale]);
			}
		}

		/* Getter/Setter */

		chart.height = function(x) {
			if (!arguments.length) return height;
			height = x;
			return chart;
		};

		chart.width = function(x) {
			if (!arguments.length) return width;
			width = x;
			return chart;
		};

		chart.showLinks = function(x) {
			if (!arguments.length) return showLinks;
			showLinks = x;
			return chart;
		};

		chart.showLabels = function(x) {
			if (!arguments.length) return showLabels;
			showLabels = x;
			return chart;
		};

		chart.searchText = function(x) {
			if (!arguments.length) return searchText;
			searchText = x;
			return chart;
		};

		chart.nodeSize = function (x) {
			if (!arguments.length) return nodeSize;
			nodeSize = x;
			nodeSizeChange();
			return chart;
		};

		chart.resetNodes = function () {
			force.nodes().forEach(function (n) {
				n.fixed = false;
			});
			node.classed("fixed", function (d) { return d.fixed; })
				.style('stroke', function (d) { return d.fixed ? "#222" : "#eee"; } );
			force.resume();
			forceLabel.resume();
			redraw();
		};

		chart.circle = function (x) {
			if (!arguments.length) return circle;
			circle = x;
			return chart;
		};

		chart.reset = function () {
			resetFunc();
		};

		chart.highlightSource = function () {
			highlightSource();
		};

		chart.highlightTarget = function () {
			highlightTarget();
		};

		chart.removeHighlight = function () {
			removeHighlight();
		};

		chart.zoomIn = function () {
			zoomByFactor(1.5);
			redraw();
		};
		chart.zoomOut = function () {
			zoomByFactor(0.8);
			redraw();
		};
		chart.fixedNodes = function (names) {
			if (!arguments.length) {
				if(force) {
					return force.nodes()
						.filter(function(n) { return n.fixed; })
						.map(function(n) {
							return {
								name: n.name,
								x: n.x,
								y: n.y
							};
						});
				} else {
					return false;
				}
			}

			var nameMap = d3.map();

			if(names) {
				names.forEach(function (n) {
					nameMap.set(n.name, { x: n.x, y: n.y });
				});

				force.nodes().forEach(function (n) {
					if(nameMap.has(n.name)) {
						n.fixed = true;
						n.x = nameMap.get(n.name).x;
						n.y = nameMap.get(n.name).y;
						n.px = nameMap.get(n.name).x;
						n.py = nameMap.get(n.name).y;
					}
				});

				force.resume();
			}

			return chart;
		};

		chart.getSvg = function () {

			// Update unrendered SVG paths.
			path.attr("d", curve)
				.attr("href", function (d) {
					return "#path" + d.source.index + "_" + d.target.index;
				});

			// Keep SVG paths up to date (not rendered)
			path.classed("hidden", function (d) {
				return searchText &&
					( d.source.name.toLowerCase().indexOf(searchText.toLowerCase()) === -1 &&
						d.target.name.toLowerCase().indexOf(searchText.toLowerCase()) === -1 );
			});

			var clone = main[0][0].parentElement.cloneNode(true);
			clone.children[1].appendChild(paths);
			return d3.select(clone);
		};

		return chart;
	};

})();
