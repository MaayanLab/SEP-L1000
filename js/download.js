var clipboard = new Clipboard('.copy');
clipboard.on('success', function(e) {
    flashTooltip(e.trigger, 'Copied!');
});

function flashTooltip(elem, msg) {
	// distroy the helper text
	$(elem).tooltip('destroy');
	// show tooltip
    elem.setAttribute('title', msg);
    $(elem).tooltip('show');
    // remote title and tooltip
    setTimeout(function(){
    	$(elem).tooltip('destroy');
    	elem.removeAttribute('title');
    }, 500);
}

// For data
$.getJSON('data/download_data.json', function(results){
	var headerLabels = ['Name', 'Description', 'Rows', 'Columns', 'Size(MB)', 'md5', 'Source', 'Reference'];
	var widths = ["20%", "50%", "5%", "5%", "5%", "5%", "5%", "5%"];

    var table = $('<table>').addClass('table table-striped table-hover table-condensed');

    var thead = $('<thead>');
    var tr = $('<tr>')

    $.each(headerLabels,function(i, headerLabel) {
    	var w = widths[i];
        tr.append('<th style="width:' +w+ ';">' + headerLabel + '</th>');
    });

    thead.append(tr)
    table.append(thead);
    $("#data").append(table);
    var columnsDef = [   
    { 
    	"data": "Name",
    	"render": function(data, type, full, meta){
    		return '<a href="'+full['path']+'"download>'+data+'</a>';
    	},
    	"className": "left"
    },
    { 
    	"data": "Description",
    	"className": "left"
    },
    { "data": "Rows"},
    { "data": "Columns"},
    { "data": "Size(MB)"},
    { 
    	"data": "md5",
    	"render": function(data, type, full, meta){
    		var icon = '<span class="glyphicon glyphicon-copy" ></span>';
    		return '<a class="copy" data-toggle="tooltip" title="Click to copy" data-clipboard-text="'+ data +'">' + icon + '</a>';
    	}
    },
    { 
    	"data" : "Source",
    	"render": function(data, type, full, meta){
    		var icon = '<span class="glyphicon glyphicon-share-alt"></span>'
    		if (data) {
    			return '<a target="_blank" data-toggle="tooltip" title="Link to source" href="'+data+'">'+icon+'</a>';	
    		}else{
    			return icon;
    		};
    	},
	},
    { 
        "data": "Reference", 
        "render": function(data, type, full, meta){
        	var icon = '<span class="glyphicon glyphicon-book"></span>'
        	if (data) {
        		return '<a target="_blank" data-toggle="tooltip" title="Link to reference" href="http://www.ncbi.nlm.nih.gov/pubmed/'+data+'">'+icon+'</a>';	
        	}else{
        		return icon;
        	}
        },
    }
    ];

    rctable = table.dataTable({
        "data": results,
        "columns": columnsDef,
        "order": [[0, 'asc']],
        "deferRender": true,
        "bAutoWidth": false,
        "ordering": false,
        "fnInitComplete": function(oSettings, json){ //DataTables has finished its initialisation.
            $('[data-toggle="tooltip"]').tooltip();
        },
    });

});

// For metadata
$.getJSON('data/download_metadata.json', function(results){
	var headerLabels = ['Name', 'Fields', 'Rows', 'Columns', 'Size(MB)', 'md5'];
	var widths = ["20%", "40%", "10%", "10%", "10%", "10%"];

    var table = $('<table>').addClass('table table-striped table-hover table-condensed');

    var thead = $('<thead>');
    var tr = $('<tr>')

    $.each(headerLabels,function(i, headerLabel) {
    	var w = widths[i];
        tr.append('<th style="width:' +w+ ';">' + headerLabel + '</th>');
    });

    thead.append(tr)
    table.append(thead);
    $("#metadata").append(table);
    var columnsDef = [   
    { 
    	"data": "Name",
    	"render": function(data, type, full, meta){
    		return '<a href="'+full['path']+'"download>'+data+'</a>';
    	},
    	"className": "left"
    },
    { 
    	"data": "Fields",
    	"render": function(data, type, full, meta){
    		var res = [];
    		$.each(data, function(i, d){
    			res.push( '<code>'+ d +'</code>' );
    		})
    		return res.join(', ')
    	},
    	"className": "left"
    },
    { "data": "Rows", "className": "left"},
    { "data": "Columns", "className": "left"},
    { "data": "Size(MB)", "className": "left"},
    { 
    	"data": "md5",
    	"render": function(data, type, full, meta){
    		var icon = '<span class="glyphicon glyphicon-copy" ></span>';
    		return '<a class="copy" data-toggle="tooltip" title="Click to copy" data-clipboard-text="'+ data +'">' + icon + '</a>';
    	},
    	"className": "left"
    },
    ];

    rctable = table.dataTable({
        "data": results,
        "columns": columnsDef,
        "order": [[0, 'asc']],
        "deferRender": true,
        "bAutoWidth": false,
        "ordering": false,
        "fnInitComplete": function(oSettings, json){ //DataTables has finished its initialisation.
            $('[data-toggle="tooltip"]').tooltip();
        },
    });

});
