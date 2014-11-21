angular.module('palladioApp.directives', [
	'$strap.directives',
	'ngSanitize',
	'palladio'])
	.directive('filesDirective', function ($rootScope, parseService, dataService) {
		var directiveDefObj = {
			templateUrl: 'partials/files.html',

			link: function (scope, element, attrs) {

				// function to parse data
				scope.parseData = function(afterParse){
					
					// if no text return
					if (!scope.text || !scope.text.length) return;
					scope.parseError = false;

					// let's see if the text is a Google spreadsheet URL
					if (scope.text.indexOf("https://docs.google.com/spreadsheet") === 0) {
						try {
							parseService.parseUrl(scope.text).then(
								function(csv){
									scope.text = csv;
									var data = parseService.parseText(scope.text);
									addFile(data, scope.lastFileName);
									if(afterParse) afterParse();
								},
								function(error){
									scope.parseError = error;
								});
						} catch(error) {
							scope.parseError = error.message;
						}
						return;
					}

					try {
						var data = JSON.parse(scope.text);

						addFile(data, scope.lastFileName);
						if(afterParse) afterParse();
						return;
					} catch(error) {
						try {
							var data = parseService.parseText(scope.text);
							addFile(data, scope.lastFileName);
							if(afterParse) afterParse();
						} catch(error) {
							scope.parseError = error.message;
						}
					}
				};

				scope.$watch(function(){ return $('.files-list').html(); }, function(){
					//$('.notification').tooltip({container:'body'});
					$('.tooltip').remove();
					$('*[data-toggle="tooltip"]').tooltip({container:'body'});
					//$('.type').tooltip({container:'body'});
				});

				scope.toggleDelete = function(field) {
					field.delete = !field.delete;
					dataService.setDirty();
				};

				/* Creates a new file */

				var addFile = function(data, label) {
					scope.text = null;
					dataService.addFile(data, label);
					scope.lastFileName = null;
				};

			}
		};

		return directiveDefObj;
	})
	.directive('refineDirective', function (dataService) {
		var directiveDefObj = {
			templateUrl: 'partials/refine.html',
			link: function (scope, element, attrs) {

				// Add a repeat method to the String prototype (from MDN).
				String.prototype.repeat = function (nTimes) {
					var sDiff = "", sBase2 = nTimes > 0 ? this.valueOf() : "";
						for (var nMask = nTimes; nMask > 1; nMask >>= 1) {
						if (nMask & 1) { sDiff += sBase2; }
							sBase2 += sBase2;
					}
					return sBase2 + sDiff;
				};

				// Showing/hiding Adding table...
				scope.addingTable = false;

				$(document).ready(function(){
					$('.input-tag').tag({
							caseInsensitive: false,
							placeholder: "Press enter after each string"
						})
						.on('added', function(ui, values){
							scope.selectedFieldMetadata.ignore = values;
							scope.updateMetadata();
						})
						.on('removed', function(ui, values){
							scope.selectedFieldMetadata.ignore = values;
							scope.updateMetadata();
						});
				});

				scope.displayVal = function(val) {

					var delimiter = scope.selectedFieldMetadata.hierDelimiter;
					if(delimiter === "") delimiter = null;

					var key = '<span class="small">' + val.key.split(delimiter).reduce(function(prev, curr, i, a) {
						return prev + '&nbsp;'.repeat(i*2) + curr;
					}, "") + '</span>';

					var multiples = val.value > 1 ? '<span class="pull-right small muted">' + val.value + '</span>' : '';

					return key + multiples;
				};

				scope.hideNewTable = function() {
					hide();
				};

				scope.filteredFiles = [];

				scope.$watch('selectedFile.id', function () {
					if(scope.selectedFile) {
						scope.filteredFiles = scope.files.filter(function (d){ return d.id !== scope.selectedFile.id; });
					} else {
						scope.filteredFiles = [];
					}
				});

				scope.parseExtendTable = function() {
					var afterParse = function () {
						// Only do this if we are loading an extension file
						if(scope.selectedFieldMetadata) {
							scope.augmenting = true;
							// Set the new file (latest created) as the "extend" file for the current field.
							scope.selectedFieldMetadata.augmentId = dataService.getFiles()[dataService.getFiles().length - 1].uniqueId;

							// Make sure we actually augmented the file and need to wait for the augmentId watcher to finish.
							if(scope.selectedFieldMetadata.augmentId === null || scope.selectedFieldMetadata.augmentId === undefined) {
								scope.augmenting = false;
							}

							// Hide the upload dialog after the parsing has happened.
							// Wait until the augmentId watcher is finished. 
							// TODO: This wait shouldn't be necessary
							var intervalId = window.setInterval(function () {
								if(!scope.augmenting) {
									hideAndApply();
									window.clearInterval(intervalId);
								}
							}, 50);
						}
					};

					// Parse the table as normal.
					scope.parseData(afterParse);
				};

				// resetting search unique value
				scope.$watch('selectedFieldMetadata.key', function(){
					scope.searchUnique = "";
					/*scope.addingTable = false;*/
				});

				scope.$watch('selectedFieldMetadata.augmentId', function (nv, ov) {
					// Only do this if there is a field selected at all and it's not initial.
					if(scope.selectedFieldMetadata && !scope.selectedFieldMetadata.initial) {

						// Was undefined, now defined - so this is a purely new link.
						// A little worried this can create duplicate links.
						if((ov === undefined || ov === null) && ( nv || nv === 0)) {
							dataService.addLink({
								source: {
									file: scope.selectedFile,
									field: scope.selectedFieldMetadata,
								},
								lookup: {
									file: dataService.getFiles().filter(function(f) { return f.uniqueId === nv; })[0]
								}
							});
						} else {
							// Was defined, but changed - need to remove old link and create a new one.
							if(( ov || ov === 0) && ov !== nv) {
								dataService.deleteLink(scope.hasLinks(scope.selectedFieldMetadata));

								// If it's still defined, create the new link.
								if(nv !== null) {
									dataService.addLink({
										source: {
											file: scope.selectedFile,
											field: scope.selectedFieldMetadata,
										},
										lookup: {
											file: dataService.getFiles().filter(function(f) { return f.uniqueId === nv; })[0]
										}
									});
								}
							}

							// If it was defined but not changed, don't do anything.
						}
					} else {
						// Unset the initial flag so that we process augmentId changes in the future.
						if(scope.selectedFieldMetadata &&
							scope.selectedFieldMetadata.initial) scope.selectedFieldMetadata.initial = false;
					}

					// In case someone set the scope.augmenting flag, we set it to false now that we're done.
					if(scope.augmenting) scope.augmenting = false;
				});

				function updatePosition(){
					var width = $(window).width();
					var w = width/2-400;
					$('.refine-selected').css("left",w+"px");
					$('.refine-selected').css("height","initial");
					
					if($('.refine-selected').height() > $(window).height()-120) {
						$('.refine-selected').css("height",$(window).height()-120+"px");
					}
				}

				function hide() {
					if(scope.fromFileView === true || scope.addingTable === false) {
						// Only in the extend view from file view or in the refine view
						scope.fromFileView = false;
						scope.addingTable = false;
						scope.selectedFieldMetadata = null;
						scope.selectedFile = null;
					} else {
						// Only in the extend view from the refine view
						scope.fromFileView = false;
						scope.addingTable = false;
					}
				}

				function hideAndApply() {
					scope.$apply(hide);
				}

				scope.$watch('addingTable', updatePosition);
				$(window).resize(updatePosition);
				$(window).ready(updatePosition);
				$('.refine-background').click(hideAndApply);
				$('.refine-close').click(hideAndApply);
			}
		};

		return directiveDefObj;
	})

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
	.directive('specials', function () {
		return {
			restrict: 'A',
			scope: false,
			template: '<a data-ng-repeat="char in selectedFieldMetadata.unassignedSpecialChars" class="tag"' +
						'data-toggle="tooltip" title="Click to search this character in the values"' +
						'data-ng-click="filterUniquesOnChar(char, $event)">' +
						'{{char}}' +
					'</a>',
			link: function (scope, element, attrs) {

				scope.$watch("selectedFieldMetadata.unassignedSpecialChars", function(val){
					$('.tag').tooltip();
				})

				scope.filterUniquesOnChar = function (str, event) {
					var tag = angular.element(event.target);
					var tags = angular.element(element[0]).children('.tag');

					// Make sure no tags are selected.
					tags.removeClass('tag-selected');

					if(scope.selectedSpecialChar === str) {
						// Unfilter
						scope.selectedSpecialChar = null;
					} else {
						// Filter
						scope.selectedSpecialChar = str;

						// Make the current tag selected.
						tag.addClass('tag-selected');
					}

					scope.updateUniques();
				};
			}
		};
	})

	.directive('draggable', function () {
		return {
			scope: false,
			link: function postLink(scope, elements, attrs) {
				$(elements[0]).draggable({
					revert: true,
					start: function (event, ui) {
						$('.blur-on-drag').addClass('blur');
					},
					stop: function (event, ui) {
						$('.blur-on-drag').removeClass('blur');
					},
					zIndex: 1000
				});
			}
		};
	})

	.directive('droppable', function () {
		return {
			scope: false,
			link: function postLink(scope, elements, attrs) {
				var jq = $(elements[0]);
				var an = angular.element(elements[0]);

				if(an.scope().field.uniqueKey === true) {
					jq.droppable({
						over: function (event, ui) {
							// If we want to highlight the drop target, do it here.
							an.addClass('over-drop');
							ui.draggable.addClass('over-drop');
						},
						out: function (event, ui) {
							// If we want to highlight the drop target, do it here.
							an.removeClass('over-drop');
							ui.draggable.removeClass('over-drop');
						},
						drop: function (event, ui) {
							if(attrs.droppableCallback) {
								scope[attrs.droppableCallback](event, ui);
							}
							an.removeClass('over-drop');
							ui.draggable.removeClass('over-drop');
						}
					});
				} else {
					jq.addClass("blur-on-drag");
				}
			}
		};
	})

	.directive('modal', function () {
		return {
			replace : true,
			scope : {
				dimensions: '=',
				model: '=',
				descriptionAccessor: '='
			},
			template: '<div class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
  				'<div class="modal-header">' +
			    	'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>' +
			    	'<h4 style="line-height: normal">Choose the dimensions</h4>' +
			  	'</div>' +
			  	'<div class="modal-body">' +
			    	'<ul class="unstyled">' +
			    		'<li ng-repeat="field in dimensions">' +
			    			'<label class="checkbox">' +
		    					'<input type="checkbox" ng-checked="check(field)" ng-click="change(field)"> {{getDescription(field)}}' +
					    	'</label>' +
			    		'</li>' +
			    	'</ul>' +
			  	'</div>' +
			  	'<div class="modal-footer">' +
			    	'<button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>' +
			  	'</div>' +
			'</div>',

			link: function postLink(scope, elements, attrs) {
				
				scope.change = function(field) {
					if(Array.isArray(scope.model)) {
						if(scope.check(field)) {
							// Field is already in the model (uncheck).
							scope.model = scope.model.filter( function (d) { return field.key !== d.key; });
						} else {
							scope.model = scope.model.concat(field);
						}
					} else {
						if(scope.check(field)) {
							// Field is already checked (uncheck).
							scope.model = null;
						} else {
							scope.model = field;
						}
					}
				};

				scope.check = function(field) {
					if(Array.isArray(scope.model)) {
						// Model is an array of fields.
						return scope.model.filter( function (d) { return field.key === d.key; }).length > 0;
					} else {
						// Model is an individual field.
						if(scope.model) {
							return field.key === scope.model.key;
						} else {
							return false;
						}
					}
				};

				scope.getDescription = function (d) {
					if(scope.descriptionAccessor) {
						return scope.descriptionAccessor(d);
					} else {
						return d.description;
					}
				}
			}
		};
	})

	.directive('optionsDisabled', function($parse) {
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
	});
