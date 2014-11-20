angular.module('palladio.services.export', [])
	.factory("exportService", function() {
		return function (source, title) {

			function getBlob() {
            	return window.Blob || window.WebKitBlob || window.MozBlob;
          	}

          	var BB = getBlob();
         
          	var html = source
            	.attr("version", 1.1)
            	.attr("xmlns", "http://www.w3.org/2000/svg")
            	.attr("style", "")
            	.node();

            var text = $('<div></div>').html($(html).clone()).html();

          	var isSafari = (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1);

	        if (isSafari) {
	            var img = "data:image/svg+xml;utf8," + html;
	            var newWindow = window.open(img, 'download');
	        } else {
	            var blob = new BB([text], { type: "data:image/svg+xml" });
	            saveAs(blob, title)
	        }
        
		};
	});