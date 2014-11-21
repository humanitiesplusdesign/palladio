describe("Data Service:", function () {

	var peopleData = [
		{ name: 'Bob', age: '32', sex: 'M', birthPlace: 'Paris', deathPlace: 'London', livedIn: 'Paris,London,Rome', numPlace: '1' },
		{ name: 'Sam', age: '50', sex: 'F', birthPlace: 'Rome', deathPlace: 'London', livedIn: 'Rome,London,Berlin', numPlace: '2.0' },
		{ name: 'Eve', age: '38', sex: 'F', birthPlace: 'Berlin', deathPlace: 'Madrid', livedIn: 'Berlin,Madrid,London', numPlace: '3' }
	];

	var letterData = [
		{ letter: '1', author: 'Bob', recipient: 'Eve', source: 'Paris', destination: 'London' },
		{ letter: '2', author: 'Eve', recipient: 'Bob', source: 'London', destination: 'Madrid' },
		{ letter: '3', author: 'Sam', recipient: 'Eve', source: 'Berlin', destination: 'Rome' }
	];

	var placeData = [
		{ place: 'Paris', country: 'France', placeType: 'City, Old, River', id: '1', coordinates: '1234, 5678' },
		{ place: 'London', country: 'England', placeType: 'City, River', id: '2', coordinates: '1234, 5678' },
		{ place: 'Rome', country: 'Italy', placeType: 'City, River, Ancient', id: '3.0', coordinates: '1234, 5678' },
		{ place: 'Berlin', country: 'Germany', placeType: 'City, Swamp', id: '4', coordinates: '1234, 5678' },
		{ place: 'Madrid', country: 'Spain', placeType: 'Hot', id: '5', coordinates: '1234, 5678' }
	];

	beforeEach(function () {
		module("palladioApp.services");
	});

	it('service should exist', inject(['dataService', function(ds) {
		expect(ds).not.toEqual(null);
	}]));

    it('for a single file should just return that file', inject(['dataService', 'dataPromise', function (ds, dp) {
		ds.addFile(peopleData, 'People');

		expect(ds.getFiles().length).toEqual(1);

		dp.then(function (d) {
			expect(dp.data.length).toEqual(3);
			expect(dp.xfilter.size()).toEqual(3);
		});
    }]));

    describe('for two files with a single link', function () {

		var ds;
		var data;

		beforeEach(inject( function (_dataService_) {
			ds = _dataService_;
			ds.addFile(peopleData, 'People');
			ds.addFile(placeData, 'Places');

			// Run auto-recognition
			ds.getFiles().forEach( function (file) {
				file.fields = file.autoFields;
			});
			ds.setDirty();

			var files = ds.getFiles();
			var source = {
				file: files[0],
				field: files[0].fields[3]
			};
			var lookup = {
				file: files[1],
				field: files[1].fields[0]
			};

			ds.addLink({
				source: source,
				lookup: lookup
			});
		}));

		it('should have same length as source', function () {
			ds.getData().then(function (data) {
				expect(data.data.length).toEqual(peopleData.length);
			});
		});

		it('should have no "Type" field presented to the user', function () {
			ds.getData().then(function (data) {
				data.metadata.forEach(function (d) {
					expect(d.description).not.toEqual("place type");
				});
			});
		});

		it('should have include a supplemental field', function () {
			ds.getData().then(function (data) {
				var descriptions = data.metadata.map(function (d) {
					return d.description;
				});
				expect(descriptions).toContain('country');
			});
		});

		it('should reference a type field from the "place" field', function () {
			ds.getData().then(function (data) {
				var placeField = data.metadata.filter(function (d) { return d.key === 'place'; })[0];
				expect(placeField.typeField[0]).toEqual('place type');
			});
		});

		it('should have an internal data structure with fields from both source tables, plus a "Place Type" field', function () {
			ds.getData().then(function (data) {
				expect(d3.keys(data.data[0]).length).toEqual(d3.keys(peopleData[0]).length + d3.keys(placeData[0]).length + 1);
				expect(d3.keys(data.data[0])).toContain('place type');
			});
		});

		it('has the correct link metadata', function () {
			ds.getData().then(function (data) {
				expect(ds.getLinks()[0].metadata.matches).toEqual(3);
			});
		});

		it('should identify a "latlong" data type field', function () {
			ds.getData().then(function (data) {
				expect(data.metadata.filter(function (d) { return d.type === 'latlong'; }).length).toEqual(1);
			});
		});

		it('should identify the "place" field as the descriptive field for the coordinates', function () {
			ds.getData().then(function (data) {
				expect(data.metadata.filter(function (d) {return d.type === 'latlong'; })[0].descriptiveField.key)
					.toEqual('place');
			});
		});
    });

    describe('for two files with a single link on a numeric field', function () {

		var ds;

		beforeEach(inject( function (_dataService_) {
			ds = _dataService_;
			ds.addFile(peopleData, 'People');
			ds.addFile(placeData, 'Places');

			// Run auto-recognition
			ds.getFiles().forEach( function (file) {
				file.fields = file.autoFields;
			});
			ds.setDirty();

			var files = ds.getFiles();
			var source = {
				file: files[0],
				field: files[0].fields[6]
			};
			var lookup = {
				file: files[1],
				field: files[1].fields[3]
			};

			ds.addLink({
				source: source,
				lookup: lookup
			});
		}));

		it('should have same length as source', function () {
			ds.getData().then(function (data) {
				expect(data.data.length).toEqual(peopleData.length);
			});
		});

		it('should have no "Type" field presented to the user', function () {
			ds.getData().then(function (data) {
				data.metadata.forEach(function (d) {
					expect(d.description).not.toEqual("place type");
				});
			});
		});

		it('should have include a supplemental field', function () {
			ds.getData().then(function (data) {
				var descriptions = data.metadata.map(function (d) {
					return d.description;
				});
				expect(descriptions).toContain('country');
			});
		});

		it('should reference a type field from the "place" field', function () {
			ds.getData().then(function (data) {
				var placeField = data.metadata.filter(function (d) { return d.key === 'place'; })[0];
				expect(placeField.typeField[0]).toEqual('id type');
			});
		});

		it('should have an internal data structure with fields from both source tables, plus a "Place Type" field', function () {
			ds.getData().then(function (data) {
				expect(d3.keys(data.data[0]).length).toEqual(d3.keys(peopleData[0]).length + d3.keys(placeData[0]).length + 1);
				expect(d3.keys(data.data[0])).toContain('id type');
			});
		});

		it('should actually look up the country fields', function () {
			ds.getData().then(function (data) {
				var bobCountry, samCountry, eveCountry;
				bobCountry = data.data.filter(function (d) { return d.name === 'Bob'; })[0].country;
				samCountry = data.data.filter(function (d) { return d.name === 'Sam'; })[0].country;
				eveCountry = data.data.filter(function (d) { return d.name === 'Eve'; })[0].country;

				expect(bobCountry).toEqual('France');
				expect(samCountry).toEqual('England');
				expect(eveCountry).toEqual('Italy');
			});
		});

		it('has the correct link metadata', function () {
			expect(ds.getLinks()[0].metadata.matches).toEqual(3);
		});
    });

	describe('for two files with a single link on multi-value field', function () {

		var ds;

		beforeEach(inject( function (_dataService_) {
			ds = _dataService_;
			ds.addFile(peopleData, 'People');
			ds.addFile(placeData, 'Places');

			// Run auto-recognition
			ds.getFiles().forEach( function (file) {
				file.fields = file.autoFields;
			});
			ds.setDirty();

			var files = ds.getFiles();

			files[0].fields[5].mvDelimiter = ',';

			var source = {
				file: files[0],
				field: files[0].fields[5]
			};
			var lookup = {
				file: files[1],
				field: files[1].fields[0]
			};

			ds.addLink({
				source: source,
				lookup: lookup
			});
		}));

		it('should have triple length of source', function () {
			ds.getData().then(function (data) {
				expect(data.data.length).toEqual(peopleData.length * 3);
			});
		});

		it('should have include a supplemental field', function () {
			ds.getData().then(function (data) {
				var descriptions = data.metadata.map(function (d) {
					return d.description;
				});
				expect(descriptions).toContain('country');
			});
		});
	});

	describe('for two files with two links', function () {

		var ds;

		beforeEach(inject( function (_dataService_) {
			ds = _dataService_;
			ds.addFile(peopleData, 'People');
			ds.addFile(placeData, 'Places');

			// Run auto-recognition
			ds.getFiles().forEach( function (file) {
				file.fields = file.autoFields;
			});
			ds.setDirty();

			var files = ds.getFiles();

			ds.addLink({
				source: {
					file: files[0],
					field: files[0].fields[3]
				},
				lookup: {
					file: files[1],
					field: files[1].fields[0]
				}
			});

			ds.addLink({
				source: {
					file: files[0],
					field: files[0].fields[4]
				},
				lookup: {
					file: files[1],
					field: files[1].fields[0]
				}
			});
		}));

		it('should have double length of source', function () {
			ds.getData().then(function (data) {
				expect(data.data.length).toEqual(peopleData.length * 2);
			});
		});

		it('should have include a full lineage in the description of supplemental fields', function () {
			ds.getData().then(function (data) {
				var descriptions = data.metadata.map(function (d) {
					return d.description;
				});
				expect(descriptions).toContain('country');
			});
		});

		it('should have include a number of "type" field values equal to the size of the source file for each lookup', function () {
			ds.getData().then(function (data) {
				expect(data.data.filter(function (d) { return d['place type'] === 'birthPlace'; }).length)
					.toEqual(peopleData.length);
				expect(data.data.filter(function (d) { return d['place type'] === 'deathPlace'; }).length)
					.toEqual(peopleData.length);
			});
		});
	});

	describe('a two-stage link, with both stages single links', function () {

		var ds;

		beforeEach(inject( function (_dataService_) {
			ds = _dataService_;
			ds.addFile(letterData, 'Letters');
			ds.addFile(peopleData, 'People');
			ds.addFile(placeData, 'Places');

			// Run auto-recognition
			ds.getFiles().forEach( function (file) {
				file.fields = file.autoFields;
			});
			ds.setDirty();

			var files = ds.getFiles();

			ds.addLink({
				source: {
					file: files[0],
					field: files[0].fields[1]
				},
				lookup: {
					file: files[1],
					field: files[1].fields[0]
				}
			});

			ds.addLink({
				source: {
					file: files[1],
					field: files[1].fields[3]
				},
				lookup: {
					file: files[2],
					field: files[2].fields[0]
				}
			});
		}));

		it('should have the same length as the source', function () {
			ds.getData().then(function (data) {
				expect(data.data.length).toEqual(letterData.length);
			});
		});

		it('should have include supplemental fields', function () {
			ds.getData().then(function (data) {
				var descriptions = data.metadata.map(function (d) {
					return d.description;
				});
				expect(descriptions).toContain('sex');
				expect(descriptions).toContain('country');
			});
		});
	});

	describe('a two-stage link, with both single first-stage and double-second stage', function () {

		var ds;

		beforeEach(inject( function (_dataService_) {
			ds = _dataService_;
			ds.addFile(letterData, 'Letters');
			ds.addFile(peopleData, 'People');
			ds.addFile(placeData, 'Places');

			// Run auto-recognition
			ds.getFiles().forEach( function (file) {
				file.fields = file.autoFields;
			});
			ds.setDirty();

			var files = ds.getFiles();

			ds.addLink({
				source: {
					file: files[0],
					field: files[0].fields[1]
				},
				lookup: {
					file: files[1],
					field: files[1].fields[0]
				}
			});

			ds.addLink({
				source: {
					file: files[1],
					field: files[1].fields[3]
				},
				lookup: {
					file: files[2],
					field: files[2].fields[0]
				}
			});

			ds.addLink({
				source: {
					file: files[1],
					field: files[1].fields[4]
				},
				lookup: {
					file: files[2],
					field: files[2].fields[0]
				}
			});
		}));

		it('should have double the length as the source', function () {
			ds.getData().then(function (data) {
				expect(data.data.length).toEqual(letterData.length * 2);
			});
		});

		it('should have include supplemental fields', function () {
			ds.getData().then(function (data) {
				var descriptions = data.metadata.map(function (d) {
					return d.description;
				});

				expect(descriptions).toContain('sex');
				expect(descriptions).toContain('country');
				expect(descriptions).toContain('country');
			});
		});

		it('should have include a number of "type" field values equal to the size of the source file for each lookup', function () {
			ds.getData().then(function (data) {
				expect(data.data.filter(function (d) { return d['place type'] === 'birthPlace' && d['name type'] === 'author'; }).length)
					.toEqual(letterData.length);
				expect(data.data.filter(function (d) { return d['place type'] === 'deathPlace' && d['name type'] === 'author'; }).length)
					.toEqual(letterData.length);
			});
		});
	});

	describe('a two-stage link, with both double first-stage and double-second stage', function () {

		var ds;

		beforeEach(inject( function (_dataService_) {
			ds = _dataService_;
			ds.addFile(letterData, 'Letters');
			ds.addFile(peopleData, 'People');
			ds.addFile(placeData, 'Places');

			// Run auto-recognition
			ds.getFiles().forEach( function (file) {
				file.fields = file.autoFields;
			});

			ds.getFiles()[2].fields[2].mvDelimiter = ',';
			ds.getFiles()[1].fields[5].mvDelimiter = ',';

			ds.setDirty();

			var files = ds.getFiles();

			ds.addLink({
				source: {
					file: files[0],
					field: files[0].fields[1]
				},
				lookup: {
					file: files[1],
					field: files[1].fields[0]
				}
			});

			ds.addLink({
				source: {
					file: files[0],
					field: files[0].fields[2]
				},
				lookup: {
					file: files[1],
					field: files[1].fields[0]
				}
			});

			ds.addLink({
				source: {
					file: files[1],
					field: files[1].fields[3]
				},
				lookup: {
					file: files[2],
					field: files[2].fields[0]
				}
			});

			ds.addLink({
				source: {
					file: files[1],
					field: files[1].fields[4]
				},
				lookup: {
					file: files[2],
					field: files[2].fields[0]
				}
			});
		}));

		it('should have quadruple the length as the source', function () {
			ds.getData().then(function (data) {
				expect(data.data.length).toEqual(72);
			});
		});

		it('should have include a full lineage in the description of supplemental fields', function () {
			ds.getData().then(function (data) {
				var descriptions = data.metadata.map(function (d) {
					return d.description;
				});

				expect(descriptions).toContain('sex');
				expect(descriptions).toContain('country');
			});
		});

		it('should have include a number of "type" field values equal to the size of the source file for each lookup', function () {
			ds.getData().then(function (data) {
				expect(data.data.filter(function (d) { return d['place type'] === 'birthPlace' && d['name type'] === 'author'; }).length)
					.toEqual(24);
				expect(data.data.filter(function (d) { return d['place type'] === 'deathPlace' && d['name type'] === 'author'; }).length)
					.toEqual(15);
				expect(data.data.filter(function (d) { return d['place type'] === 'birthPlace' && d['name type'] === 'recipient'; }).length)
					.toEqual(21);
				expect(data.data.filter(function (d) { return d['place type'] === 'deathPlace' && d['name type'] === 'recipient'; }).length)
					.toEqual(12);
				expect(data.data.filter(function (d) { return d['name type'] === 'author'; }).length)
					.toEqual(39);
				expect(data.data.filter(function (d) { return d['name type'] === 'recipient'; }).length)
					.toEqual(33);
			});
		});
	});
});