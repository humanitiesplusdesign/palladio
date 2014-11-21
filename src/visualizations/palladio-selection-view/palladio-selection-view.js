// Selection view module

angular.module('palladioSelectionView', [])
	.directive('palladioSelectionView', function () {
		var filterColor = "#A8DDB5";

		var directiveDefObj = {
			scope: true,
			link: function (scope, element, attrs) {

				scope.$on('update', function() {
					buildSelection();
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

					sel.selectAll("span.muted").remove();

					if (scope.filters.entries().length == 0) {
						sel.append("span")
							.attr("class","muted small")
							.style("margin-left", "5px")
							.text("No active filters")
					}

					var pills = ul.selectAll("li")
						.data(scope.filters.entries(), function (d) { return d.key; });

					pills.enter().call(function (selection) {
							var li = selection.append("li")
									.attr("class", "selection-pill");
							li.append("span")
									.attr("class", "selection-label");
							li.append("span")
									.attr("class", "selection-text");
							li.append("a")
									.attr("class","remove")
									.html('&times;')
									.on("click", function (d) { d.value[2](); });
						});

					pills.exit().remove();

					pills.call(function (selection) {
							selection.select("span.selection-label")
									.text(function (d) { return d.value[0]; });
							selection.select("span.selection-text")
									.text(function (d) { return d.value[1]; });
						});

				}

				buildSelection();

			}
		};

		return directiveDefObj;
	});