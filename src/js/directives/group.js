angular.module('palladio.directives.group', [])

	// For handling Bootstrap scaffolding
	.directive('group', function () {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        scope.$watch(attrs.watch, function (watch){
        	/*
          var last = element;
          element.find('li').each(function(i, o){
            if( (i) && (i) % attrs.every == 0) {
           	  var oldLast = last;
              last = element.clone().empty();
              last.insertAfter(oldLast);
            }
            $(o).appendTo(last);
          })

        // bad fix
        /*element.parent().find('ul').each(function(i,o){
        	if (!$(o).children().length) $(o).remove();
        })*/

        },true)

       }
      };
  	})