describe("Parse Service:", function () {

	beforeEach(function () {
		module("palladio.services.parse");
	});

	it('parseService service should exist', inject(['parseService', function(ps) {
		expect(ps).not.toEqual(null);
	}]));
});