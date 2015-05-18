// Fibra graph view
!function(){

  d3.idiograph = function(){

    var svg         // main svg - for nodes
    , canvas      // main canvas - for links
    , context     // canvas context
    , width       // width
    , height      // height
    , data        // data {nodes,links}
    , node        // node elements selector
    , zoom        // zoom behaviour
    , brush       // brush
    , zooming
    , shiftKey
    , drag        // dragging
    , color       // color
    , x           // x scale - for zoom
    , y           // y scale - for zoom
    , overlay     // overlay - for zoom
    , area        // area scale
    , force       // force layout
    ;

    // events
    var dispatch = d3.dispatch('selected', 'addNode', 'addLink');

    var graph = function(selection){
      selection.each(function(g){

        // saving data
        data = parse(g);
        //community();
        // init (just first time)
        if (!canvas) init(selection);
        // force layout

        var currentNodes = d3.map(force.nodes(), function(d) { return d.id; });

        // Merge the new data with the standard properties of current nodes.
        var currentNode;
        data.nodes.forEach(function(d) {
          currentNode = currentNodes.get(d.id);
          if(currentNode) {
            d.index = currentNode.index;
            d.x = currentNode.x;
            d.y = currentNode.y;
            d.px = currentNode.px;
            d.py = currentNode.py;
            d.fixed = currentNode.fixed;
            d.weight = currentNode.weight;
          }
        });

        force
        .size([width, height])
        .nodes(data.nodes)
        .links(data.links)
        .charge(charge)
        //.start();

        update();

      })
    }

    // data ops

    function parse(g){

      var _nodes = nodes(g).map(function(d,i){
        return {
          id: key(d,i),
          label: label(d,i),
          size: +size(d,i),
          data : d
        }
      });

      var _links = links(g)
      .map(function(d,i){
        return {
          source: source(d),
          target: target(d),
          value : 1
        }
      })
      .filter(function(d,i){
        return _nodes[d.source] && _nodes[d.target];
      })

      return { nodes:_nodes, links: _links };
    }

    // default accessors

    function key(d,i){
      return d.name;
    }

    function charge(d){
      return -radius(d) * radius(d) * 2;
    }

    function size(d){
      return 1;
    }

    function radius(d){
      return Math.sqrt(area(d.size) / Math.PI);
    }

    function label(d,i){
      return i;
    }

    function color(d){
      return null;
    }

    //
    function nodes(d){
      return d.nodes;
    }

    function links(d){
      return d.links;
    }

    function source(d){
      return d.source;
    }

    function target(d){
      return d.target;
    }

    // private methods

    function init(selection){

      // x scale
      x = d3.scale.linear()
      .domain([0, width])
      .range([0, width]);

      // y scale
      y = d3.scale.linear()
      .domain([0, height])
      .range([height, 0]);

      // zoom
      zoom = d3.behavior.zoom()
      .x(x)
      .y(y)
      .on("zoom", tick);

      // size
      area = d3.scale.linear()
      .range([5,200])

      // color
      color = d3.scale.category20();

      // canvas for links
      canvas = selection
      .append("canvas")
      .attr("width", width)
      .attr("height", height)

      // canvas' context
      context = canvas.node()
      .getContext("2d");

      d3.select("body")
      .attr("tabindex", 1)
      .on("keydown.brush", keyflip)
      .on("keyup.brush", keyflip)
      .each(function() { this.focus(); })

      d3.select(window)
      .on("keydown.pan", keydown)
      .on("keyup.pan", keyup)

      // svg for nodes
      svg = selection
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .call(zoom)

      zooming = svg
      .on("mousedown.zoom");

      svg
      .on("mouseup.selection", selected)
      .on("dblclick.zoom", null)
      .on("mousedown.zoom", null)
      .on("touchstart.zoom", null)
      .on("touchmove.zoom", null)
      .on("touchend.zoom", null)

      brush = svg
      .append("g")
      .datum(function() { return { selected: false, previouslySelected: false }; })
      .attr("class", "brush")
      .call(d3.svg.brush()
        .x(d3.scale.identity().domain([0, width]))
        .y(d3.scale.identity().domain([0, height]))
        .on("brushstart", function(d) {
          node.each(function(d) { d.previouslySelected = shiftKey && d.selected; });
        })
        .on("brush", function() {

        	/*if (editing) {
        		d3.select(this).select(".extent").remove();
        		return;
        	}*/

          var extent = d3.event.target.extent();
          node.classed("selected", function(d) {
            return d.selected = d.previouslySelected ^
                (extent[0][0] <= x(d.x) && x(d.x) < extent[1][0]
                && extent[0][1] <= y(d.y) && y(d.y) < extent[1][1]);

            return d.selected = d.previouslySelected ^
                (extent[0][0] <= (d.x * zoom.scale() + zoom.translate()[0]) && (d.x * zoom.scale() + zoom.translate()[0]) < extent[1][0]
                && extent[0][1] <= (d.y * zoom.scale() + zoom.translate()[1]) && (d.y * zoom.scale() + zoom.translate()[1]) < extent[1][1]);
          });

          selected();

        })
        .on("brushend", function() {
          d3.event.target.clear();
          d3.select(this).call(d3.event.target);
        }));

      // nodes
      node = svg
      .append("g")
      .attr("class","nodes")
      .selectAll(".node");

      // overlay for zoom
      overlay = svg
      .append("rect")
      .attr("class","overlay")
      .classed("active", false)
      .attr("width", width)
      .attr("height", height)
      .attr("fill-opacity", 0);

      // force
      force = d3.layout.force()
      .on("tick", tick);

      // drag function
      drag = force.drag()
      .on("drag.force", function (a) {
        force.stop();

        node
        .filter(function(d){ return d.selected; })
        .each(function(d){
          d.fixed = true;
          d.x += d3.event.dx / zoom.scale();
          d.y -= d3.event.dy / zoom.scale();
          d.px = d.x;
          d.py = d.y;
        });
        tick();
        //repositionNodes();
      });



    }


    // Key Down
    function keydown(){
      switch(d3.event.keyCode) {
        case 32: // spacebar
        d3.event.preventDefault();
        //panning = true;
        overlay.classed("active", true);
        // Restoring the original zooming
        svg
        .on("mousedown.zoom", zooming)
        .on("touchstart.zoom", zooming)
        .on("touchmove.zoom", zooming)
        .on("touchend.zoom", zooming);
        return false;
        break;
      }
    }

    // Key Up
    function keyup(e){
      switch(d3.event.keyCode) {
        case 32: // spacebar
        //panning = false;
        overlay.classed("active", false);
        svg
        .on("mousedown.zoom", null)
        .on("touchstart.zoom", null)
        .on("touchmove.zoom", null)
        .on("touchend.zoom", null);
        break;
      }
    }

    function selected(){
      dispatch.selected(node.filter(function(d){ return d.selected; }).data())
    }


    function community() {

      // http://en.wikipedia.org/wiki/Determining_the_number_of_clusters_in_a_data_set#Rule_of_thumb
      var numCommunities = Math.round(Math.sqrt(data.nodes.length/2));

      data.nodes.forEach( function(node) {
        node.communities = [];
        node.communityBuffer = [];
        for (var community = 0; community < numCommunities; community++) {
          // Initialize with a small Exponential variate
          node.communities[community] = 0.01 * -Math.log(Math.random());
          node.communityBuffer[community] = 0.0;
        }
      });

      var communitySums = [];

      for (var iteration = 0; iteration < 100; iteration++) {

        for (var community = 0; community < numCommunities; community++) {
          communitySums[community] = 0.0;
        }

        // Estimate community memberships for each edge
        data.links.forEach( function(edge) {
          var sourceCommunities = data.nodes[ edge.source ].communities;
          var targetCommunities = data.nodes[ edge.target ].communities;
          var distribution = [];

          // Multiply the two community membership vectors
          for (var community = 0; community < numCommunities; community++) {
            distribution[community] = sourceCommunities[community] * targetCommunities[community];
          }

          // Normalize and add to the gradient
          var normalizer = edge.value / d3.sum(distribution);
          for (var community = 0; community < numCommunities; community++) {
            distribution[community] *= normalizer;
            communitySums[community] += distribution[community];
            data.nodes[ edge.source ].communityBuffer[community] += distribution[community];
            data.nodes[ edge.target ].communityBuffer[community] += distribution[community];
          }
        });

        // We need to divide each node value by the square root of the community sum.
        var communityNormalizers = []
        for (var community = 0; community < numCommunities; community++) {
          communityNormalizers[community] = 1.0 / Math.sqrt(communitySums[community]);
        }

        // Update parameters and clear the buffer.
        data.nodes.forEach( function(node) {
          for (var community = 0; community < numCommunities; community++) {
            node.communities[community] = node.communityBuffer[community] * communityNormalizers[community];
            node.communityBuffer[community] = 0.0;
          }
          node.community = node.communities.indexOf(d3.max(node.communities));
        });
      }

    }


    function tick() {
      // links
      context.clearRect(0, 0, width, height);
      context.strokeStyle = "rgba(200,200,200,.8)";
      context.beginPath();
      data.links
      .forEach(function(d,i) {
        var c = bezier(d);
        context.moveTo(c[0],c[1]);
        context.bezierCurveTo(c[2],c[3],c[4],c[5],c[6],c[7]);
      });
      context.stroke();

      //nodes
      repositionNodes();
    }

    function repositionNodes() {
      node.attr("transform", function(d) {
        return 'translate(' + x(d.x) + ',' + y(d.y) + ')';
      });
    }

    function select(accessor){
      if (!node) return;
      node
      .classed("selected", function(d){ return d.selected = accessor(d.data); });
    }

    function mouseDown(d, that){
      if (shiftKey) d3.select(that).classed("selected", d.selected = !d.selected);
      else if (!d.selected) {
        node.classed("selected", function(p) { return p.selected = d === p; });
      }
      selected();
    }

    // Key Flip (for SHIFT)
    function keyflip() {
      shiftKey = d3.event.shiftKey// || d3.event.metaKey;
    }

    var runForce = true;

    function update(){

      // If force update is running, stop it.
      force.stop();

      // update area scale
      area.domain([0,d3.max(data.nodes, function(d){ return d.size; })]);

      // nodes
      node = svg
        .select("g.nodes")
        .selectAll(".node")
        .data(data.nodes, function(d){ return d.id; });

      node
        .call(drag)

      // update nodes
      node.select(".point")  // .selectAll doesn't automatically assign datum, .select does.
      .each(updateNodes)

      // add new nodes
      node.enter()
      .append('g')
      .attr("class","node")
      .call(drag)
      .on("mousedown", function (d) {
        mouseDown(d,this);
      })
      .append("circle")
      .attr("class","point")
      .each(updateNodes)

      // remove old nodes
      node.exit().remove();

      // if(runForce) {
        force.start();
        // runForce = false;
      // }

    }

    function updateNodes(d){
      d3.select(this)
      // .style('fill', '#999')//function(d){ return color(d.community); })
      .style('fill', function (d) { return d.data.value > 0 ? '#999' : '#ddd'; })
      .attr("r", radius)
    }

    function bezier(d) {
      var source = d.source,
      target = d.target,
      sourceX = x(source.x),
      sourceY = y(source.y),
      targetX = x(target.x),
      targetY = y(target.y),
      rad = Math.sqrt( Math.pow(targetX-sourceX,2) + Math.pow(targetY-sourceY, 2) )/4,
      sourceP = Math.atan2((targetY-sourceY),(targetX-sourceX)) - Math.PI/8,
      targetP = Math.atan2((sourceY-targetY),(sourceX-targetX)) + Math.PI/8;

      return [
      sourceX, sourceY,
      sourceX + rad*Math.cos(sourceP), sourceY+rad*Math.sin(sourceP),
      targetX + rad*Math.cos(targetP), targetY+rad*Math.sin(targetP),
      targetX,targetY
      ]
    }

    // getters/setters

    // key: the unique key for nodes
    graph.key = function(_){
      if (!arguments.length) return key;
      key = _;
      return graph;
    }
    // size: the function to size the nodes
    graph.size = function(_){
      if (!arguments.length) return size;
      size = _;
      return graph;
    }
    // color: the function to color the nodes
    graph.color = function(_){
      if (!arguments.length) return color;
      color = _;
      return graph;
    }
    // label: the function to color the nodes
    graph.label = function(_){
      if (!arguments.length) return label;
      label = _;
      return graph;
    }

    graph.width = function(_){
      if (!arguments.length) return width;
      width = _;
      return graph;
    }

    graph.height = function(_){
      if (!arguments.length) return height;
      height = _;
      return graph;
    }

    graph.select = function(accessor){
      select(accessor);
    }

    // rebinding events
    d3.rebind(graph,dispatch,"on");

    return graph;

  }

}();
