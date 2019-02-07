var crossfilterHelpers = {

	///////////////////////////////////////////////////////////////////////
	//
	// Reduce functions that don't double-count by using add/reduce based 
	// on unique dimension if defined.
	//
	// Also tracks an initial count value (depends on CrossFilter pull
	// request https://github.com/square/crossfilter/pull/92 )
	//
	// Also records a descriptive string based on a second accessor
	//
	///////////////////////////////////////////////////////////////////////

	countByDimensionWithInitialCountAndData: function(accessorFunction, dataAccessor) {
		var internalCount;
		return {
			add: function (p, v) {
				if(p.unique.has(accessorFunction(v))) {
					internalCount = p.unique.get(accessorFunction(v));
					p.unique.set(accessorFunction(v), internalCount + 1);
				} else {
					p.unique.set(accessorFunction(v), 1);
					p.data = dataAccessor(v, p.data, "add");
					++p.count;
				}
				if(p.count > p.initialCount) p.initialCount = p.count;
				return p;
			},
			remove: function (p, v) {
				if(p.unique.has(accessorFunction(v))) {
					internalCount = p.unique.get(accessorFunction(v));
					if(internalCount == 1) {
						p.unique.remove(accessorFunction(v));
						p.data = dataAccessor(v, p.data, "remove");
						--p.count;
					} else {
						p.unique.set(accessorFunction(v), internalCount - 1);
					}
				}
				return p;
			},
			init: function () {
				return {data: undefined, unique: d3.map(), count: 0, initialCount: 0};
			}
		};
	},

	///////////////////////////////////////////////////////////////////////
	//
	// Reduce functions that don't double-count by using add/reduce based 
	// on unique dimension if defined.
	//
	// Also tracks an initial count value (depends on CrossFilter pull
	// request https://github.com/square/crossfilter/pull/92 )
	//
	///////////////////////////////////////////////////////////////////////

	countByDimensionWithInitialCount: function(accessorFunction) {
		var internalCount;
		return {
			add: function (p, v) {
				if(p.unique.has(accessorFunction(v))) {
					internalCount = p.unique.get(accessorFunction(v));
					p.unique.set(accessorFunction(v), internalCount + 1);
				} else {
					p.unique.set(accessorFunction(v), 1);
					++p.count;
				}
				if(p.count > p.initialCount) p.initialCount = p.count;
				return p;
			},
			remove: function (p, v) {
				if(p.unique.has(accessorFunction(v))) {
					internalCount = p.unique.get(accessorFunction(v));
					if(internalCount == 1) {
						p.unique.remove(accessorFunction(v));
						--p.count;
					} else {
						p.unique.set(accessorFunction(v), internalCount - 1);
					}
				}
				return p;
			},
			init: function () {
				return {unique: d3.map(), count: 0, initialCount: 0};
			}
		};
	},

	///////////////////////////////////////////////////////////////////////
	//
	// Reduce functions that don't double-count by using add/reduce based 
	// on unique dimension if defined.
	//
	///////////////////////////////////////////////////////////////////////

	countByDimension: function(accessorFunction) {
		var internalCount;
		return {
			add: function (p, v) {
				if(p.unique.has(accessorFunction(v))) {
					internalCount = p.unique.get(accessorFunction(v));
					p.unique.set(accessorFunction(v), internalCount + 1);
				} else {
					p.unique.set(accessorFunction(v), 1);
					++p.count;
				}
				return p;
			},
			remove: function (p, v) {
				if(p.unique.has(accessorFunction(v))) {
					internalCount = p.unique.get(accessorFunction(v));
					if(internalCount == 1) {
						p.unique.remove(accessorFunction(v));
						--p.count;
					} else {
						p.unique.set(accessorFunction(v), internalCount - 1);
					}
				}
				return p;
			},
			init: function () {
				return {unique: d3.map(), count: 0};
			}
		};
	}
};

export { crossfilterHelpers }