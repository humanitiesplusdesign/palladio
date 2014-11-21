angular.module('palladio.date', [])
	.factory('dateService', function() {

		var posYear = true;
		var yearLength = 0;
		var tempDate;
		var tempStr = "";
		var yearStr = "";
		var monthStr = "";
		var dateStr = "";

		var arr;
		var isoParser = d3.time.format.iso.parse;

		function padYear(year) {
			tempStr = "" + year;
			posYear = ( tempStr[0] !== '-' );
			yearLength = tempStr.length;

			// Handle 1999, 999, 99, 9, 0, -1, -11, -111, -1111
			if(posYear && yearLength === 4) return tempStr;
			if(!posYear && yearLength === 5) return tempStr;
			if(posYear && yearLength === 3) return "0" + tempStr;
			if(!posYear && yearLength === 4) return "-0" + tempStr.substr(1,3);
			if(posYear && yearLength === 2) return "00" + tempStr;
			if(!posYear && yearLength === 3) return "-00" + tempStr.substr(1,2);
			if(posYear && yearLength === 1) return "000" + tempStr;
			if(!posYear && yearLength === 2) return "-000" + tempStr.substr(1,1);
		}

		function padMonth(month) {
			tempStr = "" + month;
			if(tempStr.length === 2) return tempStr;
			if(tempStr.length === 1) return "0" + tempStr;
		}

		function padDate(date) {
			tempStr = "" + date;
			if(tempStr.length === 2) return tempStr;
			if(tempStr.length === 1) return "0" + tempStr;
		}

		function normalizeDateString(s) {
			if(s && s.length <= 5) {
				return "" + padYear(s) + "-01-01";
			} else {
				// Handle [-YYY]Y-[M]M-[D]D
				if(s && (s.length > 4 && s.length <= 11 ) && s.indexOf('/') === -1) {
					arr = s.split('-');
					if(s[0] === '-') {
						// We have a negative year
						return "-" + padYear(arr[1]) + '-' + padMonth(arr[2]) + '-' + padDate(arr[3]);
					} else {
						// Positive year
						return "" + padYear(arr[0]) + '-' + padMonth(arr[1]) + '-' + padDate(arr[2]);
					}
				} else {
					// Handle [M]M/[D]D/[-YYY]Y
					if(s && (s.length > 4 && s.length <= 11 ) && s.indexOf('/') !== -1) {
						arr = s.split('/');
						return "" + padYear(arr[2]) + '-' + padMonth(arr[0]) + '-' + padDate(arr[1]);
					} else {
						if(s && s.length > 9 && isoParser(s)) {
							// ISO formatted date
							return "" + dimFormat(isoParser(s));
						} else {
							return "" + s;
						}
					}
				}
			}
			return "" + s;
		}

		var dimFormat = function (t) {
			if(t) {
				return padYear(t.getUTCFullYear()) + "-" +
					(t.getUTCMonth() > 9 ? t.getUTCMonth() : '0' + t.getUTCMonth()) + "-" +
					(t.getUTCDate() > 9 ? t.getUTCDate() : '0' + t.getUTCDate());
			}
		};
		
		dimFormat.parse = function (s) {
			if(s && s.length === 10 | s.length === 11) {
				posYear = s.length === 11 ? false : true;
				yearStr = s.substr(0, posYear ? 4 : 5);
				monthStr = s.substr(posYear ? 5 : 6, 2);
				dateStr = s.substr(posYear ? 8 : 9, 2);
				tempDate = new Date(Date.UTC(+yearStr, +monthStr, +dateStr));
				// Date.UTC doesn't work properly for years from 0 - 100
				// so we have to specifically set the year.
				tempDate.setUTCFullYear(+yearStr);
				return tempDate;
			} else { return ""; }
		};

		dimFormat.parseExternal = function (s) {
			return dimFormat.parse(normalizeDateString(s));
		};

		dimFormat.reformatExternal = normalizeDateString;

		dimFormat.toString = function () { return "%Y-%m-%d"; };

		var dimFormatMonth = function (t) {
			if(t) {
				return padYear(t.getUTCFullYear()) + "-" +
					(t.getUTCMonth() > 9 ? t.getUTCMonth() : '0' + t.getUTCMonth());
			}
		};
		
		dimFormatMonth.parse = function (s) {
			if(s && s.length === 8 | s.length === 9) {
				posYear = s.length === 9 ? false : true;
				yearStr = s.substr(0, posYear ? 4 : 5);
				monthStr = s.substr(posYear ? 5 : 6, 2);
				tempDate = new Date(Date.UTC(+yearStr, +monthStr, "01"));
				// Date.UTC doesn't work properly for years from 0 - 100
				// so we have to specifically set the year.
				tempDate.setUTCFullYear(+yearStr);
				return tempDate;
			} else { return ""; }
		};

		dimFormatMonth.toString = function () { return "%Y-%m"; };

		var dimFormatYear = function (t) {
			if(t) {
				return padYear(t.getUTCFullYear());
			}
		};
		
		dimFormatYear.parse = function (s) {
			if(s && s.length === 4 | s.length === 5) {
				posYear = s.length === 5 ? false : true;
				yearStr = s.substr(0, posYear ? 4 : 5);
				tempDate = new Date(Date.UTC(+yearStr, "01", "01"));
				// Date.UTC doesn't work properly for years from 0 - 100
				// so we have to specifically set the year.
				tempDate.setUTCFullYear(+yearStr);
				return tempDate;
			} else { return ""; }
		};

		dimFormatYear.toString = function () { return "%Y"; };

		return {
			format: dimFormat,
			formatMonth: dimFormatMonth,
			formatYear: dimFormatYear
		};
	});