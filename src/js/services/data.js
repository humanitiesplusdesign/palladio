angular.module('palladio.services.data', ['palladio.services.parse', 'palladio.services.validation',
		'palladio.services.spinner'])
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
			centralFile, internalLinks, tempField, filesToProcess;

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
			internalLinks = links.map(function(l) {
				return {
					source: {
						file: {
							uniqueId: l.source.file.uniqueId,
							label: l.source.file.label,
							fields: l.source.file.fields.map(function(f) {
								return copyField(f);
							}),
							data: l.source.file.data
						},
						field: {
							type: l.source.field.type,
							key: l.source.field.key
						}
					},
					lookup: {
						file: {
							uniqueId: l.lookup.file.uniqueId,
							label: l.lookup.file.label,
							fields: l.lookup.file.fields.map(function(f) {
								return copyField(f);
							}),
							data: l.lookup.file.data
						},
						field: {
							type: l.lookup.field.type,
							key: l.lookup.field.key
						}
					},
					metadata: l.metadata
				};
			});
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
				setTimeout(innerProcess, 1);
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
	});