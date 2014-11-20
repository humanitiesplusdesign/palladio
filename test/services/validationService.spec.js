describe("Validation Service:", function () {
	var vs;

	beforeEach(function () {
		module("palladio.services.validation");

		inject(['validationService', function(validationService) {
			vs = validationService;
		}]);
	});

	it('validationService service should exist', function() {
		expect(vs).not.toEqual(null);
	});

	it('validationService service is a function that returns an Array', function() {
		expect(Array.isArray(vs([],''))).toBe(true);
	});

	describe('When "type" is "text"', function () {

	});

	describe('When "type" is "number"', function () {
		var type = 'number';

		it('should return no errors for arrays of numbers', function () {
			var arr = [12345, 67890, 0, -3, 5.763];
			expect(vs(arr, type).length).toBe(0);
		});

		it('should return no errors for arrays of strings convertible to numbers', function () {
			var arr = ['12345', 67890, '0', '-3', '5.763'];

			expect(vs(arr, type).length).toBe(0);
		});

		it('should return errors for arrays containing strings that are not numbers', function () {
			var arr = ['foo', 67890, '-3', 'bar'];

			expect(vs(arr, type).length).toBe(2);
		});
	});

	describe('When "type" is "date"', function () {

		var type = 'date';

		it('should return no errors for proper dates', function () {
			var arr = ['1111-11-11', '2000-12-30', '1888-01-31', '9999-01-01', '1888-01-2', '1888-1-02', '-1000-01-01'];

			// Dates that don't work yet but probably should: '10-01-01', '-100-01-01'

			expect(vs(arr, type).length).toBe(0);
		});

		it('should return no errors for year-only dates', function () {
			var arr = ['1111', '2000', '1888', '9999', '1888', '1888'];

			expect(vs(arr, type).length).toBe(0);
		});

		it('should return no errors for year-only dates that are not 4 digits or are BC', function () {
			var arr = ['1', '22', '333', '-1000', '-100', '-10', '-1'];

			expect(vs(arr, type).length).toBe(0);
		});

		it('should return errors for bad dates', function () {
			var arr = ['1500-13-01', '1500-01-32', '1500-00-01', '1500-01-00',
				'1500/01/01', '1500.01.01', '1500 01 01', '1888-', ' 1888', '1888 ',
				' 1500-13-01', '1500-13-01 ', '-1500-13-01', '1500-13-01-', '19999',
				'19999/01/01'];

			expect(vs(arr, type).length).toBe(arr.length);
		});

	});

	describe('When "type" is "latlong"', function () {

		var type = 'latlong';

		it('should return no errors for proper latlongs', function() {
			var arr = ['01.1234,01.1234', '-90,-180', '90,180'];

			expect(vs(arr, type).length).toBe(0);
		});

		it('should return errors for bad latlongs or improper delimiters', function () {
			var arr = ['01,1234,01.1234', '01.1234,01,1234', 'foo,12', '12,foo', '12.34'];

			expect(vs(arr, type).length).toBe(arr.length);

		});

	});

	describe('When "type" is "url"', function () {

	});
});