// Selection view module

angular.module('palladioDownloadWidget', [])
	.directive('palladioDownloadWidget', function () {

		var directiveDefObj = {
			scope: true,
			template: '<a class="pull-right" data-ng-click="downloadData()">CSV</a>',
			link: function (scope, element, attrs) {
				scope.downloadData = function() {
					var dim = scope.xfilter.dimension(function (d) { return 1; });
					var blob = new Blob(
						[ d3.csv.format(dim.top(Infinity)) ],
						{type: "text/plain;charset=utf-8"}
					);
					var fileName = "Palladio - selected data.csv";
					dim.remove();
					saveAs(blob, fileName);
				};

			}
		};

		return directiveDefObj;
	});