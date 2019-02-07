// Selection view module

require('./palladio-selection-view.css')

angular.module('palladioSelectionView', ['palladio'])
	.directive('palladioSelectionView', ['palladioService', function (palladioService) {

		var directiveDefObj = {
			scope: true,
			link: function (scope, element) {

				var uniqueId = "selectionView" + Math.floor(Math.random() * 10000);
				var deregister = [];

				deregister.push(palladioService.onUpdate(uniqueId, function() {
					buildSelection();
				}));

				scope.$on('$destroy', function () {

					// Clean up after yourself. Remove dimensions that we have created. If we
					// created watches on another scope, destroy those as well.

					deregister.forEach(function(f) { f(); });
				});

				function buildSelection() {
					var sel = d3.select(element[0]);

					if(sel.select("ul").empty()) {
						sel.append("ul").attr("class", "selection-display");
					}

					var ul = sel.select("ul");

					/*if(ul.select("span").empty()) {
						ul.append("span").attr("class", "selection-title").text("Filters");
					}*/

					sel.selectAll(".no-filter").remove();

					if (palladioService.getFilters().entries().length === 0) {
						sel.append("span")
							.attr("class","no-filter text-muted small")
							.style("margin-left", "5px")
							.text("You have no active filters");
					}

					/*sel.append("span")
						.attr("class","no-filter text-muted small")
						.style("margin-left", "5px")
						.text(function(){
							return palladioService.getFilters().entries().length === 0 ? "You have no active filters" : "Active filters"
						});*/

					var pills = ul.selectAll("li")
						.data(palladioService.getFilters().entries(), function (d) { return d.key; });

					pills.enter().call(function (selection) {
							var li = selection.append("li")
									.attr("class", "selection-pill");
							li.append("span")
									.attr("class", "selection-label");
							li.append("span")
									.attr("class", "selection-text");
							li.append("span")
									.attr("class","pointer text-danger")
									.attr("tooltip","Remove")
									.attr("tooltip-animation","false")
									.html('&times;')
									.on("click", function (d) { d.value[2](); });

						});

					pills.exit().remove();

					pills.call(function (selection) {
							selection.select("span.selection-label")
									.text(function (d) { return d.value[0]; });
							selection.select("span.selection-text")
									.text(function (d) { return d.value[1]; })
									.attr("title", function (d) { return d.value[1]; });
						});

				}

				buildSelection();

			}
		};

		return directiveDefObj;
	}]);
