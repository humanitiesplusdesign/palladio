angular.module('palladio.services.parse', [])
	.factory('parseService', [ '$http', '$q', function($http, $q){

		var parseColumn = function (prop, data, delimiter, hier, ignore, type) {

			// If the delimiter is an empty string, replace with null.
			if(delimiter === "") delimiter = null;
			if(hier === "") hier = null;

			// Note: the three dashes are different even though they don't look different.
			var specials = ['-', '–', '—', ';', ':', '_', ',', '?', '/', '!', '~'];

			var raw = data.reduce(function(prev, curr, i, a) {
				if(curr[prop] === null || curr[prop] === undefined || curr[prop] === "") {

					// Count it as a blank.
					prev.blanks = prev.blanks + 1;
				} else {

					// Search for special characters depending on the field type.
					specials.forEach(function (s) {
						if(curr[prop].indexOf(s) !== -1) {
							prev.specials.push(s);
							// We've already seen this char once so we don't have to check
							// it again for this column.
							specials = specials.filter( function(d) { return d !== s; });
						}
					});

					// Split at the multi-value delimiter (if it's null, no split)
					curr[prop].split(delimiter).map(function(d) {

						// Remove characters that should be ignored.
						if(ignore) {
							ignore.forEach(function (ig) {
								d = d.split(ig).join('');
							});
						}

						// Trim trailing whitespace (occurs if using a delimiter + space
						// which is quite common)
						return d.trim();
					}).forEach(function (d) {

						// Indicate a hierarchy split.
						d = d.replace(hier, "&rarr;");

						// Test if we've already counted it.
						if(!prev.map.has(d)) {

							// If not count it and add it to the map.
							prev.card = prev.card + 1;
							prev.map.set(d, 1);
						} else {
							prev.map.set(d, prev.map.get(d) + 1);
						}
					});
				}
				return prev;
			}, { card: 0, blanks: 0, map: d3.map(), specials: [] });

			var md = {
				uniques: raw.map.entries(),
				cardinality: raw.card,
				blanks: raw.blanks,
				special: raw.specials,
				uniqueKey: raw.map.keys().length === data.length
			};

			return md;
		};

		return {

			getFields : function(objs) {

				var isBoolean = function(value) {
					return typeof value == 'boolean';
				};

				var isString = function(value){
					return typeof value == 'string';
				};

				var isArray = function(value){
					return value.toString() == '[object Array]';
				};

				var isNumber = function(value){
					return typeof value == 'number'; //|| !isNaN(parseFloat(value));
				};

				var isObject = function(value){
					return value !== null && typeof value == 'object';
				};

				var isDate = function(value){
					return value.toString() == '[object Date]';
				};

				var isFunction = function(value){
					return typeof value == 'function';
				};

				var isBooleanLike = function(value){
					if (value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value === 1 ) return true;
					if (value.toLowerCase() === 'false' || value.toLowerCase() === 'no' || value === 0 ) return true;
					return false;
				};

				var isNumberLike = function(value) {
					return !isNaN(value.replace(',','.'));
				};

				var isDateLike = function(value){
					// We allow zero-dates (1999-00-00) even though they aren't technically valid.
					// We allow negative years in dates
					var dateTest = RegExp('^[-]?\\d\\d\\d\\d($)|([-](0[0-9]|1[012]|[0-9])[-](0[0-9]|[12][0-9]|3[01]|[0-9])$)');
					if(dateTest.test(value)) return true;
					return false;
				};

				var isLatLonLike = function(value){
					var pieces = value.split(',');
					if (pieces.length !== 2) return false;
					if (isNumberLike(pieces[0]) && isNumberLike(pieces[1])) return true;
					return false;
				};

				var isUrlLike = function(value){
					if ( value.indexOf("https://") === 0 || value.indexOf("http://") === 0 || value.indexOf("www.") === 0 ) return true;
					return false;
				};

				var sniff = function(value) {
					if (typeof value === 'undefined' || value === null || value.length === 0) return 'null';
					if (isObject(value)) return 'object';
					if (isArray(value)) return 'array';
          if (isDateLike(value)) return 'date';
					if (isNumber(value)) return 'number';
					// String
					if (isUrlLike(value)) return 'url';
					//if (isBooleanLike(value)) return 'boolean';
					if (isNumberLike(value)) return 'number';
					if (isLatLonLike(value)) return 'latlong';
					if (isString(value)) return 'text';
					return null;
				};

				var maxOnValue = function(obj){
					var entries = d3.entries(obj).sort(function(a,b){ return a.value < b.value; });
					return entries[0].key == "null" && entries.length > 1 ? entries[1].key : entries[0].key;
				};

				var reach = function(obj, path){
					path = path ? path.split('.') : null;
					var result = obj;
					if (!path) return obj;
					for (var i=0, len=path.length; i<len; i++){
						result = result[path[i]];
					}
					return result;
				};

				var unique = function(array, path) {
					var nesting = d3.nest()
						.key(function(d) { return reach(d,path); })
						.map(array);
					return d3.keys(nesting);
				};

				count = function(array,path) {
					var nesting = d3.nest()
						.key(function(d) { return reach(d, path); })
						.rollup(function(d){return d.length;})
						.map(array);
					return nesting;
				};

				var keys = {};

				d3.keys(objs[0]).forEach(function(d){ keys[d] = []; });

				for(var i=0; i < objs.length; i++) {
					for(var key in keys) {
						keys[key].push(sniff(objs[i][key]));
					}
				}

				return d3.keys(objs[0]).map(function(d){
					
					var md = parseColumn(d, objs, '', '', [], maxOnValue(count(keys[d])));

					return {
						key:d,
						description:d,
						type:maxOnValue(count(keys[d])),
						cardinality: md.cardinality,
						blanks: md.blanks,
						countBy: false,
						uniques: md.uniques,
						special: md.special,
						unassignedSpecialChars: md.special,
						uniqueKey: md.uniqueKey,
						errors: []
					};
				});

			},

			detectDelimiter : function(string, delimiters) {

				if (!arguments.length) return;

				if (!delimiters) delimiters = [",",";",":","\t"];
				
				var rows = string.split("\n"),
					delimitersCount = delimiters.map(function(d){ return 0; }),
					character,
					quoted = false,
					firstChar = true;
				
				// only on the header, for now!
				for (var row=0; row < 1; row++) {

					// ignoring blank rows */
					if (!rows[row].length) continue;

					for (var characterCount=0; characterCount < rows[row].length - 1; characterCount++) {

						character = rows[row][characterCount];

						switch(character) {

							case '"':
								if (quoted) {
									if (rows[row][characterCount+1] != '"') quoted = false;
									else characterCount++;
								}
								else if (firstChar) quoted = true;
								
								break;
								
							default:
								if (!quoted) {
									var index = delimiters.indexOf(character);
									if (index !== -1)
									{
										delimitersCount[index]++;
										firstChar = true;
										continue;
									}
								}
								break;
						}
						if (firstChar) firstChar = false;
					}
				}

				var maxCount = d3.max(delimitersCount);
				return maxCount === 0 ? '\0' : delimiters[delimitersCount.indexOf(maxCount)];
			},

			parseText : function(string, delimiter) {
				
				if (!delimiter) delimiter = this.detectDelimiter(string);
				
				var objPattern = new RegExp(
					(
						"(\\" + delimiter + "|\\r?\\n|\\r|^)" +
						"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
						"([^\"\\" + delimiter + "\\r\\n]*))"
					),
					"gi"
				);

				var arrData = [[]],
					objData = [],
					header = [];
						
				for (var arrMatches = objPattern.exec( string ); arrMatches; arrMatches = objPattern.exec( string )){

					try {
						var strMatchedDelimiter = arrMatches[ 1 ];

						if (strMatchedDelimiter.length &&
							(strMatchedDelimiter != delimiter)
							){
								arrData.push( [] );
							}
						
						var strMatchedValue;
						if (arrMatches[ 2 ]){
							strMatchedValue = arrMatches[ 2 ].replace(
								new RegExp( "\"\"", "g" ),
								"\""
							);
						} else {
							strMatchedValue = arrMatches[ 3 ];
						}

						arrData[ arrData.length - 1 ].push( strMatchedValue );
					
					} catch(e) {
						throw new Error(e.message);
					}
				}
				
				header = arrData[0];
					
				for (var row=1; row<arrData.length; row++) {

					// skipping empty rows
					if (arrData[row].length == 1 && arrData[row].length != header.length) continue;
					
					if(arrData[row].length == header.length) {
						var obj = {};
						for (var h in header){
							obj[header[h]] = arrData[row][h];
						}
						objData.push(obj);
					} else {
						throw new Error("There's something strange at line " + (row+1) + ". Please review your data." );
					}
				}
				
				return objData;

			},

			parseUrl : function(url) {

				var deferred = $q.defer();

				$http.get(url).success(function(data){
					deferred.resolve(data);
				}).error(function(){
					deferred.reject("Sorry, an error occured while fetching the data.");
				});
        
				return deferred.promise;
			},

			parseColumn: parseColumn

		};

	}]);