!(function(){
    

var annotate;

annotate = function(options, create) {
  var el, move_tip;
  el = d3.select(this);
  move_tip = function(selection) {
    var center, offsets;
    center = [0, 0];
    var body;
    body = d3.select('body');
    if (options.placement === "mouse") {
      center = d3.mouse(body.node());
    } else {
      offsets = this.ownerSVGElement.getBoundingClientRect();
      center[0] = offsets.left;
      center[1] = offsets.top;
      center[0] += options.position[0];
      center[1] += options.position[1];
      center[0] += window.scrollX;
      center[1] += window.scrollY;
    }
    center[0] += options.displacement[0];
    center[1] += options.displacement[1];
    return selection.style("left", "" + center[0] + "px").style("top", "" + center[1] + "px").style("display", "block");
  };
  el.on("mouseover.tooltip", function(a,b,c) {
    var inner, tip;
    tip = create();
    tip.classed("annotation", true).classed(options.gravity, true).classed('fade', true).style("display", "none");
    tip.append("div").attr("class", "arrow");
    inner = function() {
      return tip.classed('in', true);
    };
    setTimeout(inner, 10);
    return tip.style("display", "").call(move_tip.bind(this));
  });
  if (options.mousemove) {
    el.on("mousemove.tooltip", function() {
      return d3.select(".annotation").call(move_tip.bind(this));
    });
  }
  return el.on("mouseout.tooltip", function() {
    var remover, tip;
    tip = d3.selectAll(".annotation").classed('in', false);
    remover = function() {
      return tip.remove();
    };
    return setTimeout(remover, 150);
  });
};

d3.selection.prototype.popover = function(f) {
  var body;
  body = d3.select('body');
  return this.each(function(d, i) {
    var create_popover, options;
    options = f.apply(this, arguments);
    create_popover = function() {
      var inner, tip;
      tip = body.append("div").classed("popover", true);
      inner = tip.append("div").attr("class", "popover-inner");
      inner.append("h3").text(options.title).attr("class", "popover-title");
      inner.append("div").attr("class", "popover-content").append("p").html(options.content.innerHTML);
      return tip;
    };
    return annotate.call(this, options, create_popover);
  });
};

d3.selection.prototype.tooltip = function(f) {
  var body;
  body = d3.select('body');
  return this.each(function(d, i) {
    var create_tooltip, options;
    options = f.apply(this, arguments);
    create_tooltip = function() {
      var tip;
      tip = body.append("div").classed("tooltip", true);
      tip.append("div").html(options.text).attr("class", "tooltip-inner");
      return tip;
    };
    return annotate.call(this, options, create_tooltip);
  });
};

;})();
