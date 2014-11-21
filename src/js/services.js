angular.module('palladioApp.services', [])
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
					specials.filter(function(s) {
						// Ignore some specials depending on the data type.
						return !(type === 'date' && s === '-' ) &&
								!(type === 'url' && (s === ':' || s === '/' || s === '_' || s === '-' ));
					}).forEach(function (s) {
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
					var dateTest = RegExp('^[-]\\d\\d\\d\\d($)|([-](0[0-9]|1[012]|[0-9])[-](0[0-9]|[12][0-9]|3[01]|[0-9])$)');
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
					if (isNumber(value)) return 'number';
					// String
					if (isUrlLike(value)) return 'url';
					//if (isBooleanLike(value)) return 'boolean';
					if (isDateLike(value)) return 'date';
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

				objs.forEach(function(d){
					for(var key in keys) {
						keys[key].push(sniff(d[key]));
					}
				});

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

	}])
	.factory("dataService", function (parseService, validationService, spinnerService, $q) {

		// Set this to "true" if data or links have been added/removed/changed

		var dirty = false;

		// Files that are loaded in the refine stage
		var files = [];

		var data, metadata, xfilter;

		// We give files unique numeric identifiers.
		var uniqueCounter = 0;

		var addFile = function (data, label) {
			var file = {};
			file.label = label || "Untitled";
			file.id = files.length;
			// Do auto-recognition on load
			file.autoFields = parseService.getFields(data);

			var maxUniques = d3.max(file.autoFields, function (f) { return f.uniques.length; });
			var descriptiveField = file.autoFields.filter(function (f) { return f.uniques.length === maxUniques; })[0];

			file.autoFields.forEach(function (f) { if(f.key !== descriptiveField.key) f.descriptiveField = descriptiveField; });

			var uniqueKey;

			// If this is the first/primary file, count by the descriptive field.
			if(files.length === 0) {
				uniqueKey = file.autoFields.filter(function (f) { return f.uniqueKey; })[0];
				if(uniqueKey) {
					uniqueKey.countBy = true;
				} else {
					descriptiveField.countBy = true;
				}
			}

			// But only pick up the basics by default. If the user triggers auto-recognition
			// then we can get the rest of the auto-recognized meta-data, like type.
			file.fields = file.autoFields.map(function (d) {
				return {
					key: d.key,
					description: d.description,
					cardinality: d.cardinality,
					type: d.type,
					blanks: d.blanks,
					uniques: d.uniques,
					uniqueKey: d.uniqueKey,
					special: d.special,
					unassignedSpecialChars: d.special,
					countBy: d.countBy,
					errors: validationService(d.uniques.map(function(d) { return d.key; }), d.type),
					descriptiveField: d.descriptiveField
				};
			});

			file.data = data;
			file.uniqueId = uniqueCounter;
			uniqueCounter++;

			files.push(file);
			setDirty();
		};

		var addFileRaw = function(file) {
			files.push(file);
			uniqueCounter++;
			setDirty();
		};

		var deleteFile = function(fileId) {
			var i = null;

			files.forEach(function(f, idx) {
				if(f.uniqueId === fileId) {
					i = idx;
				}
			});

			// Remove the file.
			if(i !== null) files.splice(i, 1);

			// Remove links to this file.
			var linksToDelete = [];
			links.forEach(function (l, i) {
				if(l.lookup.file.uniqueId === fileId ||
					l.source.file.uniqueId === fileId) {
					linksToDelete.unshift([l, i]);
				}
			});
			linksToDelete.forEach(function (d) {
				deleteLink(d[0], d[1]);
			});

			setDirty();
		};

		var getFiles = function() {
			return files;
		};

		var setCountBy = function(field) {
			// There can be only one.
			files.forEach(function (file) {
				file.fields.forEach( function (field) {
					field.countBy = false;
				});
			});

			field.countBy = true;
		};

		function copyField(field) {
			return {
				blanks: field.blanks,
				cardinality: field.cardinality,
				confirmed: field.confirmed,
				countBy: field.countBy,
				countDescription: field.countDescription,
				countable: field.countable,
				delete: field.delete,
				description: field.description,
				descriptiveField: field.descriptiveField,
				errors: field.errors.slice(0),
				hierDelimiter: field.hierDelimiter,
				ignore: field.ignore,
				key: field.key,
				mvDelimiter: field.mvDelimiter,
				originFileId: field.originFileId,
				special: field.special.slice(0),
				type: field.type,
				typeField: field.typeField,
				unassignedSpecialChars: field.unassignedSpecialChars? field.unassignedSpecialChars.slice(0) : undefined,
				uniqueKey: field.uniqueKey,
				uniques: field.uniques.slice(0),
			};
		}

		// Links that are populated in the link stage:
		var links = [];

		var addLink = function (link) {

			// If the lookup field is undefined, determine the best field using calcLinkMetadata method.
			if(link.lookup.field === undefined) {
				var md = {};
				var maxMatches = -1;
				var bestField = {};

				link.lookup.file.fields.forEach(function(f) {
					// Try calculating metadata with this link.
					link.lookup.field = f;
					md = calcLinkMetadata(link.source, link.lookup);
					if(md.matches > maxMatches) {
						maxMatches = md.matches;
						bestField = f;
					}
				});

				link.lookup.field = bestField;
			}
			
			// If metadata is undefined, calculate it.
			if(link.metadata === undefined) {
				link.metadata = calcLinkMetadata(link.source, link.lookup);
			}

			links.push(link);
			setDirty();
		};

		var addLinkRaw = function (link) {
			links.push(link);
			setDirty();
		}

		var deleteLink = function (link, index) {
			
			// Figure out the index if we need to.
			if(index === undefined) {
				links.forEach(function(l, i) {
					if(l.source.file.uniqueId === link.source.file.uniqueId &&
						l.source.field.key === link.source.field.key &&
						l.lookup.file.uniqueId === link.lookup.file.uniqueId &&
						l.lookup.field.key === link.lookup.field.key) {

						index = i;
					}
				});
			}

			links.splice(index,1);
			setDirty();
		};

		var getLinks = function () {
			return links;
		};

		var calcLinkMetadata = function(source, lookup) {
			var lookupMap = d3.map();
			var coercedKey;

			lookup.field.uniques.forEach(function (d) {
				if(lookup.field.type !== 'number') {
					coercedKey = d.key;
				} else {
					coercedKey = +d.key;
				}
				lookupMap.set(coercedKey, true);
			});

			var total = source.field.uniques.length;

			var matches = source.field.uniques
					.map(function (d) {
						if(source.field.type !== 'number') {
							coercedKey = d.key.split(source.field.mvDelimiter)[0].trim();
						} else {
							coercedKey = +d.key.split(source.field.mvDelimiter)[0].trim();
						}
						return lookupMap.has(coercedKey);
					})
					.filter(function (d) { return d; })
					.length;

			var color = "#33C44A"; //"rgba(0, 255, 0, 0.5)";

			if(matches/total < 0.99) {
				color = "rgba(226, 217, 0, 1)";
			}

			if(matches/total < 0.30) {
				color = "rgb(247, 0, 69)"
			}

			return {
				matches: matches,
				total: total,
				lookup: lookup.file.data.length,
				background: color
			};
		};

		///////////////////////////////////////////////////////////////////////
		//
		// Groundwork for the getData function.
		//
		///////////////////////////////////////////////////////////////////////

		var tempArr, tempRow, card, newData, dimsToExplode, dimsWithHiers, dimsWithIgnores,
			centralFile, internalLinks;

		function process() {
			tempArr = [];
			tempRow = {};
			tempField = {};
			card = 1;
			newData = [];
			metadata = [];
			dimsToExplode = [];
			dimsWithHiers = [];
			dimsWithIgnores = [];
			centralFile = undefined;
			internalLinks = angular.copy(links),
			filesToProcess = [];

			// Functions to populate incoming and outgoing links for each file and link file. 
			// Note, the function is using the uniqueId on 'f' in the forEach scope, so it is 
			// always the old uniqueId even though we copy the files during the lookup process.
			// filesToProcess = links.map(function (link) { return link.source.file; });

			files.forEach(function (f) {
				determineCountableFields(f);
				filesToProcess.push(f);
			});

			filesToProcess.forEach(function (f) {
				determineCountableFields(f);
				f.sourceFor = function () {
					return internalLinks.filter( function (l) {
						return l.source.file.uniqueId === f.uniqueId;
					});
				};
			});

			// Update countable attributes on links as well.
			links.forEach(function(l) {
				determineCountableFields(l.source.file);
				determineCountableFields(l.lookup.file);
			});

			internalLinks.forEach(function(l) {
				determineCountableFields(l.source.file);
				determineCountableFields(l.lookup.file);
			});

			// Deal with the situation in which there are no links by only taking the first file.
			if(files[0]) {
				centralFile = filesToProcess[0];
			}

			// Traverse a network of links, determining which file is the central one.
			// Note: If you don't link all files together, then unlinked files *** are ignored ***
			internalLinks.forEach(function (l) {
				// If our current central file guess is used as a lookup in this link, replace it
				// with the source file. Also do this if centralFile is not defined.
				if( !centralFile || centralFile.uniqueId === l.lookup.file.uniqueId ) {
					centralFile = filesToProcess.filter(function (f) { return f.uniqueId === l.source.file.uniqueId; })[0];
				}
			});

			// Function to perform lookups recursively.
			function performLookups(file) {

				var nf = transformFile(file);

				// For a single file, just return that file.
				if(nf.sourceFor().length === 0) {
					return nf;
				}

				nf.sourceFor().forEach( function (l) {

					var lookup = function () {
						// Build the lookup map.
						var lookupMap = d3.map();
						var coercedKey = '';
						l.lookup.file.data.forEach( function (d) {
							if(l.lookup.field.type !== 'number') {
								coercedKey = "" + d[l.lookup.field.key];
							} else {
								coercedKey = +d[l.lookup.field.key];
							}
							lookupMap.set(coercedKey, d);
						});

						function doLookup(d) {
							// 'd' is the source record
							l.lookup.file.fields.forEach(function (f) {
								if(l.source.field.type !== 'number') {
									coercedKey = "" + d[l.source.field.key];
								} else {
									coercedKey = +d[l.source.field.key];
								}

								if(lookupMap.has(coercedKey)) {
									d[f.key] = lookupMap.get(coercedKey)[f.key];
								} else {
									// Wipe out the field if no lookup exists.
									d[f.key] = "";
								}
							});

							// Populate the 'type' field.
							d[l.lookup.field.key + ' type'] = l.source.field.key;
						}

						return doLookup;
					}();

					// NOTE/BUG: This construct does not deal with lookups of different types with one source table ... does it?
					// TODO: Need a test for the above.
					if(nf.data[0][l.lookup.field.key + ' type'] === undefined) {
						// If we don't already have a 'type' field for this lookup, perform lookups in place.
						nf.data.forEach( function (d) {
							// Perform the lookup.
							lookup(d);
						});
					} else {
						// Otherwise we need to duplicate the existing data and push new lines.

						var originalData = nf.data.map(function (d) {
							return angular.extend({}, d);
						});
						
						originalData.forEach( function (d) {
							// Perform the lookup.
							lookup(d);

							// Push the new line
							nf.data.push(d);
						});
					}

					// Update field metadata.
					l.lookup.file.fields.forEach(function (f) {
						// If the field already exists, just add a 'type' value to it if necessary.
						var fieldArr = nf.fields.filter(function (field) { return field.key === f.key; });
						if(fieldArr.length > 0) {
							// Check the typeField actually exists.
							if(fieldArr[0].typeField === undefined) fieldArr[0].typeField = [];
							// Add the new field to it if it isn't already there.
							if(fieldArr[0].typeField.indexOf(l.lookup.field.key + ' type') === -1 ) {
								fieldArr[0].typeField.push(l.lookup.field.key + ' type');
							}
						} else {
							var newField = copyField(f);
							if(newField.typeField === undefined) newField.typeField = [];
							if(newField.originFile === undefined) newField.originFileId = l.lookup.file.uniqueId;
							newField.typeField.push(l.lookup.field.key + ' type');
							nf.fields.push(newField);
						}
					});
				});

				// Remove all links with this file as the source so we don't reprocess them.
				// Note: The current forEach is looping over an array of links that the
				//		sourceFor() function compiled before this deletion, so we will still
				//		process links that are pending in the current loop.
				var newLinks = internalLinks.filter(function (link) {
					return link.source.file.uniqueId !== nf.uniqueId;
				});

				// Rewrite links whoose source is the lookup file for this link.
				nf.sourceFor().forEach(function (l) {
					newLinks.forEach(function (link) {
						if(link.source.file.uniqueId === l.lookup.file.uniqueId) {
							// We need to re-point the file.
							link.source.file = nf;
						}
					});
				});

				internalLinks = newLinks;

				// Re-run lookups (eventually there won't be any more).
				nf = performLookups(nf);

				return nf;
			}

			if(centralFile) {

				var newFile = performLookups(centralFile);

				// Update typeField uniques.
				newFile.fields.forEach(function (f) {
					if(f.typeField !== undefined && f.typeField.length > 0) {
						f.typeFieldUniques = [];
						f.typeField.forEach(function (t, i) {
							f.typeFieldUniques[i] = [];
							newFile.data.forEach(function (d) {
								if(f.typeFieldUniques[i].indexOf(d[t]) === -1) {
									f.typeFieldUniques[i].push(d[t]);
								}
							});
						});
					}
				});

				metadata = newFile.fields;
				data = newFile.data;
				xfilter = crossfilter(data);
			}
		}

		function transformFile(file) {
			var newFile = {};

			newFile = splitHierarchies(
							removeIgnoredValues(
								explodeMultiValueFields(
									removeDeletedDimensions(
										file
									)
								)
							)
						);

			return newFile;
		}

		function removeDeletedDimensions(file) {
			var data = [];
			var newRow = {};
			var newFile = {};
			var dimsWithDelete = [];

			file.fields.forEach(function (f) {
				if(f.delete) {
					dimsWithDelete.push(f);
				}
			});

			data = file.data.map(function (d) {

				newRow = angular.extend({}, d);

				// Remove deleted dimensions
				dimsWithDelete.forEach(function (dim) {
					delete newRow[dim.key];
				});

				return newRow;
			});

			newFile = {};
			newFile.autoFields = file.autoFields.map(function (f) { return copyField(f); });
			newFile.data = data;
			newFile.fields = file.fields
									.map(function (f) { return copyField(f); })
									.filter(function(f) { return !f.delete; });
			newFile.id = file.id;
			newFile.label = file.label;
			newFile.sourceFor = file.sourceFor;
			newFile.uniqueId = file.uniqueId;

			return newFile;
		}

		function splitHierarchies(file) {

			var data = [];
			var fields = [];
			var newFile = {};
			var dimsWithHiers = [];
			var highestLevels = d3.map();

			file.fields.forEach(function (f) {
				if(f.hierDelimiter && f.hierDelimiter !== "") {
					dimsWithHiers.push(f);
				}
			});

			data = file.data.map(function (d) {
				// Handle hierarchies
				dimsWithHiers.forEach(function (f) {
					if(typeof d[f.key] === 'string') {
						d[f.key].split(f.hierDelimiter).forEach(function (h, i) {
							if(i === 0) {
								d[f.key] = h;
							} else {
								d[f.key + " " + i] = h;
								if(!highestLevels.has(f.key) || highestLevels.get(f.key) < i)
									highestLevels.set(f.key, i);
							}
						});
					}
				});
				return d;
			});

			fields = file.fields.map(function(f) { return copyField(f); });

			// Update metadata with hierarchy dimensions
			var newField;
			dimsWithHiers.forEach(function (f) {
				for(i = 1; i <= highestLevels.get(f.key); i++) {
					newField = copyField(f);
					newField.key = f.key + " " + i;
					newField.description = f.key + " Level " + (i+1);
					fields.push(newField);
				}
			});

			newFile = {};
			newFile.autoFields = file.autoFields.map(function (f) { return copyField(f); });
			newFile.data = data;
			newFile.fields = fields;
			newFile.id = file.id;
			newFile.label = file.label;
			newFile.sourceFor = file.sourceFor;
			newFile.uniqueId = file.uniqueId;

			return newFile;
		}

		function determineCountableFields(file) {
			var countableFields = file.fields.filter(function (f) { return f.uniqueKey; });

			if(countableFields.length > 0) {
				file.fields.filter(function (f) { return f.uniqueKey; })
					.forEach(function (u, i) {
						// Only do one field per file.
						if(i === 0) {
							u.countable = true;
							u.countDescription = file.label;
						}
					});
			} else {
				// No countable fields, so use the "countBy" field if it exists
				file.fields.filter(function(f) { return f.countBy; })
					.forEach(function(u, i) {
						// Only do one field per file.
						if(i === 0) {
							u.countable = true;
							u.countDescription = file.label;
						}
					});
			}
		}

		function removeIgnoredValues(file) {

			var data = [];
			var newFile = {};
			var dimsWithIgnores = [];

			file.fields.forEach(function (f) {
				if(f.ignore && f.ignore.length > 0) {
					dimsWithIgnores.push(f);
				}
			});

			data = file.data.map(function (d) {

				// Remove ignored values
				dimsWithIgnores.forEach(function (dim) {
					dim.ignore.forEach(function (ignore) {
						d[dim.key] = d[dim.key].split(ignore).join("");
					});
				});

				return d;
			});

			newFile = {};
			newFile.autoFields = file.autoFields.map(function (f) { return copyField(f); });
			newFile.data = data;
			newFile.fields = file.fields.map(function (f) { return copyField(f); });
			newFile.id = file.id;
			newFile.label = file.label;
			newFile.sourceFor = file.sourceFor;
			newFile.uniqueId = file.uniqueId;

			return newFile;
		}

		function explodeMultiValueFields(file) {

			var data = [];
			var newFile = {};
			var dimsToExplode = [];

			file.fields.forEach(function (f) {
				if(f.mvDelimiter && f.mvDelimiter !== "") {
					dimsToExplode.push(f);
				}
			});

			file.data.map(function(r) {
				// Start by splitting the comma-delimited values into arrays and stripping spaces
				tempRow = angular.extend({}, r);
				dimsToExplode.forEach(function(k) {
					tempArr = [];
					if(r[k.key] !== undefined)  {
						tempArr = r[k.key].split(k.mvDelimiter).map(function (v) {
							return v.trim();
						});
					}
					tempRow[k.key] = tempArr;
				});

				return tempRow;
			}).forEach(function(r) {  // Then we have to add several rows for each record.

				// Start by getting the cardinality (number of rows we need to create) by multiplying the 
				// length of all the arrays in the attributes we need to explode.
				card = dimsToExplode.reduce(function(p, c) {
					// What if the length is 0? Then treat it as 1.
					return p * ( r[c.key].length ? r[c.key].length : 1 );
				}, 1);

				if(card <= 1) { // If it's 1 or less, then we only need one row.
					tempRow = angular.extend({}, r);

					// Convert back to strings
					dimsToExplode.forEach(function(k) {
						tempArr = r[k.key];
						tempRow[k.key] = tempArr.shift();
					});

					data.push(tempRow);
				} else {        // It's multiple rows, so things get a little interesting.

					// Get the arrays of values of which we're going to take the cartesian product.
					tempArr = dimsToExplode.map(function(k) {
						return r[k.key];
					});

					// tempArr is now the cartesian product.
					tempArr = cartesian(tempArr);

					// Cycle through the cartesian product array and create new rows, then append them to
					// newData.

					tempArr.forEach(function(a) {
						tempRow = angular.extend({}, r);

						dimsToExplode.forEach(function(k, i) {
							tempRow[k.key] = a[i];
						});

						data.push(tempRow);
					});
				}
			});

			newFile = {};
			newFile.autoFields = file.autoFields.map(function(f) { return copyField(f); });
			newFile.data = data;
			newFile.fields = file.fields.map(function (f) { return copyField(f); });
			newFile.id = file.id;
			newFile.label = file.label;
			newFile.sourceFor = file.sourceFor;
			newFile.uniqueId = file.uniqueId;

			return newFile;
		}

		function getData() {
			var processData = $q.defer();

			function innerProcess() {
				process();
				processData.resolve();
			}

			if(dirty) {
				spinnerService.spin();
				setTimeout(innerProcess, 10);
			} else {
				processData.resolve();
			}

			dirty = false;
			return processData.promise.then(function () {
				spinnerService.hide();
				return {
					data: data,
					metadata: metadata,
					xfilter: xfilter
				};
			});
		}

		function getDataSync() {
			if(dirty) {
				process();
				dirty = false;
			}
			
			return {
				data: data,
				metadata: metadata,
				xfilter: xfilter
			};
		}

		function isDirty() {
			return dirty;
		}

		function setDirty() {
			dirty = true;
		}

		return {
			getData: getData,
			getDataSync: getDataSync,
			addFile: addFile,
			addFileRaw: addFileRaw,
			deleteFile: deleteFile,
			getFiles: getFiles,
			addLink: addLink,
			addLinkRaw: addLinkRaw,
			deleteLink: deleteLink,
			getLinks: getLinks,
			isDirty: isDirty,
			setDirty: setDirty,
			calcLinkMetadata: calcLinkMetadata,
			setCountBy: setCountBy
		};

		// Helper function for munging data with multiple values in a field.
		// Cribbed from: 
		// http://stackoverflow.com/questions/15298912/javascript-generating-combinations-from-n-arrays-with-m-elements
		function cartesian(arg) {
			var r = [], max = arg.length-1;
			function helper(arr, i) {
				for (var j=0, l=arg[i].length; j<l; j++) {
					var a = arr.slice(0); // clone arr
					a.push(arg[i][j]);
					if (i==max) {
						r.push(a);
					} else helper(a, i+1);
				}
			}
			helper([], 0);
			return r;
		}
	})
	.factory("dataPromise", function (dataService) {
		return dataService.getData();
	})
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
	})

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
	})

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
			zIndex: 2e9, // The z-index (defaults to 2000000000)
			top: 'auto', // Top position relative to parent in px
			left: 'auto' // Left position relative to parent in px
		};

		var target, spinner;

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
			}
		}
	});