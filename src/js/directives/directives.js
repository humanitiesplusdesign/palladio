require('angular-ui-sortable');
require('angular-sanitize');
require('./dimension');
require('./draggable');
require('./droppable');
require('./group');
require('./modal');
require('./options-disabled');
require('./resizable');
require('./specials');
require('./tag');

angular.module('palladio.directives', [
//	'mgcrea.ngStrap',
	'palladio.directives.dimension',
	'palladio.directives.group',
	'palladio.directives.tag',
	'palladio.directives.specials',
	'palladio.directives.draggable',
	'palladio.directives.droppable',
	'palladio.directives.modal',
	'palladio.directives.optionsDisabled',
	'palladio.directives.resizable',
	'ui.sortable',
	'ngSanitize',
	'palladio'])

	.directive('resizable', function() {
	    return {
	      restrict: 'A',
	      link: function (scope, element, attrs) {

	        attrs.handles = attrs.handles || "e, s, se";
	        attrs.options = attrs.options || {};

	        var options = {

	          handles : attrs.handles,

	          resize: function(event, ui) {
	            ui.element.css("position", "fixed");
	            ui.element.css("bottom", "0px");
	            ui.element.css("top", "");
	          }
	        }

	        options = angular.extend(options, attrs.options);
	        $(element).resizable(options)

	      }
	    }
	});
