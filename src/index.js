global.angular = require('angular')
global.crossfilterHelpers = require('./js/helpers/crossfilter-helpers').crossfilterHelpers
global.$ = require('jquery')
global.jQuery = global.$
global.crossfilter = require('crossfilter2')
global.Spinner = require('spin.js')

let d3 = require('d3')

require('d3-tip')
require('webpack-jquery-ui/tooltip')

require('../lib/bootstrap-tag/bootstrap-tag.js')
require('../lib/d3-bootstrap/d3-bootstrap-plugins.js')
require('../lib/bootstrap-tag/bootstrap-tag.css')

require('./js/palladio')

require('./css/palladio.css')
require('./css/animations.css')

require('./components/palladio-data-download/palladio-data-download')
require('./components/palladio-data-upload/palladio-data-upload')
require('./components/palladio-selection-view/palladio-selection-view')
require('./unfinished_components/palladio-palette/palladio-palette')
require('./unfinished_components/palladio-duration-view/palladio-duration-view')