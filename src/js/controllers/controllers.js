angular.module('palladio.controllers', ['palladio.services', 'palladio'])
	.controller('WorkflowCtrl', function (version, $rootScope, $scope, $location, $controller, $compile, $timeout, dataService, spinnerService, loadService, palladioService, $http, filterService) {

		spinnerService.pSpin();
		spinnerService.pHide();
		spinnerService.spin();
		spinnerService.hide();

		palladioService.preUpdate(spinnerService.pSpin);
		palladioService.postUpdate(spinnerService.pHide);
		filterService.preFilter(spinnerService.pSpin);
		filterService.postFilter(spinnerService.pHide);

		// Show/hide filters on panel
		$scope.$watch(function(){ return $location.path(); }, function (path){
			// If we don't have data, redirect to the 'start' page.
			if( ( path !== '/' && path !== '/upload' ) && dataService.getFiles().length === 0) {
			//	$location.path('/upload');
			}

			if (path == "/visualization") {
				$('#filter-buttons').show();
				$('#search-top').show();
			}
			else {
				$('#filter-buttons').hide();
				$('#search-top').hide();
			}

			$scope.reload = $location.path() === '/upload';
		});

		$scope.searchText = "";

		$scope.project = {
			title : null,
			author : null,
			date: null,
			description : null
		}

		$scope.$watch('searchText', function (nv, ov) {
			if(nv !== ov) {
				palladioService.search(nv);
			}
		});

		// Control display of the individual visualizations.
		$scope.showGrid = false;
		$scope.showTable = false;
		$scope.showGeo = false;
		$scope.showTime = false;
		$scope.showGraph = true;

		$scope.files = dataService.getFiles();

		$scope.data = [];

		// let access location from template
		$rootScope.location = $location;

		// Property (in addition to the above 3) required by the visualization stage.
		$scope.layout = 'geo';

		// Initialize the scope element that controls filter visibility.
		$scope.expandedFilters = true;

		$scope.types = {
			text : 'Text',
			number : 'Number',
			date : 'Date',
			latlong : 'Coordinates',
			url : 'URL'
		};

		$scope.version = version;

		$scope.$watch(function(){ return $('#footer').html(); }, function(){
			$('*[data-toggle="tooltip"]').tooltip({container:'body'});
		});




		// TODO: Remove - this is no longer required as we don't run off of data on $scope.
		$scope.refreshData = function (data) {
			// Data setup.
			if(dataService.isDirty() || data === undefined) {
				// If data has been added/deleted/changed, we need to wipe out the existing
				// filters that rely on the old data...
			/*	if(angular.element("#filters").scope()) {
					angular.element("#filters").scope().$broadcast('$destroy');
					angular.element("#filters").children().remove();
					$scope.$emit('triggerFilterReset');
				}*/

				// ... then we reload the data.
				dataService.getData().then(function (resolvedData) {
					$scope.data = resolvedData.data;
					$scope.metadata = resolvedData.metadata;
					$scope.xfilter = resolvedData.xfilter;

					$scope.$emit('triggerUpdate');
				});
			} else {
				if (data !== undefined) {
					$scope.data = data.data;
					$scope.metadata = data.metadata;
					$scope.xfilter = data.xfilter;

					$scope.$emit('triggerUpdate');
				}
			}
		};

		$scope.setLayout = function (layout) {
			// Hacking to display spinner.
			if(dataService.isDirty()) {
				spinnerService.spin();
			}
			$scope.layout = layout;
		};

		$scope.refreshData();

		$scope.clearFiles = function () {
			while(dataService.getFiles().length > 0) {
				dataService.deleteFile(dataService.getFiles()[0], 0);
			}
		};



		$scope.onLoad = function(json) {
			// Only move on to the visualization if the save file has a visualization part, in
			// which case it would have a layout specified.
			if(!loadService.layout()) {
				$location.path('/upload');
				spinnerService.hide();
			}
			// if(loadService.layout()) setTimeout(function() { $location.path('/visualization'); }, 1000);
			if(loadService.layout()) {
				$location.path('/visualization');
			}

			var metadata = dataService.getMetadata();
			if(metadata) {
				$scope.project.title = metadata.title;
				$scope.project.author = metadata.author;
				$scope.project.date = metadata.date;
				$scope.project.description = metadata.description;
			}
		};

		function loadFile(path) {
			spinnerService.spin();
			$http.get(path)
				.success(function(data) {
					$scope.loadError = null;
					loadService.loadJson(data).then($scope.onLoad);
				})
				.error(function() {
					spinnerService.hide();
					$scope.loadError = "There was a problem loading the URL " + path + ". Please check that the URL exists, is a Palladio file, and is CORS-enabled.";
				});
		}

		$scope.loadFile = loadFile;

		if($location.search().file) {
			// Load the file from the path on the URL.
			loadFile($location.search().file);
		} else {
			// Otherwise just initialize the spinner service.
			spinnerService.spin();
			spinnerService.hide();
		}

		// Alert when leaving
		/*$(window).bind('beforeunload', function(){
			return 'By leaving this page you will loose your work.';
		});*/

	})

	.controller('UploadRefineCtrl', function ($scope, $location, parseService, dataService, validationService, $controller) {

		// Instantiate the WorkflowCtrl controller in scope if it is not already.
		if($scope.refreshData === undefined) {
			$controller('WorkflowCtrl', { '$scope': $scope });
		}

		$scope.selectedFieldMetadata = null;
		$scope.selectedFile = null;
		$scope.sparqlEndpoint = "";

		$scope.sortOptions = [
			{ label:'Sort by Value', value:'key', icon: 'fa-sort-alpha-asc' },
			{ label:'Sort by Frequency', value:'value', icon: 'fa-sort-numeric-asc'}
		];

		$scope.displayOptions = {
			sortBy : $scope.sortOptions[0]
		}

		$scope.onDrop = function(obj, e){
			$scope.lastFileName = e.dataTransfer.files[0].name.replace(/\.[^/.]+$/, "") || null;
		};

		$scope.addFile = function (file) {
			dataService.addFile(file);
		};

		$scope.deleteFile = function(file) {
			dataService.deleteFile(file);
			$scope.selectedFieldMetadata = null;
			$scope.selectedFile = null;
		};

		$scope.hasSpecial = function(file) {

			return file.fields.filter(function (field){
				return field.special.length;
			}).length > 0;
		};

		$scope.setSelected = function(field, file) {
			$scope.showSpecialCharDetail = false;

			// This is screwy: Don't update links if this is true, which we
			// only have to do if the augmentID is not null or undefined.
			if(field.augmentId !== null && field.augmentId !== undefined) field.initial = true;

			$scope.selectedFieldMetadata = field;
			$scope.selectedFile = file;
			$scope.selectedSpecialChar = null;

			$scope.addingTable = false;

			var autoFields = file.autoFields.filter(function (d) { return d.key === field.key; })[0];

			// If 'type' isn't set, grab the auto-recognized type.
			if(field.type === undefined) {
				field.type = autoFields.type;
			}

			if(field.uniqueKey === undefined) {
				field.uniqueKey = autoFields.uniqueKey;
			}

			field.unassignedSpecialChars = calcUnassignedSpecialCharacters();
			field.verifiedSpecialChars = calcVerifiedSpecialCharacters(field.unassignedSpecialChars, field.verifiedSpecialChars);

			// Update unique values and detect errors.
			$scope.updateUniques();

			// Set field as confirmed once user has looked at it.
			field.confirmed = true;
		};

		$scope.setCountBy = function (field) {
			dataService.setCountBy(field);
			dataService.setDirty();
		};

		$scope.updateMetadata = function () {
			$scope.updateUniques();
			dataService.setDirty();
		};

		$scope.autoRecognize = function(file) {
			file.fields = file.autoFields;
			dataService.setDirty();
		};

		$scope.updateUniques = function() {

			var ignore = [];

			if($scope.selectedFieldMetadata.ignore)
				ignore = $scope.selectedFieldMetadata.ignore;
			// Recalculate metadata with delimiter.

			var md = parseService.parseColumn($scope.selectedFieldMetadata.key,
					$scope.selectedFile.data, $scope.selectedFieldMetadata.mvDelimiter,
					$scope.selectedFieldMetadata.hierDelimiter, ignore, $scope.selectedFieldMetadata.type);

			// Reassign metadata that might change due to delimiter.
			$scope.selectedFieldMetadata.cardinality = md.cardinality;
			$scope.selectedFieldMetadata.blanks = md.blanks;
			$scope.selectedFieldMetadata.unassignedSpecialChars = calcUnassignedSpecialCharacters();
			$scope.selectedFieldMetadata.verifiedSpecialChars = calcVerifiedSpecialCharacters($scope.selectedFieldMetadata.unassignedSpecialChars, $scope.selectedFieldMetadata.verifiedSpecialChars);
			$scope.selectedFieldMetadata.uniqueKey = md.uniqueKey;

			// Check to make sure that the currently selected special character is in the list
			// of unassigned special characters. If not, remove the current selection.
			if($scope.selectedFieldMetadata.unassignedSpecialChars.indexOf($scope.selectedSpecialChar) === -1) {
				$scope.selectedSpecialChar = null;
			}

			$scope.selectedFieldMetadata.errors = validationService($scope.selectedFieldMetadata.uniques.map(function (d) { return d.key; }), $scope.selectedFieldMetadata.type);

			$scope.selectedFieldMetadata.uniques = md.uniques.filter( function(d) {
				// Display only uniques with the selected special character (if selected).
				return $scope.selectedSpecialChar === null || d.key.indexOf($scope.selectedSpecialChar) !== -1;
			}).sort(function (a, b) {
				var sortBy = $scope.displayOptions.sortBy.value;
				var s = 1;
				if($scope.findError(a.key) && $scope.findError(b.key)) s = a[sortBy] > b[sortBy] ? 1 : -1;
				if($scope.findError(a.key)) s = -1;
				if($scope.findError(b.key)) s = 1;
				s = a[sortBy] > b[sortBy] ? 1 : -1;
				if ($scope.displayOptions.sortBy.value == 'value') s = s *-1;
				return s;
			});

			// Animate unique values table on change here.
			var tab = d3.select(".refine-values-table");
			tab.transition().delay(100).style('opacity', '.2');
			tab.transition().delay(500).style('opacity', '');
		};

		$scope.findError = function (val) {
			var errors = $scope.selectedFieldMetadata.errors.filter(function (d) {
				return d.value === val;
			});

			if(errors.length > 0) return errors[0];

			return false;
		};

		function calcVerifiedSpecialCharacters(unassigned, verified) {
			if(!verified) { verified = []; }
			return verified.filter(function(d) { return unassigned.indexOf(d) !== -1; });
		}

		function calcUnassignedSpecialCharacters() {
			var inMv, inHier, inIgnore, validForType = false;

			return $scope.selectedFieldMetadata.special.filter(function (d) {
				if($scope.selectedFieldMetadata.type === 'latlong' &&
					(d === '-' || d === ',')) {

					validForType = true;
				}

				if($scope.selectedFieldMetadata.type === 'date' &&
					(d === '-')) {

					validForType = true;
				}

				if($scope.selectedFieldMetadata.type === 'url' &&
					(d === ':' || d === '/' || d === '_' || d === '-' || d === '?' )) {

					validForType = true;
				}
				
				if(typeof $scope.selectedFieldMetadata.mvDelimiter === 'string') {
					inMv = $scope.selectedFieldMetadata.mvDelimiter.indexOf(d) !== -1;
				} else { inMv = false; }

				if(typeof $scope.selectedFieldMetadata.hierDelimiter === 'string') {
					inHier = $scope.selectedFieldMetadata.hierDelimiter.indexOf(d) !== -1;
				} else { inHier = false; }

				if($scope.selectedFieldMetadata.ignore) {
					inIgnore = $scope.selectedFieldMetadata.ignore.join("").indexOf(d) !== -1;
				} else { inIgnore = false; }

				return !inMv && !inHier && !inIgnore && !validForType;
			});
		}

		$scope.downloadUniques = function(filter) {
			var blob = new Blob(
				$scope.selectedFieldMetadata.uniques.map(function (d) { return d.key; }).filter(function (d) {
					if(filter) {
						return d.toLowerCase().indexOf(filter.toLowerCase()) !== -1;
					} else {
						return true;
					}
				}).map(function (d) {
					return d + "\n";
				}),
				{type: "text/plain;charset=utf-8"}
			);
			var fileName = filter ? $scope.selectedFieldMetadata.description + " (unique values filtered).txt" : $scope.selectedFieldMetadata.description + " (unique values).txt";
			saveAs(blob, fileName);
		};

		$scope.downloadErrors = function() {
			var blob = new Blob(
				[d3.csv.format($scope.selectedFieldMetadata.errors.map(function (d) {
					return [d.value, d.message];
				}))],
				{type: "text/plain;charset=utf-8"}
			);
			var fileName = $scope.selectedFieldMetadata.description + " (errors).txt";
			saveAs(blob, fileName);
		};

		$scope.allowedTypes = [
			{id: 'text', name: 'Text', description: 'Any text-based data'},
			{id: 'number', name: 'Number', description: 'Numeric data such as 1234 or 1.234'},
			{id: 'date', name: 'Date', description: 'Dates can be YYYY or YYYY-MM-DD'},
			{id: 'latlong', name: 'Coordinates', description: 'Latitude, Longitude coordinates such as 12.345,67.890'},
			{id: 'url', name: 'URL', description: 'The URL of a website or image such as http://www.example.org/file.yyy'}
		];

		$scope.hasLinks = function (field) {
			var found = false;
			if(field) {
				dataService.getLinks().forEach(function (d){
					if (d.source.field.key === field.key) found = d;
				});
			}
			return found;
		};

		$scope.isLinked = function (field) {
			var found = false;
			if(field) {
				dataService.getLinks().forEach(function (d){
					if (d.source.field.key === field.key || d.lookup.field.key === field.key) found = true;
				});
			}
			return found;
		}

		$scope.deleteLink = function (link, index) {
			dataService.deleteLink(link, index);
		};

		$scope.highlightLink = function (link, source) {

			if (!link) {
				$('.file').css("opacity","1");
				return;
			}

			$('.file').css("opacity",".2");
			$('#file-' + source.id).css("opacity","1");
			$('#file-' + link.lookup.file.id).css("opacity","1");
		};

		$scope.showNewTableAndSelect = function(field,file) {
			$scope.parseError = null;
			$scope.fromFileView = true;
			$scope.addingTable = true;
			$scope.text = "";
			$scope.lastFileName = null;
			$scope.setSelected(field, file);
		};

		$scope.showNewTable = function() {
			$scope.parseError = null;
			$scope.addingTable = true;
			$scope.text = "";
			$scope.lastFileName = null;
		};
	})

	.controller("LinkCtrl", function ($scope, dataService) {
		$scope.links = dataService.getLinks();

		$scope.onDrop = function (event, ui) {
			var dragged = angular.element(ui.draggable);
			var dropped = angular.element(event.target);

			$scope.$apply( function (scope) {
				var source = {
					file: dragged.scope().file,
					field: dragged.scope().field
				};

				var lookup = {
					file: dropped.scope().file,
					field: dropped.scope().field
				};

				var metadata = dataService.calcLinkMetadata(source, lookup);

				dataService.addLink({
					source: source,
					lookup: lookup,
					metadata: metadata
				});
			});


		};

		$scope.hasLinks = function (field) {
			var found = false;
			if(field) {
				dataService.getLinks().forEach(function(d){
					if (d.lookup.field.key === field.key || d.source.field.key === field.key) found = true;
				});
			}
			return found;
		};

		$scope.deleteLink = function (link, index) {
			dataService.deleteLink(link, index);
		};

		$scope.$watch(function(){ return $('.file-info').html(); }, function(){
			$('.notification').tooltip({container:'body'});
			$('.type').tooltip({container:'body'});
		});

		/* Resizing links

		function resizeLinks() {
			var height = $('#linking-files').height();
			var sumHeight=0;
			$('#linking-links .link').each( function(){ sumHeight += $(this).height(); });
			if (sumHeight > height) {
				$('#linking-links').css("height", "auto");
				return;
			}
			var h = d3.max( [ height, $(window).height() ] ) + 20;
			$('#linking-links').css("height",h+"px");
		}

		$scope.$watch(function(){ return $('#linking-files').height(); }, resizeLinks);
		$scope.$watch(function(){ return $('#linking-links').html(); }, resizeLinks);
		$(window).resize(resizeLinks);*/
	})

	.controller("VisualizationCtrl", function ($scope, $controller, data, $window, $location, $compile, exportService, loadService, palladioService, componentService, dataService) {

		$scope.showFilters = function () {
			if($location.path() === '/upload' || $location.path() === '/link' || $location.path() === '/' || $location.path() === '/index.html') {
				return false;
			} else { return true; }
		};

		$scope.removeFilter = function (event) {
			// '$destroy' event isn't getting fired properly with just .remove(), so we do it
			// ourselves.
			angular.element(event.currentTarget.parentElement).scope().$broadcast('$destroy');
			// Handle differing node tree depths.
			if(angular.element(event.currentTarget.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement)[0].nodeName === 'LI') {
				angular.element(event.currentTarget.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement).remove();
			} else {
				angular.element(event.currentTarget.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement).remove();
			}
			palladioService.update();
			$('.tooltip').remove();
		};

		$scope.hasFilters = function() {
			return $('#filters').children().length;
		};

    componentService.promiseAdd('graph', "#graph-view-with-settings", {
      showSettings: true
    });
    
    componentService.promiseAdd('map', "#map-view-with-settings", {
      showSettings: true
    });
    
    componentService.promiseAdd('table', "#table-view-with-settings", {
      showSettings: true
    });
    
    componentService.promiseAdd('cards', "#card-view-with-settings", {
      showSettings: true
    });

		// Compile new filters, add them to the WorkflowCtrl scope (parent)
		// and then append them to the DOM.
		$scope.addFilter = function(filter) {
			$scope.expandedFilters = true;
			$('#filters').removeClass('ng-hide');
			switch (filter) {
				case 'timeline':
					if(!$scope.blurTimeline) {
						var newTLId = 'palladio-timeline-filter-' + Math.floor(Math.random() * 10000);
						$('#filters').prepend('<li><div id="' + newTLId + '"></div></li>');
						componentService.add('timeline', "#"+newTLId, {
								showControls: true,
								showSettings: true,
								showAccordion: true,
								height: 250
							}, $scope);
					}
					break;
				case 'partime':
					if(!$scope.blurTimeSpan) {
						var newId = 'palladio-partime-filter-' + Math.floor(Math.random() * 10000);
						$('#filters').prepend('<li><div id="' + newId + '"></div></li>');
						componentService.add('timespan', "#"+newId, {}, $scope);
					}
					break;
				case 'facet':
					if(!$scope.blurFacet) {
            var newId = 'palladio-facet-filter-' + Math.floor(Math.random() * 10000);
						$('#filters').prepend('<li><div id="' + newId + '"></div></li>');
						componentService.add('facet', "#"+newId, {
              showControls: true,
              showSettings: true,
              showAccordion: true,
              showDropArea: false,
              height: "200px"
            }, $scope);
						// $('#filters').prepend($compile('<li><div data-palladio-facet-filter show-controls="true" show-accordion="true" show-drop-area="false" show-settings="true"></div></li>')($scope));
					}
					break;
			}
			$scope.showAddFilter = false;
		};

		// Instantiate the WorkflowCtrl controller in scope if it is not already.
		if($scope.refreshData === undefined) {
			$controller('WorkflowCtrl', { '$scope': $scope });
		}

		// We need to get the data onto the higher-level WorkflowCtrl scope.
		$scope.refreshData(data);

		// If the data is undefined, redirect back to '/'
		if(!data.metadata || data.metadata.length === 0) {
			$window.location = '#/';
			// Unbind the beforeunload handler so that we don't trigger a dialog on 2nd reload.
			$(window).unbind('beforeunload');
			// Hard reload.
			$window.location.reload();
			return;
		}

		$scope.exportSvg = function(source, title){
			exportService(d3.select('svg'), title);
		};

		$scope.$watch('layout', function(){
			$('*[data-toggle="tooltip"]').tooltip({container:'body'});
		});

		var metadata = data.metadata;

		$scope.blurTimeline = true;
		$scope.blurTimeSpan = true;
		$scope.blurFacet = true;
		$scope.blurHistogram = true;

		$scope.showAddFilter = false;

		if(metadata.filter(function (d) { return d.type === 'number'; }).length > 0) {
			$scope.blurHistogram = false;
		}

		if(metadata.filter(function (d) { return d.type === 'date'; }).length > 1) {
			$scope.blurTimeSpan = false;
		}

		if(metadata.filter(function (d) { return d.type === 'date'; }).length > 0) {
			$scope.blurTimeline = false;
		}

		if(metadata.filter(function (d) {
				return d.type === 'text' && !d.uniqueKey && d.cardinality < 1000; }).length > 0) {
			$scope.blurFacet = false;
		}

		// Handle save/load for Palladio-specific way we dynamically add and remove filters.

		var facetImportFunctions = [],
			facetExportFunctions = [],
			timelineImportFunctions = [],
			timelineExportFunctions = [],
			partimeImportFunctions = [],
			partimeExportFunctions = [],
			timestepImportFunctions = [],
			timestepExportFunctions = [];

		function importState(state) {
			if(state.facets.length > 0) {
				state.facets.forEach(function (f, i) {
					if(!facetImportFunctions[i]) $scope.addFilter('facet');

					// This is related to having to wait for the facets to build themselves.
					// Unfortunately this includes a 100ms setTimeout call in the facet building, which
					// needs to be fixed, but until then we need to artificially wait until that
					// call completes.
					window.setTimeout(function () { facetImportFunctions[i](f); }, 300);
				});
			}

			if(state.timelines.length > 0) {
				state.timelines.forEach(function (f, i) {
					if(!timelineImportFunctions[i]) $scope.addFilter('timeline');
					window.setTimeout(function () { timelineImportFunctions[i](f); }, 300);
				});
			}

			if(state.partimes.length > 0) {
				state.partimes.forEach(function (f, i) {
					if(!partimeImportFunctions[i]) $scope.addFilter('partime');
					window.setTimeout(function() { partimeImportFunctions[i](f); }, 300);
				});
			}

			if(state.timesteps.length > 0) {
				state.timesteps.forEach(function (f, i) {
					if(!timestepImportFunctions[i]) $scope.addFilter('timestep');
					window.setTimeout(function() { timestepImportFunctions[i](f); }, 300);
				});
			}
		}

		function exportState() {
			return {
				facets: facetExportFunctions.map(function (f) { return f(); }).filter(function(s) { return s; }),
				timelines: timelineExportFunctions.map(function (f) { return f(); }).filter(function(s) { return s; }),
				partimes: partimeExportFunctions.map(function (f) { return f(); }).filter(function(s) { return s; }),
				timesteps: timestepExportFunctions.map(function (f) { return f(); }).filter(function(s) { return s; })
			};
		}

		var handler = function(id, type, exp, imp) {
			// Intercept 'facet' and 'timeline' type registrations and handle them ourselves.
			if(type === 'facet' || type === 'timeline' ||
				type === 'partime' || type === 'timestep') {

				if(type === 'facet') {
					facetExportFunctions.push(exp);
					facetImportFunctions.push(imp);
				}

				if(type === 'timeline') {
					timelineExportFunctions.push(exp);
					timelineImportFunctions.push(imp);
				}

				if(type === 'partime') {
					partimeExportFunctions.push(exp);
					partimeImportFunctions.push(imp);
				}

				if(type === 'timestep') {
					timestepExportFunctions.push(exp);
					timestepImportFunctions.push(imp);
				}
			}

			return function () {};
		};

		var deregister = [];

		deregister.push(
			palladioService.registerStateFunctions('filters', 'palladioFilters', exportState, importState, ['facet', 'timeline', 'partime', 'timestep'], handler)
		);

		$scope.$on('$destroy', function () {
			deregister.forEach(function(f) { f(); });
		});

		// Total hack, but we need to give the directives time to finish registering themselves.
		setTimeout(function() {
			if(loadService.layout()) $scope.setLayout(loadService.layout());
			loadService.build(palladioService.getStateFunctions());
		}, 1000);
	});
