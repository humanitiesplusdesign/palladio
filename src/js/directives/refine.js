angular.module('palladio.directives.refine', [
	'palladio.services'])
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

				scope.setDirty = dataService.setDirty;

				scope.filteredFiles = function() {
					return scope.selectedFile ? scope.files.filter(function (d){ return d.id !== scope.selectedFile.id; }) : [];
				};

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
					$('.refine-selected').css("max-height",$(window).height()-120+"px");
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
	});