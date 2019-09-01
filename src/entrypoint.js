// This really should be done with webpack.ProvidePlugin, but there are some downstream
//  components (in the first case, specifically, controllers.js from palladio-app) are
//  depending on $ being injected into the global namespace by this module...
global.$ = require("jquery");
global.jQuery = global.$;
global.reductio = require("reductio");

// Needed by (note that all of these are separate repos...):
// * palladio-facet-component
// * palladio-graph-component
// * palladio-timeline-component
global.crossfilterHelpers = require("./js/helpers/crossfilter-helpers");



// Hack to put d3-tip where downstream expects it to be
// see: https://github.com/caged/d3-tip/issues/243
d3.tip = require("d3-tip");


require("bootstrap");

// require("webpack-jquery-ui");
require("webpack-jquery-ui/sortable");
require("webpack-jquery-ui/tooltip");


// needed by:
// * src/js/directives/tag.js
// * <palladio-app>/js/directives/refine.js
require("../lib/bootstrap-tag/bootstrap-tag.js");


//require("../lib/d3-bootstrap/d3-bootstrap-plugins.js");
require("./js/palladio");



require("./js/services/services");
require("./js/directives/directives");
require("./js/filters/filters");


require("./components/palladio-data-download/palladio-data-download");
require("./components/palladio-data-upload/palladio-data-upload");
require("./components/palladio-selection-view/palladio-selection-view");
require("./unfinished_components/palladio-palette/palladio-palette");
require("./unfinished_components/palladio-duration-view/palladio-duration-view");


// Not required by anything in this repo, but expected by co-dependent modules
//  (see also `js/services/component.js`):

// * <palladio-map-component>
require("mapbox.js");

// * <palladio-graph-component>
require("./js/helpers/d3.graph");
