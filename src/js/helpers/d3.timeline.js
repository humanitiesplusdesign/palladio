(function(){

	d3.timeline = function(){

		var itemHeight = 20,
			height = null,
			width = 1000;

		function chart(selection){
			selection.each(function(data){

				var groups = grouping(data),
					levels = d3.sum(d3.values(groups).map(function(d){ return d.length; })),
					margin = {top: 20, right: 15, bottom: 50, left: 150},

					x = d3.time.scale().range([margin.left, width]).domain([
						d3.min(data, start),
						d3.max(data, end)
					]),

					xAxis = d3.svg.axis().scale(x).orient('bottom').tickSize(6, 0, 0);


				if (!height) {
					height = itemHeight * levels + margin.top + margin.bottom;
				} else {
					itemHeight = (height- margin.top +- margin.bottom)/levels;
				}

				selection.selectAll('svg').remove();
				
				var svg = selection.append('svg:svg')
				  .attr('width', width)
				  .attr('height', height);

				svg.append('defs').append('clipPath')
				  .attr('id', 'clip')
				  .append('rect')
				    .attr('width', width-margin.left)
				    .attr('height', height)
				    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				var last = 0,
					current = 0;

				var items = svg.selectAll('g.itemGroup')
					.data(d3.entries(groups))
					.enter().append('g')
					.attr("class","itemGroup")
					.attr("transform", function(d,i){
						current = last;
						last += d.value.length*itemHeight;
						return "translate(" + 0 + "," + (margin.top + current) + ")";
					});

				items.append('line')
					.attr('x1', margin.left)
					.attr('y1', 0)
					.attr('x2', width)
					.attr('y2', 0)
					.attr('stroke', 'lightgrey');

				items.append('text')
					.text(function(d) { return d.key; })
					.attr('x', margin.left-10)
			  		.attr('y', 0)
			  		.attr('dy', function(d) { return (d.value.length * itemHeight)/2; })
			  		.attr('text-anchor', 'end')
			  		.attr('class', 'groupText');

				svg.append('g')
				  	.attr('transform', 'translate(0,' + (itemHeight * (levels+1)) + ')')
				  	.attr('class', 'focus axis date')
				  	.call(xAxis);
				
				var itemsClip = svg.append('g')
				    .attr('clip-path', 'url(#clip)')

				update();

				function update(){

					var rects = itemsClip.selectAll('rect')
						.data(data, function(d){return d.__id;})
						.attr('x', function(d) { return x(start(d)); })
					    .attr('width', function(d) { return x(end(d)) - x(start(d)); })
					
					rects.enter().append('rect')
					    .attr('x', function(d) { return x(start(d)); })
					    .attr('y', function(d,i) { return itemHeight * d.__level + margin.top; })
					    .attr('width', function(d) { return x(end(d)) - x(start(d)); })
					    .attr('height', itemHeight)
					    .attr('class', function(d) { return 'focusItem'; })
					
				  	rects.exit().remove();
				
				}


			})
		}

		function grouping(data){

			var level = id = 0;

			return d3.nest()
				.key(group)
				.rollup(function(g) {
					
					var l, levels = [];
					g.forEach(function(item,i){
						l=0;
						while(overlap(item, levels[l])) l++;
						if (!levels[l]) levels[l] = [];
						item.__level = l+level;
						item.__id = id++;
						levels[l].push(item);
					})
					level++;
					return levels;			
				})
				.map(data)
		}

		function overlap(item, g) {
			if (!g) return false;
			for(var i in g) {
				if(start(item) < end(g[i]) && end(item) > start(g[i])) {
					return true;
				}
			}
		    return false;
		};



		function group(d) {
			return d.group;
		}

		function start(d) {
			return d.start;
		}

		function end(d) {
			return d.end;
		}

		/* Getter/Setter */

		chart.group = function(x) {
			if (!arguments.length) return x;
			group = x;
			return chart;
		}

		chart.start = function(x) {
			if (!arguments.length) return start;
			start = x;
			return chart;
		}

		chart.end = function(x) {
			if (!arguments.length) return end;
			end = x;
			return chart;
		}

		chart.height = function(x) {
			if (!arguments.length) return height;
			height = x;
			return chart;
		}

		return chart;
	}

})();