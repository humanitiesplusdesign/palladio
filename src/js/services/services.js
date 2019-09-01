require('./component');
require('./data');
require('./date');
require('./export');
require('./filter');
require('./load');
require('./parse');
require('./spinner');
require('./validation');

angular.module('palladio.services',
	[	'palladio.services.date',
		'palladio.services.spinner',
		'palladio.components',
		'palladio.services.parse',
		'palladio.services.validation',
		'palladio.services.export',
		'palladio.services.data',
		'palladio.services.date',
		'palladio.services.filter',
		'palladio.services.load' ]);
