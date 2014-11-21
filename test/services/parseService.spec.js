describe("Parse Service:", function () {

	beforeEach(function () {
		module("palladioApp.services");
	});

	it('parseService service should exist', inject(['parseService', function(ps) {
		expect(ps).not.toEqual(null);
	}]));
});