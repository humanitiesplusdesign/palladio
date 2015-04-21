angular.module('palladio.services.exception', ['palladio.services.date'])

	.factory("exceptionService", ['dateService', function(dateService) {
		return function (file) {
			// We got through a file and determine the exceptions of the following types:
			//   1. Blank/null/undefined records
			//   2. Records that deviate from the chosen type of the dimension
			//		For these records we guess at the correct type
			//   3. Records including special characters not expected - comma, semi-colon, and tab
			//
			// Add an 'exceptions' property to the field that is an array of exceptions with the
			// following structure:
			//
			// {
			//		index: 2						// Index of the record in the data set.
			//		exception: 't'					// 'b' = blank
			//										// 't' = type mis-match
			//										// 's' = special character
			//		info: 'url'						// The characters found, or the alternative type
			// }

			var dateTest = RegExp('^(([-]?\\d{1,4})|' +   // YYYY, -YYYY
				'([-]?\\d{1,4}[-](0[1-9]|1[012]|[1-9])[-](0[1-9]|[12][0-9]|3[01]|[1-9]))|' + // [-]YYYY-MM-DD
				// ISO formats
				'([-]?\\d{1,4}[-](0[1-9]|1[012]|[1-9])[-](0[1-9]|[12][0-9]|3[01]|[1-9])T[0-2]\\d:[0-5]\\d:[0-5]\\d\\.\\d+([+-][0-2]\\d:[0-5]\\d|[Z]?))|' +
				'([-]?\\d{1,4}[-](0[1-9]|1[012]|[1-9])[-](0[1-9]|[12][0-9]|3[01]|[1-9])T[0-2]\\d:[0-5]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|[Z]?))|' +
				'([-]?\\d{1,4}[-](0[1-9]|1[012]|[1-9])[-](0[1-9]|[12][0-9]|3[01]|[1-9])T[0-2]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|[Z]?))' +
				')$');
			// ||
			var latlongTest = RegExp('^(\\-?\\d+(\\.\\d+)?),\\s*(\\-?\\d+(\\.\\d+)?)$');

			console.log(file);

			// Initialize the exception arrays.
			file.fields.forEach(function(f) { f.exceptions = []; });

			file.data.forEach(function(d, i) {
				file.fields.forEach(function(f) {

					if(d[f.key] === null || d[f.key] === undefined || d[f.key] === "") {
						// Blank
						f.exceptions.push({
							index: i,
							exception: 'b'
						});
					} else {
						// Analyze types
						switch (f.type) {
							case 'number':
								if(isNaN(+d[f.key])) f.exceptions.push({
									index: i,
									exception: 't',
									info: 'text'
								});
								break;
							case 'date':
								if(d[f.key] && (!dateService.format.parseExternal(d[f.key]) || !dateTest.test(d[f.key]))) {
									f.exceptions.push({
										index: i,
										exception: 't',
										info: 'text'
									});
								}
								break;
							case 'latlong':
								if(!latlongTest.test(d[f.key])) f.exceptions.push({
									index: i,
									exception: 't',
									info: 'text'
								});
								break;
							case 'url':
								break;
						}

						// Analyze special characters.

					}
				});
			});

			console.log(file);

			return true;
		};
	}]);