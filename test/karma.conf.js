module.exports = function(config) {
  config.set({
    basePath: '../',

    frameworks: ['jasmine'],
    
    files: [
		'palladio.js',
		'test/lib/angular-mocks.js',
		'test/**/*.spec.js'
    ],

	browsers: [
		// 'Chrome'
		'ChromeCanary'
		// 'PhantomJS'
	],

	plugins: [
		'karma-jasmine',
		'karma-chrome-launcher'
	],

	singleRun: true,

	captureTimeout: 60000
  });
};