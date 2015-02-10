describe("Date Service:", function () {

	beforeEach(function () {
		module("palladio.services.date");
	});

	it('should exist', inject(['dateService', function(d) {
		expect(d).not.toEqual(null);
	}]));

	it('should provide a .format method to output an internal format based on Date objects',
		inject(['dateService', function (d) {

		var td = new Date(Date.UTC(1999,0,1));
		var nd = new Date(Date.UTC(-1,0,1));

		expect(d.format(td)).toEqual("1999-01-01");
		expect(d.format(nd)).toEqual("-0001-01-01");
	}]));

	it('should provide a .formatMonth method to output an internal format based on Date objects',
		inject(['dateService', function (d) {

		var td = new Date(Date.UTC(1999,0,1));
		var nd = new Date(Date.UTC(-1,0,1));

		expect(d.formatMonth(td)).toEqual("1999-01");
		expect(d.formatMonth(nd)).toEqual("-0001-01");
	}]));

	it('should provide a .formatYear method to output an internal format based on Date objects',
		inject(['dateService', function (d) {

		var td = new Date(Date.UTC(1999,0,1));
		var nd = new Date(Date.UTC(-1,0,1));

		expect(d.formatYear(td)).toEqual("1999");
		expect(d.formatYear(nd)).toEqual("-0001");
	}]));

	it('should provide a .parse method to build a Date object based on internal format',
		inject(['dateService', function (d) {

		var td = new Date(Date.UTC(1999,0,5));
		var sd = new Date(Date.UTC(10,9,10));
		sd.setUTCFullYear(10);
		var nd = new Date(Date.UTC(-1,0,1));

		expect(d.format.parse("1999-01-05")).toEqual(td);
		
		expect(d.format.parse("0010-10-10")).toEqual(sd);

		expect(d.format.parse("-0001-01-01")).toEqual(nd);
	}]));

	it('should provide a .parseExternal method to build a Date object based on supported external formats',
		inject(['dateService', function (d) {

		var td = new Date(Date.UTC(1999,0,1));
		var sd = new Date(Date.UTC(10,9,10));
		sd.setUTCFullYear(10);
		var nd = new Date(Date.UTC(-1,0,1));

		expect(d.format.parseExternal("1999-01-01")).toEqual(td);
		expect(d.format.parseExternal("1999-1-1")).toEqual(td);
		expect(d.format.parseExternal("01/01/1999")).toEqual(td);
		expect(d.format.parseExternal("1/1/1999")).toEqual(td);
		expect(d.format.parseExternal("1999")).toEqual(td);
		
		expect(d.format.parseExternal("0010-10-10")).toEqual(sd);
		expect(d.format.parseExternal("10-10-10")).toEqual(sd);

		expect(d.format.parseExternal("-0001-01-01")).toEqual(nd);
		expect(d.format.parseExternal("-001-01-01")).toEqual(nd);
		expect(d.format.parseExternal("-01-01-01")).toEqual(nd);
		expect(d.format.parseExternal("-1-01-01")).toEqual(nd);
		expect(d.format.parseExternal("-0001-1-1")).toEqual(nd);
		expect(d.format.parseExternal("-0001")).toEqual(nd);

		expect(d.format.parseExternal("1999-01-01T15:30:57")).toEqual(td);
		// expect(d.format.parseExternal("1999-01-31T15:30:57.123456Z")).toEqual(td);
	}]));

	it('should provide a .reformatExternal method to build strings based on supported external formats',
		inject(['dateService', function (d) {

		expect(d.format.reformatExternal("1999-01-01")).toEqual("1999-01-01");
		expect(d.format.reformatExternal("1999-1-1")).toEqual("1999-01-01");
		expect(d.format.reformatExternal("01/01/1999")).toEqual("1999-01-01");
		expect(d.format.reformatExternal("1/1/1999")).toEqual("1999-01-01");
		expect(d.format.reformatExternal("1999")).toEqual("1999-01-01");
		
		expect(d.format.reformatExternal("0010-10-10")).toEqual("0010-10-10");
		expect(d.format.reformatExternal("10-10-10")).toEqual("0010-10-10");

		expect(d.format.reformatExternal("-0001-01-01")).toEqual("-0001-01-01");
		expect(d.format.reformatExternal("-001-01-01")).toEqual("-0001-01-01");
		expect(d.format.reformatExternal("-01-01-01")).toEqual("-0001-01-01");
		expect(d.format.reformatExternal("-1-01-01")).toEqual("-0001-01-01");
		expect(d.format.reformatExternal("-0001-1-1")).toEqual("-0001-01-01");
		expect(d.format.reformatExternal("-0001")).toEqual("-0001-01-01");

		expect(d.format.reformatExternal("-100")).toEqual("-0100-01-01");

		expect(d.format.reformatExternal("1999-01-01T15:30:57")).toEqual("1999-01-01");

		expect(d.format.reformatExternal("")).toEqual("");
	}]));
});