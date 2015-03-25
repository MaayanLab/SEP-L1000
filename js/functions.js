function getQueryParams(qs) {
    qs = qs.split("+").join(" ");
    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;
    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }
    return params;
};

function obj2Table(obj) {
  var table = $('<table class="table table-striped table-hover">')
  $.each(obj, function(key, val){
    var tr = $('<tr id="' + key + '">');
    var tdKey = $('<td>' + key + '</td>');
    var tdVal = $('<td>' + val + '</td>');
    tr.append(tdKey);
    tr.append(tdVal);
    table.append(tr);
  });
  return table;
};

function objs2TableRows(objs, keyToAddLink, baseUrl) {
	// convert an array of objects to table rows
	// and add links
	var table = $('<tbody>')
	for (var i = 0; i < objs.length; i++) {
		var obj = objs[i];
		var tr = $('<tr id="'+obj[keyToAddLink]+'">');
		$.each(obj, function(key, val){
			var td = $('<td id="' + key + '">' + val + '</td>');
			if (key === keyToAddLink) {
				$(td).wrapInner('<a href="' + baseUrl + val + '"></a>');
			};
			tr.append(td);
		});
		table.append(tr);
	};
	return table;
};

function objs2TableRowsWithStatus(objs, keyToAddLink, baseUrl, progressBarSelector) {
	// convert an array of objects to table rows
	// and add links
	var table = $('<tbody>');
	for (var i = 0; i < objs.length; i++) {
		var obj = objs[i];
		var tr = $('<tr id="'+obj[keyToAddLink]+'">');
		$.each(obj, function(key, val){
			var td = $('<td id="' + key + '">' + val + '</td>');
			if (key === keyToAddLink) {
				$(td).wrapInner('<a href="' + baseUrl + val + '"></a>');
			};
			tr.append(td);
		});
		var progressValue = i*100/objs.length + '%';
		$(progressBarSelector).css("width", progressValue)
			table.append(tr);		
	};
	return table;
};

function addLinks(id, baseUrl){
	$('#' + id + 'td:nth-child(2)').append('<span>Here</span>');
	return;
};

function searchAutocomplete(selector){
	$(selector).autocomplete({
		minLength : 4,
		source : function(request, response){
			$.getJSON('search.php', request, function(json){
				var outObjs = [];
				for (var i = 0; i < json['se'].length; i++) {
					var obj = {};
					obj.label = json['se'][i]['umls_id'] + ':' + json['se'][i]['name'];
					obj.value = json['se'][i]['name'];
					outObjs.push(obj);
				};
				for (var i = 0; i < json['drugs'].length; i++) {
					var obj = {};
					obj.label = json['drugs'][i]['pert_id'] + ':' + json['drugs'][i]['pert_iname'];
					obj.value = json['drugs'][i]['pert_iname'];
					outObjs.push(obj);
				};
				response(outObjs);
			});
		}
	});
};

function drawPieChart(json, title, selector){
	// draw interactive piechart with json data using d3pie
	var data = [];
	var total = 0;
	$.each(json, function(key, val){
		data.push({"label": key, "value": val});
		total += val;
	});
	var pie = new d3pie(selector, {
		"header": {
			"title": {
				"text": title,
				"fontSize": 24,
				"font": "open sans"
			},
			"subtitle": {
				"text": "Total: " + total,
				"color": "#999999",
				"fontSize": 12,
				"font": "open sans"
			},
			"titleSubtitlePadding": 9
		},
		"footer": {
			"color": "#999999",
			"fontSize": 10,
			"font": "open sans",
			"location": "bottom-left"
		},
		"size": {
			"canvasWidth": 500,
			"canvasHeight": 500,
		},
		"data": {
			"sortOrder": "value-desc",
			"content": data,
		},
		"labels": {
			"outer": {
				"format": "label-value1",
				"pieDistance": 32
			},
			"inner": {
				"hideWhenLessThanPercentage": 3
			},
			"mainLabel": {
				"fontSize": 11
			},
			"percentage": {
				"color": "#ffffff",
				"decimalPlaces": 0
			},
			"value": {
				"color": "#adadad",
				"fontSize": 11
			},
			"lines": {
				"enabled": true
			}
		},
		"effects": {
			"pullOutSegmentOnClick": {
				"effect": "linear",
				"speed": 400,
				"size": 8
			}
		},
		"misc": {
			"gradient": {
				"enabled": true,
				"percentage": 100
			}
		}
	});	
};
