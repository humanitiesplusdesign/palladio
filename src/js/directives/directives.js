angular.module('palladio.directives', [
	'$strap.directives',
	'palladio.directives.dimension',
	'palladio.directives.refine',
	'palladio.directives.files',
	'palladio.directives.yasgui',
	'palladio.directives.group',
	'palladio.directives.tag',
	'palladio.directives.specials',
	'palladio.directives.draggable',
	'palladio.directives.droppable',
	'palladio.directives.modal',
	'palladio.directives.optionsDisabled',
	'palladio.directives.resizable',
	'palladio.directives.filePills',
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
