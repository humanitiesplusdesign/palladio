angular.module('palladioApp.load', ['palladioApp.services'])
	.factory("loadService", ['dataService', '$q', 'parseService', 'validationService', function(dataService, $q, parseService, validationService) {

		var visState = {};
		var layoutState;
		var visStateDirty = false;

		function load(input) {
			var deferred = $q.defer();
			var reader = new FileReader();
			reader.onload = function() {
				var json = JSON.parse(reader.result);
				json.files.forEach(function (f) { dataService.addFileRaw(f); });
				json.links.forEach(function (l) {
					// First fix the file references.
					l.lookup.file = dataService.getFiles().filter(function(f) { return f.uniqueId === l.lookup.file.uniqueId; })[0];
					l.source.file = dataService.getFiles().filter(function(f) { return f.uniqueId === l.source.file.uniqueId; })[0];

					dataService.addLinkRaw(l);
				});

				// Does this file include visualization state information?
				if(json.vis && json.vis.length > 0) {
					visState = json.vis;
					layoutState = json.layout;
					visStateDirty = true;
				}

				deferred.resolve();
			};
			reader.readAsText(input.files[0]);
			// We need to clear the input so that we pick up future uploads. This is *not*
			// cross-browser-compatible.
			input.value = null;

			return deferred.promise;
		}

		function loadJson(json) {
			json.files.forEach(function (f) { 

				// Rebuild autofields
				f.autoFields = parseService.getFields(f.data);

				// Rebuild unique values and errors for each field.
				f.fields.forEach(function(g) {
					if(f.autoFields.filter(function (d) { return d.key === g.key; })[0]) {
						g.uniques = f.autoFields.filter(function (d) { return d.key === g.key; })[0].uniques;
						g.errors = validationService(g.uniques.map(function(d) { return d.key; }), g.type);
					}
				});

				dataService.addFileRaw(f);
			});
			json.links.forEach(function (l) {
				// First fix the file references.
				l.lookup.file = dataService.getFiles().filter(function(f) { return f.uniqueId === l.lookup.file.uniqueId; })[0];
				l.source.file = dataService.getFiles().filter(function(f) { return f.uniqueId === l.source.file.uniqueId; })[0];

				dataService.addLinkRaw(l);
			});

			// Does this file include visualization state information?
			if(json.vis && json.vis.length > 0) {
				visState = json.vis;
				layoutState = json.layout;
				visStateDirty = true;
			}
		}

		function buildVis(stateFunctions) {
			if(visStateDirty) {

				// Build a lookup based on type. Multiple visualizations of a type are supported,
				// but ordering is based on order that the visualizations were originally registered.
				// We assume a static layout (e.g. that once /visualization loads all visualizations)
				// are present on the page and have registered their state functions. If further
				// setup is required (e.g. instantiating filters), then the application itself should
				// register a state function with appropriate type and then handle the instantiation
				// of the visualizations as required.

				var stateLookup = d3.map();
				visState.forEach(function (v) {
					if(stateLookup.has(v.type)) {
						stateLookup.get(v.type).push(v.importJson);
					} else {
						stateLookup.set(v.type, [v.importJson]);
					}
				});

				stateFunctions.forEach(function (s) {
					if(stateLookup.has(s.type) && stateLookup.get(s.type).length > 0) {
						// Shift the import off the stack for this type and import it.
						s.import(stateLookup.get(s.type).shift());

						// If we've imported all the visualizations of this type from the file.
						if(stateLookup.get(s.type).length === 0) stateLookup.remove(s.type);
					}
				});

				// Are there any visualization states saved in the file that we didn't use?
				stateLookup.keys().forEach(function (k) {
					console.warn("It looks like this import file includes a visualization with type " + k.type + " that didn't match any visualizations in this application.");
				});
			}
		}

		function getLayout() {
			return layoutState;
		}

		return {
			load: load,
			loadJson: loadJson,
			build: buildVis,
			layout: getLayout
		};
	}]);