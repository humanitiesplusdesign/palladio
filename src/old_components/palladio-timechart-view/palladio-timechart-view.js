angular.module('palladioTimechartView', [])

	// Palladio Timechart View
	.directive('palladioTimechartView', function () {

		return {

			scope : {
				groupDimension: '=',
				groupAccessor: '=',
				startAccessor: '=',
				endAccessor: '='
			},

			link: function (scope, element, attrs) {

				
				function update() {

					if (!scope.groupDimension || !scope.endAccessor || !scope.startAccessor) return;

					var filtered = scope.groupDimension.top(Infinity).filter(function(d){
						return !isNaN(scope.startAccessor(d).getTime()) && !isNaN(scope.endAccessor(d).getTime()) && scope.endAccessor(d) >= scope.startAccessor(d); 
					})

					var chart = d3.timeline()
		              .height(800)
		              .group(scope.groupAccessor)
		              .start(scope.startAccessor)
		              .end(scope.endAccessor)

		            d3.select(element[0])
		              .datum(filtered)
		              .call(chart)

				}

				// update on xfitlers events
				scope.$on('update', update);
				scope.$watch('groupDimension', update)
				scope.$watch('startAccessor', update)
				scope.$watch('endAccessor', update)

			}

		};
	})

	// Palladio Timechart View with Settings
	.directive('palladioTimechartViewWithSettings', function () {

		return {
			scope: true,
			template : '<div class="row-fluid component">' +

							'<!-- Settings -->' +
							'<div class="span2 settings-panel"> ' +
								'<div class="row-fluid">' +

									'<div class="setting">' +
						            	'<label>Group by</label>' +
						          		'<select bs-select ng-model="mapping.groupDimension" ng-options="field.description for field in fields" data-size="5" class="span12">' +
						            		'<option value=""><i>None</i></option>' +
						          		'</select> ' +
						        	'</div>' +

						        	'<div class="setting">' +
						            	'<label>Start date</label>' +
						          		'<select bs-select ng-model="mapping.startDimension" ng-options="field.description for field in dateFields" data-size="5" class="span12">' +
						            		'<option value=""><i>None</i></option>' +
						          		'</select> ' +
						        	'</div>' +

						        	'<div class="setting">' +
						            	'<label>End date</label>' +
						          		'<select bs-select ng-model="mapping.endDimension" ng-options="field.description for field in dateFields" data-size="5" class="span12">' +
						            		'<option value=""><i>None</i></option>' +
						          		'</select> ' +
						        	'</div>' +

								'</div>' +
							'</div>' +

							'<!-- View -->' +
							'<div class="span10 view">' +
								'<a class="toggle"><i class="icon-arrow-left"></i></a>' +
								'<div data-palladio-timechart-view ' +
									'group-dimension="groupDimension"' +
									'group-accessor="groupAccessor"' +
									'end-accessor="endAccessor"' +
									'start-accessor="startAccessor">' +
								'</div>' +
							'</div> ' +
						'</div>' +

						'<div class="clearfix"></div>',

			link : {
				
				pre: function (scope, element, attrs) {
					
					scope.fields = scope.metadata;

					scope.dateFields = scope.metadata.filter(function (d) { return d.type === 'date'; });

					scope.mapping = {};

					scope.$watch('mapping.groupDimension', function(){
						scope.groupAccessor = !scope.mapping.groupDimension ? null : function(d) { return d[scope.mapping.groupDimension.key]; };
						if (scope.groupDimension) scope.groupDimension.remove();
						scope.groupDimension = !scope.mapping.groupDimension ? null : scope.xfilter.dimension(scope.groupAccessor);
					})

					scope.$watch('mapping.startDimension', function(){
						scope.startAccessor = !scope.mapping.startDimension ? null : function(d){ return new Date(d[scope.mapping.startDimension.key]); };
					})

					scope.$watch('mapping.endDimension', function(){
						scope.endAccessor = !scope.mapping.endDimension ? null : function(d){ return new Date(d[scope.mapping.endDimension.key]); };
					})

					// Clean up after ourselves. Remove dimensions that we have created. If we
					// created watches on another scope, destroy those as well.
					scope.$on('$destroy', function () {
						if(scope.groupDimension) scope.groupDimension.remove();
					});
				},

				post: function(scope, element, attrs) {
					$(element).find('.toggle').on("click", function() {
						$(element).find('a.toggle i').toggleClass('icon-edit icon-arrow-left');
						$(element).find('.settings-panel').toggle(0, function() {
							$(element).find('.view').toggleClass('span12');
							$(element).find('.view').toggleClass('span10');
						});
					});
				}
			}

		};
	});