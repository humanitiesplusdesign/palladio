angular.module('palladio.services.filter', ['palladio'])
	.factory("filterService", [ '$q', 'palladioService', function ($q, palladioService) {

		var preFilterFuncs = [];
		var postFilterFuncs = [];

		// Always update after filter applied
		postFilterFuncs.push(palladioService.update);

		// Generally speaking, if a filter is already running on a dimension, we
		// don't want the filter requests to stack up. Only one filter can be on
		// a dimension at a time, after all. We really just want to execute the
		// last one. So on each dimension, we track if a filter is running,
		// and if so we save the parameters of the most recent requested filter
		// on that dimension, then check for them and run it once the current
		// filter is done processing.

		return {
			filter: function (dimension, filter) {
				if(!dimension.filterRunning) {
					preFilterFuncs.forEach(function(f) { f(); });
					var d = $q.defer();
					setTimeout(function() {
						dimension.filterRunning = true;
						filter(dimension);
						postFilterFuncs.forEach(function(f) { f(); });

						// Filter is no longer running.
						dimension.filterRunning = false;
						
						// We now decide what to do next.
						if(dimension.filterQueued) {
							// A filter is queued up, run it before resolving.
							filter(dimension, dimension.filterQueued).then(function() {
								d.resolve();
							});
						} else {
							// Nothing else to do.
							d.resolve();
						}
					});
					// Store the promise on the dimension so we can get at it
					// later (below)
					dimension.filterPromise = d.promise;
				} else {
					// Filter currently running. Queue this filter to run next.
					// It's fine if we wipe out existing filters, as filters overwrite
					// on a dimension anyway.
					dimension.filterQueued = filter;
				}
				
				return dimension.filterPromise;
			},
			preFilter: function (f) {
				preFilterFuncs.push(f);
			},
			postFilter: function (f) {
				postFilterFuncs.push(f);
			}
		};
	}]);