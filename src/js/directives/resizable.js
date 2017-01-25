angular.module('palladio.directives.resizable', [])

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