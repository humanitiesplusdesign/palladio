angular.module('palladio.services.validation', ['palladio.services.date'])

	.factory("validationService", ['dateService', function(dateService) {
		return function (uniques, type) {
			var errors = [];
			var dateTest = RegExp('^(([-]?\\d{1,4})|' +   // YYYY, -YYYY
				'([-]?\\d{1,4}[-](0[1-9]|1[012]|[1-9])[-](0[1-9]|[12][0-9]|3[01]|[1-9]))|' + // [-]YYYY-MM-DD
				// ISO formats
				'([-]?\\d{1,4}[-](0[1-9]|1[012]|[1-9])[-](0[1-9]|[12][0-9]|3[01]|[1-9])T[0-2]\\d:[0-5]\\d:[0-5]\\d\\.\\d+([+-][0-2]\\d:[0-5]\\d|[Z]?))|' +
				'([-]?\\d{1,4}[-](0[1-9]|1[012]|[1-9])[-](0[1-9]|[12][0-9]|3[01]|[1-9])T[0-2]\\d:[0-5]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|[Z]?))|' +
				'([-]?\\d{1,4}[-](0[1-9]|1[012]|[1-9])[-](0[1-9]|[12][0-9]|3[01]|[1-9])T[0-2]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|[Z]?))' +
				')$');
			// ||
			var latlongTest = RegExp('^(\\-?\\d+(\\.\\d+)?),\\s*(\\-?\\d+(\\.\\d+)?)$');

			uniques.forEach(function (d) {
				switch (type) {
					case 'number':
						if(isNaN(+d)) errors.push({ value: d, message: '"' + d + '" is not a number' });
						break;
					case 'date':
						if(d && !dateService.format.parseExternal(d)) {
							errors.push({ value: d, message: '"' + d + '" is not a date' });
							break;
						}
						if(!dateTest.test(d)) {
							errors.push({ value: d, message: '"' + d + '" has our of range values'});
						}
						break;
					case 'latlong':
						if(!latlongTest.test(d)) errors.push({ value: d, message: '"' + d + '" is not a lat/long pair'});
						break;
					case 'url':
						break;
				}
			});

			return errors;
		};
	}]);