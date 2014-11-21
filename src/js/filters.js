angular.module('palladioApp.filters', [])
  .filter('titleCase', function () {
		return function (str) {
			return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
		};
	})

  .filter('confirmed', function () {
    return function (fields) {
      return fields.filter(function(d){ return d.confirmed; }).length;
    };
  })

  .filter('special', function () {
    return function (fields) {
      return fields.filter(function(d){ return d.special.length; }).length;
    };
  })

  .filter('unique', function () {
    return function (fields) {
        return fields.filter(function(d){ return d.uniqueKey; }).length;
    };
  })

  .filter('notSameFile', function () {
    return function (files, fileId) {
        return files.filter(function (d){ return d.id !== fileId; });
    };
  });