angular.module('palladio.services.validation', [])

	.factory("validationService", function() {
		return function (uniques, type) {
			var errors = [];
			var dateTest = RegExp('^([-]?\\d{1,4}|[-]?\\d{1,4}[-](0[1-9]|1[012]|[1-9])[-](0[1-9]|[12][0-9]|3[01]|[1-9]))$');
			var latlongTest = RegExp('^(\\-?\\d+(\\.\\d+)?),\\s*(\\-?\\d+(\\.\\d+)?)$');

			uniques.forEach(function (d) {
				switch (type) {
					case 'number':
						if(isNaN(+d)) errors.push({ value: d, message: '"' + d + '" is not a number' });
						break;
					case 'date':
						if(!dateTest.test(d)) errors.push({ value: d, message: '"' + d + '" is not a date' });
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
	});