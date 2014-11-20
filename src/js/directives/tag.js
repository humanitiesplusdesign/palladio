angular.module('palladio.directives.tag', [])

  	// For Ignore tags
	.directive('tag', function () {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {

		scope.$watch('selectedFieldMetadata', function(md){
			if (!md) return;

			d3.select(element[0]).selectAll(".tags").remove();
			d3.select(element[0])
				.append("input")
				.attr("id", "ignore")
				.attr("class","input-tag")
				.attr("type","text")
				.attr("name","tags")
				.attr("data-provide","tag")

			element.find(".input-tag").tag({
					caseInsensitive: false,
					values : md.ignore || []
				})
				.on('added', function(ui, values){ 
					scope.selectedFieldMetadata.ignore = values;
					scope.updateMetadata();
					scope.$apply();
				})
				.on('removed', function(ui, values){
					scope.selectedFieldMetadata.ignore = values;
					scope.updateMetadata();
					scope.$apply();
				});
		})
       }
      };
  	})