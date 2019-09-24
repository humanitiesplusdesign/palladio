var Spinner = require("spin.js");
angular.module('palladio.services.spinner', [])
	.factory("spinnerService", function () {

		var opts = {
			lines: 13, // The number of lines to draw
			length: 8, // The length of each line
			width: 4, // The line thickness
			radius: 15, // The radius of the inner circle
			corners: 1, // Corner roundness (0..1)
			rotate: 0, // The rotation offset
			direction: 1, // 1: clockwise, -1: counterclockwise
			color: '#000', // #rgb or #rrggbb or array of colors
			speed: 1, // Rounds per second
			trail: 60, // Afterglow percentage
			shadow: false, // Whether to render a shadow
			hwaccel: false, // Whether to use hardware acceleration
			className: 'spinner', // The CSS class to assign to the spinner
			zIndex: 2e9 // The z-index (defaults to 2000000000)
		};

		var pOpts = {
			lines: 13, // The number of lines to draw
			length: 0, // The length of each line
			width: 3, // The line thickness
			radius: 12, // The radius of the inner circle
			corners: 1, // Corner roundness (0..1)
			rotate: 0, // The rotation offset
			direction: 1, // 1: clockwise, -1: counterclockwise
			color: '#4EBDE5', // #rgb or #rrggbb or array of colors
			speed: 1, // Rounds per second
			trail: 60, // Afterglow percentage
			shadow: false, // Whether to render a shadow
			hwaccel: false, // Whether to use hardware acceleration
			className: 'spinner', // The CSS class to assign to the spinner
			zIndex: 2e9 // The z-index (defaults to 2000000000)
		};

		var target, spinner;
		var pTarget, pSpinner;

		return {
			spin: function () {
				if(!target) {
					// Try to set up if we aren't already.
					target = document.getElementById('spinner');
					spinner = new Spinner(opts).spin();

					if(target) {
						target.appendChild(spinner.el);
					}
				}

				if(target) $(target).show();

			},
			hide: function () {
				if(target) $(target).hide();
			},
			pSpin: function () {
				if(!pTarget) {
					// Try to set up if we aren't already.
					pTarget = document.getElementById('p-spinner');
					pSpinner = new Spinner(pOpts).spin();

					if(pTarget) {
						pTarget.appendChild(pSpinner.el);
					}
				}

				if(pTarget) $(pTarget).show();

			},
			pHide: function () {
				if(pTarget) $(pTarget).hide();
			}
		};
	});
