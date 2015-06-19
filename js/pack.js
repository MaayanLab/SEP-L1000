var Dot = Backbone.Model.extend({
	defaults:{
		"size": 10,
		"color": "white", 
	},

	// parse numeric string attributes to numbers
	parse: function(response){
		response.color = '#' + response.color;
		response.value = parseFloat(response.value);
		response.x = parseFloat(response.x);
		response.y = parseFloat(response.y);
		response.r = parseFloat(response.r);
		return response;
	}, 

	// send a GET request to the API to get infomation about the Dot
	getInfo: function(){
		var self = this;
		$.getJSON('get_se_drug_top.php', {umls_id: this.id, topn: 100}, function(json) {
			displayNodeInfo("#nodeInfo", self, json)
		});
		var sideEffect = self.get('label');
		$("#currentSE").text(sideEffect); // to display the name of the current side effect
	},

	updateInfo: function(filter, topn){ // to filter or not to filter known drugs 
		var self = this;
		$.getJSON('get_se_drug_top.php', {umls_id: this.id, topn: topn, filter: filter}, function(json) {
			updateNodeInfo("#nodeInfo", self, json);
		});
	}
});

// var DotView = Backbone.View.extend({
// 	//
// });

var Dots = Backbone.Collection.extend({
	
	model: Dot,

	defaults: {
		stageWidth: 600,
	},

	url:function(){
		return 'data/' + this.dbTable;
	},

	parse: function(response){
		var bubble = d3.layout.pack()
			.sort(null)
			.size([this.stageWidth, this.stageWidth])
			.padding(0.5);
		return bubble.nodes(classes(response))
	},

	defaults:{
		// "size": 10,
	},

	initialize: function(models,options){
		this.dbTable = options.dbTable;
		this.stageWidth = options.stageWidth;
		this.on("sync",this.getAutoCompleteList);
	},	

	getAutoCompleteList:function(){
		this.autoCompleteList = _.uniq( this.map(function(dot){
			return dot.get('label')}) ).filter(function(item){
			return item !== undefined;
		});
		this.trigger("autoCompleteListGot");
	},

	// to preload note info
	preloadNodeInfo: function(id) {
		var model = this.get(id);
		model.getInfo();
		window.currentDot = id; // the global variable to store the current Dot id
	},	

	transformRange: function(stageWidth,paddingWidth,sizeScale){
		// change the coordinates of dots to fit the stage scale.
		var minX = this.min(function(dot){ return dot.get('x'); }).get('x');
		var maxX = this.max(function(dot){ return dot.get('x'); }).get('x');
		var minY = this.min(function(dot){ return dot.get('y'); }).get('y');
		var maxY = this.max(function(dot){ return dot.get('y'); }).get('y');

		var stageHeight = (maxY-minY)/(maxX-minX)*stageWidth;
		var xScale = d3.scale.linear().domain([minX,maxX])
								.range([paddingWidth,stageWidth-paddingWidth]);

  // this smart linear transformation invert the Y axis, notice maxY is first.
		var yScale = d3.scale.linear().domain([maxY,minY])
							.range([paddingWidth,stageHeight-paddingWidth]);

		this.each(function(dot){
			dot.set({'x':xScale(dot.get('x')),'y':yScale(dot.get('y')),
						'size':dot.get('size')*sizeScale});
		});

		return stageHeight;
	},
});


var DiGraphView = Backbone.View.extend({
	tagName: 'svg',

	defaults: {	
		isOnStage: false,
		stageWidth: 600,
		paddingWidth: 10,
		sizeScale: 0.4, // control the size of node.
		textShowThres: 1.5,
		maxScale: 20,
		scaleExponent: 1,
		zoomTranslate: [],
		dbTables: [],
	},	


 	initialize: function(options){
 		//initialize with defaults and passed arguments.
 		_.defaults(options,this.defaults);
 		_.defaults(this,options);

 		//override view's el property
 		this.el = document.createElementNS("http://www.w3.org/2000/svg", 
 			this.tagName);

 		this.dots = new Dots([],{dbTable:this.dbTables[0], stageWidth:this.stageWidth});
 		this.activeTable = 0;

 		var self = this;
 		this.listenTo(this.dots, 'sync', this.render);
 		// call back
 		this.dots.fetch();
 	},

	render: function(){ // called after the view init
		// console.log(this.dots.get('C0029445').get('label'))

		this.stageWidth = $(this.el).parent().width();

		this.stageHeight = this.stageWidth;

 		var self = this;

 		if (this.svg === undefined) { // first time collection is fetched
	 		this.zoomTransform = _.bind(this.zoomTransform,this);
	 		this.currentScale = 1;
	 		this.zoomTranslate = [0,0];

			this.x = d3.scale.pow().exponent(this.scaleExponent)
									.domain([0,this.stageWidth])
	 								.range([0,this.stageWidth]);

	 		this.y = d3.scale.pow().exponent(this.scaleExponent)
	 								.domain([0,this.stageHeight])
	 								.range([0,this.stageHeight]);

	 		this.zoom = d3.behavior.zoom().scaleExtent([1, this.maxScale])
	 						.x(this.x)
	 						.y(this.y)
	 						.on("zoom", this.zoomTransform);

	 		this.svg = d3.select(this.el)
	 						.attr('width',this.stageWidth)
	 						.attr('height',this.stageWidth)
	 						.attr('class','svgBorder')
							.call(this.zoom)
	 						.append('g');

			this.node = this.svg.selectAll(".node")
			  .data(this.dots.filter(function(d){
			  	return d.get('label') !== undefined;
			  }))
			.enter().append("g")
			  .attr("class", "node")
			  .on('click', function(d){
			  	var modelId = d.get('id');
			  	self.dots.preloadNodeInfo(modelId);

				// highlight the corresponding category
				d3.selectAll('#colorLegend a').filter(function(D){
					d3.select(this).attr('class', '')
					return D[1] === d.get('color');
				}).each(function(D){
					d3.select(this).attr('class', 'highlight-legend')
				});
			  });

			this.node.append("title")
			  .text(function(d) { return d.get('label'); });

			this.node.append("circle")
			  .attr("r", function(d) { return d.get('r'); })
			  .style("fill", function(d) { return d.get('color'); });

			this.texts = this.node.append("text")
			  .attr("dy", function(d){
			  	var words = d.get('label').split(' ');
			  	if (words.length === 3) {
			  		return "-.3em";
			  	} else{
			  		return ".3em";
			  	};
			  })
			  .style("text-anchor", "middle")
			  .style('font-size',function(d){ return d.get('r')/3.5 + 'px'; })
			  // .style("font-size", function(d) { return Math.min(2 * d.get('r'), (2 * d.get('r') - 8) / this.getComputedTextLength() * 4) + "px"; })
			  .attr('class',function(d){ return d.get('value') > 6 ? 'display-default' : 'display-none'}); // whether to display text at first view

			this.texts.each(function(d) {
				var el = d3.select(this);
				var words = d.get('label').split(' ');
				if (words.length === 4) {
					words = [words[0]+' '+words[1], words[2]+' '+words[3]]
				}
			    for (var i = 0; i < words.length; i++) {
			        var tspan = el.append('tspan').text(words[i]);
			        if (i > 0)
			            tspan.attr('x', 0).attr('dy', '1.2em');
			    };
			});

 		};

 		
		this.node
			.transition().duration(1000)
		  .attr("transform", function(d) { 
		    return "translate(" + d.get('x') + "," + d.get('y') + ")"; }) 			

		this.dots.preloadNodeInfo("C0029445"); 

		this.showText();
	},

	rerender: function(){ // run when the btn clicked
		if (this.activeTable === 0) {
			this.dots.dbTable = this.dbTables[1];
			this.activeTable = 1;	
		} else {
			this.dots.dbTable = this.dbTables[0];
			this.activeTable = 0;
		}
		this.dots.fetch();
	},

	onStage:function(){
		var putOn = this.el;
		d3.select('#stage').style('opacity',0);
		d3.select('#stage').append(function(){ return putOn;});
		d3.select('#stage').transition().delay(150).style('opacity',1);
		this.isOnStage = true;
	},

 	offStage:function(){
 		d3.select('#stage').transition().style('opacity',0);
 		d3.select(this.el).remove();
 		d3.select('#stage').style('opacity',1);
 		this.isOnStage = false;
 	},	

 	showText: function(){
		this.trueScale = d3.transform(this.svg.attr('transform')).scale[0];
		if(this.trueScale>this.textShowThres){
			d3.selectAll('.display-none').attr('display', 'default');
		} else {
			d3.selectAll('.display-none').attr('display', 'none');	
		};
 	},


 	zoomTransform: function(){
		var thres = this.textShowThres;

		this.showText();

		if(d3.event.scale>=thres&&this.currentScale<thres){
			this.currentScale = d3.event.scale;
			this.trigger('zoomOutEnabled');
		};

		if(d3.event.scale<=thres&&this.currentScale>thres){
			this.currentScale = d3.event.scale;
		};

		if(d3.event.scale !== 1){
			this.trigger('zoomOutEnabled');
		} else {
			this.trigger('zoomoutDisabled');
		}

		var t = this.zoom.translate();
		this.zoomTranslate = this.zoom.translate();

		var maxx = d3.max(this.x.range()) + 300;
		var maxy = d3.max(this.y.range()) + 300;

		var tx = Math.max( Math.min(300, t[0]), this.stageWidth - maxx * this.zoom.scale() );
		var ty = Math.max( Math.min(300, t[1]), this.stageWidth - maxy * this.zoom.scale() );

		// no limit for panning
		// var tx = this.zoomTranslate[0];
		// var ty = this.zoomTranslate[1];

		this.svg.attr("transform","translate(" + tx + "," + ty
			+ ")scale(" + d3.event.scale + ")"); 		
 	},

	centerDot: function(event){
 		// center and highlight searched dot
 		var self = this;
 		this.svg.selectAll('g')
			.filter(function(d){ return d.get('label').toLowerCase()
											.search(event.term)>-1;})
			.each(function(d){
				var D = [d.get('x'), d.get('y'), d.get('r')];
				self.dots.preloadNodeInfo(d.get('id'));

				d3.select('g')
					.attr('transform', function(){
						self.currentScale = 1
						self.zoomTranslate = [0, 0]
						return null
					})
					.transition().duration(250).delay(250)
					.attr('transform', function(){
	        	    	var tx = self.stageWidth/2 - D[0]
	        	    	var ty = (self.stageWidth/2 - D[1]) * 0.7
	        	    	self.zoomTranslate = [tx, ty]
						return "translate("+ tx + "," + ty + ")scale(" + self.currentScale + ")"
					})

			if (self.currentScale < 3.9) {
				var zoomFactor = 4.0/self.currentScale;
				self.zoomByFactor(zoomFactor)
			};
		}).classed('highlight', true);
	},

	zoomByFactor: function(factor){ // for zooming svg after button click
		var scale = this.currentScale;
		// var extent = this.zoom.scaleExtent();
		var extent = [1, this.maxScale];
		var newScale = scale * factor;
		if (extent[0] <= newScale && newScale <= extent[1]) {
			var t = this.zoomTranslate;
			var c = [this.stageWidth / 2, this.stageHeight / 2];
			this.zoom
			.scale(newScale)
			.translate(
			[c[0] + (t[0] - c[0]) / scale * newScale, 
			c[1] + (t[1] - c[1]) / scale * newScale])
			.event(this.svg.transition().duration(350));
			this.currentScale = newScale;
		}
	},

	highlightCategory: function(color){
		// highlight dots of a certain category
		var self = this;
		this.svg.selectAll('g')
				.filter(function(d){ 
					return d.get('color') === color; 
				}).classed('highlight', true);
	},

	removeHighlighted: function(){
		var self = this;
		this.svg.selectAll('.highlight').classed('highlight', false);
	},	
});


var SearchModel = Backbone.Model.extend({
	defaults:{
		autoCompleteList: [],
		currentVal: null,
	},
});

// extend autocomplete UI to tweak functions that are not an attribute.
$.widget("q.customAutocomplete",$.ui.autocomplete,{
	_renderMenu: function( ul, items ) {
  			var that = this;
  			ul.addClass("custom-autocomplete-ul")
  			that._renderItemData(ul,{value:"All",label:"All"});
  			$.each( items, function( index, item ) {
    			that._renderItemData( ul, item );
  				});
			},
});

var SearchView = Backbone.View.extend({

	initialize: function(){
		this.$el = $('#searchBox');
		this.width = this.$el.parent().width();
		this.$el.width(this.width - 4);
		this.minLength = 3;
		this.listenTo(this.model,'change:autoCompleteList',this.updateList);
		this.allTerm = '';

		//custom autocomplete UI event handler.
		var self = this;
		this.$el.customAutocomplete({
			source: this.model.get('autoCompleteList'),
			minLength: this.minLength,
			select: function(event,ui){
		      // very nice function. prevent updating input with selected value
		      //right after selection
				event.preventDefault();
				var selectedTerm;
				var highlightOptions;
				if(ui.item.value=="All"){
					selectedTerm = self.allTerm;
					highlightOptions = self.currentOptions;
				}
				else{
					 selectedTerm = ui.item.value;
					 //if not All, update input with selection. 
					 self.$el.val(selectedTerm);
					 highlightOptions = [selectedTerm];
				}

				self.trigger("searchTermSelected",
								{term:selectedTerm.toLowerCase(),
								 autoCompleteOptions:highlightOptions});
			},

			open: function(event,ui){
				self.allTerm = self.$el.val();
			},

			response: function(event,ui){
				self.currentOptions = _.map(ui.content,function(option){
					return option.label;
				});
			},
		});
	},

	updateList: function(){
		this.$el.customAutocomplete({
			source: this.model.get('autoCompleteList'),
		});
	},
});


var BaseBtn = Backbone.View.extend({ // a base class for btn
	defaults: {
		el: "#",
		eventName: 'thisBtnClicked'
	},

	initialize: function(options){
		//initialize with defaults and passed arguments.
		_.defaults(options,this.defaults);
		_.defaults(this,options);
		var self = this;
		$(this.el).on('click', function(){
			self.trigger(self.eventName);
		});
	},

	disable: function(){
		d3.select(this.el).attr('disabled', true);
	},

	enable: function(){
		d3.select(this.el).attr('disabled', null);
	}
});

var ChangeDataBtn = BaseBtn.extend({
	defaults: {
		text0: "Cluster by drug similarity",
		text1: "Cluster by side effect category"
	},

	initialize: function(options){
		BaseBtn.prototype.initialize.apply(this, [options])
		$(this.el).text(this.text0);
		var self = this;
		$(this.el).click(function(){
			$(this).text(function(i, v){
				return v === self.text1 ? self.text0 : self.text1;
            });
		});
	},
})


// Non-modular functions

// Returns a flattened hierarchy containing all leaf nodes under the root.
function classes(root) {
  var classes = [];
  function recurse(name, node) {
    if (node.children) node.children.forEach(function(child) { recurse(node.label, child); });
    else classes.push({id: node.id, name: name, label: node.label, value: node.size, color: node.color});
  }
  recurse(null, root);
  return {children: classes};
};

updateNodeInfo = function(nodeInfoSelector, model, info){
	// only update the table part of the DOM created by displayNodeInfo
	d3.select(nodeInfoSelector + ' tbody').remove();
	var table = d3.select(nodeInfoSelector + ' table');
	var tbody = table.append('tbody');
	// sort genes based on p-values 
	sortedGenePval = _.sortBy(info, function(o) { return -o.p_val });
	// use d3 to bind data
	var trs = tbody.selectAll('tr').data(sortedGenePval)
		.enter()
		.append('tr')
	var tdDrug = trs.append('td')
		.append('a')
		.text(function(d){
			if (d.sider === 'yes') {
				return [d.name + '*'];	
			} else {
				return [d.name];
			}
		})
		.attr('title', function(d){return 'more info about '+d.name;})
		.attr('href', function(d){return '#drug/'+d.pert_id});

	trs.append('td')
		.text(function(d){ return d.pert_id;} );
	var fmt = d3.format(".2f")
	trs.append('td')
		.text(function(d){return fmt(d.p_val)} ) // pval

	$("#filterAnchor").text(function(i, v){
		if (v === 'show') {
			d3.select(this).on('click', function(){
				model.updateInfo(true, 100); // to filter
			});
			return 'filter';
		} else{
			d3.select(this).on('click', function(){
				model.updateInfo(null, 100); // not to filter
			})
			return 'show';
		};
	});

};

displayNodeInfo = function(nodeInfoSelector, model, info) { 
	// control the open and close the the panel-body
	var panelBodyDisplay = $(".panel-body").css('display');
	if (panelBodyDisplay === 'none') { // panel closed 
		$(".panel-body").slideToggle(200);	
	} else{ // panel opened
		$(".panel-body").slideToggle(200, function(){
			$(this).slideToggle(200);
		});		
	};

	d3.select(nodeInfoSelector + ' div').remove();
	d3.select(nodeInfoSelector + ' span').remove();
	d3.select(nodeInfoSelector)
		.append("div")
		.style("height", '800px')
		.style("overflow", "auto")
	var div = d3.select(nodeInfoSelector + ' div'); // the container to put node info
	div.append("span")
		.text("Side effect: ")
		.append("a")
		.text(model.get('label'))
		.attr('href', '#se/'+model.get('id'))
		.attr('target', '_blank');
	div.append('br');
	var span = div.append("span")
		.text("* Already known to cause side effect (")
	span.append("a").text('filter') // to filter out known drugs
		.attr('id', 'filterAnchor')
		.attr('href', '##')
		.on('click', function(){
			model.updateInfo(true, 100);
		});
	span.append("span").text(")");

	var table = div.append('table')
		.attr('class', 'table table-hover table-striped table-condensed')
	var th = table.append('thead').append('tr');
	th.append('td').text('Drugs');
	th.append('td').text('Broad ID');
	th.append('td').text('probability ')
		.append('span')
		.append('a')
			.attr('href', '#methods')
			.attr('class', 'glyphicon glyphicon-info-sign')
			.attr('title', 'probability of the drug causing the side effect generated by the classifier')
			.attr('data-toggle', 'tooltip')
			.attr('data-placement', 'right');

	var tbody = table.append('tbody')

	// sort genes based on p-values 
	sortedGenePval = _.sortBy(info, function(o) { return -o.p_val });
	// use d3 to bind data
	var trs = tbody.selectAll('tr').data(sortedGenePval)
		.enter()
		.append('tr')
	var tdDrug = trs.append('td')
		.append('a')
		.text(function(d){
			if (d.sider === 'yes') {
				return [d.name + '*'];	
			} else {
				return [d.name];
			}
		})
		.attr('title', function(d){return 'more info about '+d.name;})
		.attr('href', function(d){return '#drug/'+d.pert_id});

	trs.append('td')
		.text(function(d){ return d.pert_id;} );
	var fmt = d3.format(".2f")
	trs.append('td')
		.text(function(d){return fmt(d.p_val)} ) // pval

	div.append("span").append("a")
		.text("See more")
		.attr("href", '#se/'+model.get('id'))
		.attr('target', '_blank');

	$('[data-toggle="tooltip"]').tooltip();	
};

// init instances
var searchModel = new SearchModel;
var searchView = new SearchView({model:searchModel});

var stageWidth = $('#stage').parent().width();

var graphView = new DiGraphView({dbTables:['side_effects_digraph_soc_with_known.json', 'side_effects_digraph_with_known.json'], stageWidth: stageWidth});
graphView.onStage();

searchModel.listenTo(graphView.dots,'autoCompleteListGot',function(){
	this.set("autoCompleteList",graphView.dots.autoCompleteList);
});

graphView.listenTo(searchView,"searchTermSelected",graphView.centerDot);

// change the underlying network
// var changeDataBtn = new BaseBtn({el:"#changeData", eventName:"changeDataBtnClicked"});
var changeDataBtn = new ChangeDataBtn({el:"#changeData", eventName:"changeDataBtnClicked"});
graphView.listenTo(changeDataBtn,'changeDataBtnClicked', graphView.rerender);

// zooming buttons
var zoomInBtn = new BaseBtn({el: "#zoom_in", eventName: "zoomInClicked"});
var zoomOutBtn = new BaseBtn({el: "#zoom_out", eventName: "zoomOutClicked"});

graphView.listenTo(zoomInBtn, 'zoomInClicked', function(){
	this.zoomByFactor(1.2);
});

graphView.listenTo(zoomOutBtn, 'zoomOutClicked', function(){
	this.zoomByFactor(0.9);
});

zoomOutBtn.listenTo(graphView, 'zoomOutEnabled', zoomOutBtn.enable);
zoomOutBtn.listenTo(graphView, 'zoomoutDisabled', zoomOutBtn.disable);


// display legend, click legend to highlight side effects of the category
$.getJSON('get_legend.php', {type: 'side_effect_network.json'}, function(json) {
	for (var i = json.length - 1; i >= 0; i--) {
		var name = json[i].name;
		var color = "#" + json[i].color;

		var a = d3.select("#colorLegend").append('small').append('a')
			.datum([name, color])
			.attr('href', '#')
			.style('background-color', color).style('color', 'black').text(name);

		a.on('click', function(d) {
			graphView.removeHighlighted();
			graphView.highlightCategory(d[1]);
		});

		d3.select("#colorLegend").append('small').text(' | ');
	};

});

