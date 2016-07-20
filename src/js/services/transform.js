angular.module('palladio.services.transform', [])
	.factory("transformService", ['parseService', function(parseService) {
    function splitTransform(file, transform) {
      var idx = 0;
      var delimiterParam = transform.parameters.filter(function(p) { return p.key === 'delimiter'; })[0];
      var delimiter = delimiterParam && delimiterParam.value ? delimiterParam.value : ',';
      for(var i = 0; i < file.data.length; i++) {
        if(typeof file.data[i][transform.sourceKeys[0]] === 'string') {
          idx = file.data[i][transform.sourceKeys[0]].indexOf(delimiter);
          if(idx === -1) idx = file.data[i][transform.sourceKeys[0]].length;
          file.data[i][transform.targetKeys[0]] = file.data[i][transform.sourceKeys[0]].substring(0,idx);
          file.data[i][transform.targetKeys[1]] = file.data[i][transform.sourceKeys[0]].substring(idx+1);
        }
      }
      addFieldForKey(file, transform.targetKeys[0]);
      addFieldForKey(file, transform.targetKeys[1]);
      return true;
    }

    function joinTransform(file, transform) {
      var delimiterParam = transform.parameters.filter(function(p) { return p.key === 'delimiter'; })[0];
      var delimiter = delimiterParam && delimiterParam.value ? delimiterParam.value : ',';
      for(var i = 0; i < file.data.length; i++) {
        file.data[i][transform.targetKeys[0]] = '' +
          file.data[i][transform.sourceKeys[0]] +
          delimiter +
          file.data[i][transform.sourceKeys[1]];
      }
      addFieldForKey(file, transform.targetKeys[0]);
      return true;
    }

    function addFieldForKey(file, key) {
      // Don't do this if the field already exists
      if(file.fields.filter(function(f) { return f.key === key; }).length === 0) {
        var parsedCol = parseService.parseColumn(key, file.data, "", "", [], 'text');
        parsedCol.key = key;
        parsedCol.description = key + " (added dimension)";
        parsedCol.type = 'text'
        parsedCol.generated = true;
        file.fields.push(parsedCol);
      }
    }

		return function (file) {
      if(!file.transforms) file.transforms = [];
      file.transforms.forEach(function(transform,i) {
        //  transform: {
        //    type: 'split'|'join',
        //    sourceKeys: [],
        //    targetKeys: [],
        //    parameters: [{
        //      key: ...,
        //      value: ...
        //    }, ...]
        //  }

        switch(transform.type) {
          case 'split':
            // Split uses a single source key, 2 target keys and
            // a 'delimiter' parameter.
            splitTransform(file, transform)
            break;
          case 'join':
            // Join uses 2 source keys, a target key, and a
            // 'delimiter' parameter
            joinTransform(file, transform)
            break;
        }
      });

      file.autoFields = parseService.getFields(file.data);

      return file;
		};
	}]);