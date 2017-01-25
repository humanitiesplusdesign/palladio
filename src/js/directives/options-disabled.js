angular.module('palladio.directives.optionsDisabled', [])
	.directive('optionsDisabled', ['$parse', function($parse) {
	    var disableOptions = function(scope, attr, element, data, fnDisableIfTrue) {
	        // refresh the disabled options in the select element.
	        $("option[value!='?']", element).each(function(i, e) {
	            var locals = {};
	            locals[attr] = data[i];
	            $(this).attr("disabled", fnDisableIfTrue(scope, locals));
	        });
	    };
	    return {
	        priority: 0,
	        require: 'ngModel',
	        link: function(scope, iElement, iAttrs, ctrl) {
	            // parse expression and build array of disabled options
	            var expElements = iAttrs.optionsDisabled.match(/^\s*(.+)\s+for\s+(.+)\s+in\s+(.+)?\s*/);
	            var attrToWatch = expElements[3];
	            var fnDisableIfTrue = $parse(expElements[1]);
	            scope.$watch(attrToWatch, function(newValue, oldValue) {
	                if(newValue)
	                    disableOptions(scope, expElements[2], iElement, newValue, fnDisableIfTrue);
	            }, true);
	            // handle model updates properly
	            scope.$watch(iAttrs.ngModel, function(newValue, oldValue) {
	                var disOptions = $parse(attrToWatch)(scope);
	                if(newValue)
	                    disableOptions(scope, expElements[2], iElement, disOptions, fnDisableIfTrue);
	            }, true);
	        }
	    };
	}])