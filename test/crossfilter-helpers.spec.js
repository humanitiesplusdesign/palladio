describe("Crossfilter helpers:", function () {

	var data = [
		{ name: 'Bob', age: '32', sex: 'M', birthPlace: 'Paris', deathPlace: 'London' },
		{ name: 'Sam', age: '50', sex: 'F', birthPlace: 'Rome', deathPlace: 'London' },
		{ name: 'Bev', age: '60', sex: 'F', birthPlace: 'Paris', deathPlace: 'London' },
		{ name: 'Eve', age: '38', sex: 'F', birthPlace: 'Berlin', deathPlace: 'Madrid' },
		{ name: 'Jim', age: '19', sex: 'M', birthPlace: 'London', deathPlace: 'Berlin' }
	];

	it('should exist', function() {
		expect(crossfilterHelpers).not.toEqual(null);
	});

	it('should be able to do a simple count by dimension', function() {
		var helper = crossfilterHelpers.countByDimension(function (d) { return d.name; });

		var xfilter = crossfilter(data);
		var birthPlaceDim = xfilter.dimension(function(d) { return "" + d.birthPlace; });
		var birthPlaceGroup = birthPlaceDim.group()
				.reduce(helper.add, helper.remove, helper.init)
				.order(function (d) { return d.count; });

		expect(birthPlaceGroup.top(Infinity).length).toEqual(4);
		expect(birthPlaceGroup.top(1)[0].key).toEqual('Paris');
		expect(birthPlaceGroup.top(1)[0].value.count).toEqual(2);
	});

	it('should be able to do count exception aggregation', function () {
		var helper = crossfilterHelpers.countByDimension(function (d) { return d.deathPlace; });

		var xfilter = crossfilter(data);
		var birthPlaceDim = xfilter.dimension(function(d) { return "" + d.birthPlace; });
		var birthPlaceGroup = birthPlaceDim.group()
				.reduce(helper.add, helper.remove, helper.init)
				.order(function (d) { return d.count; });

		expect(birthPlaceGroup.top(Infinity).length).toEqual(4);
		// Sort order is undefined because all groups have count of 1.
		// expect(birthPlaceGroup.top(1)[0].key).toEqual('Paris');
		expect(birthPlaceGroup.top(1)[0].value.count).toEqual(1);


		helper = crossfilterHelpers.countByDimension(function (d) { return d.sex; });

		xfilter = crossfilter(data);
		birthPlaceDim = xfilter.dimension(function(d) { return "" + d.birthPlace; });
		birthPlaceGroup = birthPlaceDim.group()
				.reduce(helper.add, helper.remove, helper.init)
				.order(function (d) { return d.count; });

		expect(birthPlaceGroup.top(Infinity).length).toEqual(4);
		expect(birthPlaceGroup.top(1)[0].key).toEqual('Paris');
		expect(birthPlaceGroup.top(1)[0].value.count).toEqual(2);
	});

	it('retains the initial count after filtering', function () {
		var helper = crossfilterHelpers.countByDimensionWithInitialCount(function (d) { return d.name; });

		var xfilter = crossfilter(data);
		var birthPlaceDim = xfilter.dimension(function(d) { return "" + d.birthPlace; });
		var sexDim = xfilter.dimension(function (d) { return "" + d.sex; });
		var birthPlaceGroup = birthPlaceDim.group()
				.reduce(helper.add, helper.remove, helper.init)
				.order(function (d) { return d.initialCount; });

		sexDim.filter('F');

		expect(birthPlaceGroup.top(Infinity).length).toEqual(4);
		expect(birthPlaceGroup.top(1)[0].key).toEqual('Paris');
		expect(birthPlaceGroup.top(1)[0].value.count).toEqual(1);
		expect(birthPlaceGroup.top(1)[0].value.initialCount).toEqual(2);
	});

	it('retains the initial count even if filter is applied before group defined (requires customized Crossfilter)', function () {
		var helper = crossfilterHelpers.countByDimensionWithInitialCount(function (d) { return d.name; });

		var xfilter = crossfilter(data);
		var birthPlaceDim = xfilter.dimension(function(d) { return "" + d.birthPlace; });
		var sexDim = xfilter.dimension(function (d) { return "" + d.sex; });

		sexDim.filter('F');

		// Important that this happens after the filter
		var birthPlaceGroup = birthPlaceDim.group()
				.reduce(helper.add, helper.remove, helper.init)
				.order(function (d) { return d.initialCount; });

		// This fails with the standard Crossfilter library.
		expect(birthPlaceGroup.top(Infinity).length).toEqual(4);
		expect(birthPlaceGroup.top(1)[0].key).toEqual('Paris');
		expect(birthPlaceGroup.top(1)[0].value.count).toEqual(1);
		expect(birthPlaceGroup.top(1)[0].value.initialCount).toEqual(2);
	});

	it('can retain arbitrary data on the data attribute', function () {
		var helper = crossfilterHelpers
				.countByDimensionWithInitialCountAndData(
					function (d) { return d.name; },
					function (d) { return d.age; }
				);

		var xfilter = crossfilter(data);
		var birthPlaceDim = xfilter.dimension(function(d) { return "" + d.birthPlace; });
		var birthPlaceGroup = birthPlaceDim.group()
				.reduce(helper.add, helper.remove, helper.init)
				.order(function (d) { return d.count; });

		// This fails with the standard Crossfilter library.
		expect(birthPlaceGroup.top(Infinity).length).toEqual(4);
		expect(birthPlaceGroup.top(2)[1].key).toEqual('London');
		expect(birthPlaceGroup.top(2)[1].value.count).toEqual(1);
		expect(birthPlaceGroup.top(2)[1].value.initialCount).toEqual(1);
		expect(birthPlaceGroup.top(2)[1].value.data).toEqual('19');
	});

	it('can maintain SUM aggregations on the data attribute', function () {
		var helper = crossfilterHelpers
				.countByDimensionWithInitialCountAndData(
					function (d) { return d.name; },
					function (d, p, t) {
						if(p === undefined) return { sum: +d.age };
						if(t === 'add') {
							// Adding a new record.
							p.sum = p.sum + (+d.age); // Make sure to cast or you end up with a String!!!
							return p;
						} else {
							// Removing a record.
							p.sum = p.sum - (+d.age); // Make sure to cast or you end up with a String!!!
							return p;
						}
					}
				);

		var xfilter = crossfilter(data);
		var birthPlaceDim = xfilter.dimension(function(d) { return "" + d.birthPlace; });
		var birthPlaceGroup = birthPlaceDim.group()
				.reduce(helper.add, helper.remove, helper.init)
				.order(function (d) { return d.initialCount; });

		// This fails with the standard Crossfilter library.
		expect(birthPlaceGroup.top(Infinity).length).toEqual(4);
		expect(birthPlaceGroup.top(2)[1].key).toEqual('London');
		expect(birthPlaceGroup.top(2)[1].value.count).toEqual(1);
		expect(birthPlaceGroup.top(2)[1].value.initialCount).toEqual(1);
		expect(birthPlaceGroup.top(2)[1].value.data.sum).toEqual(19);
		expect(birthPlaceGroup.top(1)[0].value.data.sum).toEqual(92);

		var sexDim = xfilter.dimension(function (d) { return "" + d.sex; });
		sexDim.filter('F');
		expect(birthPlaceGroup.top(1)[0].value.data.sum).toEqual(60);
	});

	it('can maintain AVG aggregations on the data attribute', function () {
		var helper = crossfilterHelpers
				.countByDimensionWithInitialCountAndData(
					function (d) { return d.name; },
					function (d, p, t) {
						if(p === undefined) return { sum: +d.age, count: 1, avg: +d.age };
						if(t === 'add') {
							// Adding a new record.
							p.sum = p.sum + (+d.age); // Make sure to cast or you end up with a String!!!
							p.count++;
							p.avg = p.sum / p.count;
							return p;
						} else {
							// Removing a record.
							p.sum = p.sum - (+d.age); // Make sure to cast or you end up with a String!!!
							p.count--;
							p.avg = p.sum / p.count;
							return p;
						}
					}
				);

		var xfilter = crossfilter(data);
		var birthPlaceDim = xfilter.dimension(function(d) { return "" + d.birthPlace; });
		var birthPlaceGroup = birthPlaceDim.group()
				.reduce(helper.add, helper.remove, helper.init)
				.order(function (d) { return d.initialCount; });

		// This fails with the standard Crossfilter library.
		expect(birthPlaceGroup.top(Infinity).length).toEqual(4);
		expect(birthPlaceGroup.top(2)[1].key).toEqual('London');
		expect(birthPlaceGroup.top(2)[1].value.count).toEqual(1);
		expect(birthPlaceGroup.top(2)[1].value.initialCount).toEqual(1);
		expect(birthPlaceGroup.top(2)[1].value.data.avg).toEqual(19);
		expect(birthPlaceGroup.top(1)[0].value.data.avg).toEqual(46);

		var sexDim = xfilter.dimension(function (d) { return "" + d.sex; });
		sexDim.filter('F');
		expect(birthPlaceGroup.top(1)[0].value.data.avg).toEqual(60);
		expect(birthPlaceGroup.top(2)[1].value.data.avg).toBeNaN();
	});
});