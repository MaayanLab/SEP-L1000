


var Dot = Backbone.Model.extend({
// x, y will only be set in the instance
	defaults:{
		"size": 10,
		"color": "white"
		// "info": null
	},

	// parse numeric string attributes to numbers
	parse: function(response){
		response.color = '#' + response.color;
		response.size = parseFloat(response.size);
		response.x = parseFloat(response.x);
		response.y = parseFloat(response.y);
		return response;
	}, 

	// send a GET request to the API to get infomation about the Dot
	getInfo : function(){
		var self = this;
		$.getJSON('get_se_drug.php', {umls_id: this.id, probability: 0.7, filter: true}, function(json) {
			displayNodeInfo("#nodeInfo", self, json)
		});
	}
});


var Dots = Backbone.Collection.extend({

	model:Dot,
	url: function(){
		// return "http://127.0.0.1/scatter/" + this.dbTable;
		return 'data/' + this.dbTable;
	},

	initialize: function(models,options){
		this.dbTable = options.dbTable;
		this.on("sync",this.getAutoCompleteList);

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

	getAutoCompleteList:function(){
		this.autoCompleteList = _.uniq( this.map(function(dot){
			return dot.get('label')}) );
		this.trigger("autoCompleteListGot");
	},
});



// view part begins
var DotView = Backbone.View.extend({

	tagName: 'g',


	initialize: function(){
		//override view's el property
		this.el = document.createElementNS("http://www.w3.org/2000/svg", 
			this.tagName);
		this.listenTo(this.model, 'change', this.render);
	},

	render: function(){
		var g = d3.select(this.el).datum([this.model.get('x'), 
		this.model.get('y'),this.model.get('size'),this.model.get('label')])
						  .attr('transform',function(d){ return 'translate(' +
						  	d[0] + "," + d[1] + ")";})
						  .attr('name','zoomable');
						  
		g.append('svg:circle')
		 .datum([this.model.get('size')])
		 .attr('r', function(d){ return d[0];})
		 .attr('fill',this.model.get('color'))
		 .append('title')
		 .text(this.model.get('label'));

	  g.append('svg:text').attr('fill','white')
	  					  .attr('text-anchor','middle')
	  					  //.attr('y',-1*this.model.get('size'))
	  					  .style('font-size',this.model.get('size')/3.5)
	  					  .text(this.model.get('label'))
	  					  .attr('display','none');
		
	  	var self = this; // to access the model inside the click callback
		g.on('click', function(event) {
			self.model.getInfo();			
		});

		return this;
	},

});



var DotsView = Backbone.View.extend({
 	

 	tagName: "svg",

 	defaults: {	
 		isOnStage: false,
 		stageWidth: 600,
 		paddingWidth: 10,
 		sizeScale: 0.4, // control the size of node.
 		textShowThres: 2,
 		maxScale: 8,
 		scaleExponent: 1,
 	},


 	initialize: function(options){

 		//initialize with defaults and passed arguments.
 		_.defaults(options,this.defaults);
 		_.defaults(this,options);

 		//override view's el property
 		this.el = document.createElementNS("http://www.w3.org/2000/svg", 
 			this.tagName);
 		this.dots = new Dots([],{dbTable:this.dbTable});
 		this.listenTo(this.dots, 'sync', this.afterFetchInitialize);
 		// call back
 		this.dots.fetch();

 	},



 	afterFetchInitialize: function(){

 		this.stageHeight = this.dots.transformRange(this.stageWidth,
 			this.paddingWidth, this.sizeScale);

		
		this.x = d3.scale.pow().exponent(this.scaleExponent)
								.domain([0,this.stageWidth])
 								.range([0,this.stageWidth]);

 		this.y = d3.scale.pow().exponent(this.scaleExponent)
 								.domain([0,this.stageHeight])
 								.range([0,this.stageHeight]);

 		//overide d3js "this" context with "this" context of View
		this.zoomTransform = _.bind(this.zoomTransform,this);
		this.circleTransform = _.bind(this.circleTransform,this);

 		this.svg = d3.select(this.el)
 						.attr('width',this.stageWidth)
 						.attr('height',this.stageHeight)
 						.attr('class','svgBorder')
 						.call(d3.behavior.zoom().x(this.x).y(this.y)
 			.scaleExtent([1, this.maxScale]).on("zoom", this.zoomTransform));

 		this.currentScale = 1;	
 		//append overlay
 		// this.svg.append("rect").attr("class","overlay")
 		// 					.attr("width",this.stageWidth)
 		// 					.attr("height",this.stageHeight);
 		this.addAll();
 		this.zoomables = this.svg.selectAll('[name=zoomable]');
 		this.texts = this.svg.selectAll('text');


 	},

 	// reRender:function(){
 	// 	//not test function
 	// 	this.stageHeight = this.dots.transformRange(this.stageWidth,
 	// 		this.paddingWidth);

		
		// this.x = d3.scale.linear().domain([0,this.stageWidth])
 	// 							  .range([0,this.stageWidth]);

 	// 	this.y = d3.scale.linear().domain([0,this.stageHeight])
 	// 							  .range([0,this.stageHeight]);
 		
 	// 	this.svg.attr('width',this.stageWidth)
 	// 			.attr('height',this.stageHeight)
 	// 			.select('rect')
 	// 			.attr("width",this.stageWidth)
 	// 			.attr("height",this.stageHeight);

 	// },

 	onStage:function(){
 		var putOn = this.el;
 		//selection.append takes as argument either a tag name of constant 
 		//string or as a function that returns the DOM element to append. 
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

 	addOne: function(dot){
 		var oneDotView = new DotView({model: dot});
 		this.svg.append(function(){ return oneDotView.render().el;});
 	},

 	addAll: function(){
 		this.dots.each(this.addOne,this);
 	},

 	circleTransform: function(d){
 		return "translate(" + this.x(d[0]) + "," + this.y(d[1]) + ")";
 	},

 	zoomTransform: function(){
 		
 		var thres = this.textShowThres;
 		if(d3.event.scale>=thres&&this.currentScale<thres){
 			this.texts.attr('display','default');
 			this.currentScale = d3.event.scale;
 		};

 		if(d3.event.scale<=thres&&this.currentScale>thres){
 			this.texts.attr('display','none');
 			this.currentScale = d3.event.scale;
 		};

 		this.zoomables.attr("transform",this.circleTransform);
 	},

 	highlightSearchTerm:function(event){
 		// console.log(event.term);
 		d3.selectAll('g').filter(function(d){ return d[3]==event.term;})
 						.call(function(selection){
 							var D = selection.datum();
 							var currentTransform = selection.attr('transform');
 							var size = D[2] > 12 ? D[2]+1:12;
 							d3.select('svg').append('g')
 											.datum([D[0],D[1]])
 											.attr('name','zoomable')
 											.attr('transform',currentTransform)
 											.append('rect')
 											.attr('transform',
 						'translate(' + (-size/2) + "," + (-size/2) +')')
 											.attr('width',size)
 											.attr('height',size)
 											.attr('class','highlight');
 											
 						});
 											
 		this.zoomables = d3.selectAll('[name=zoomable]');
 	},

});


var DotsViewGeometryZoom = DotsView.extend({

	afterFetchInitialize: function(){

 		this.stageHeight = this.dots.transformRange(this.stageWidth,
 			this.paddingWidth, this.sizeScale);

 		this.zoomTransform = _.bind(this.zoomTransform,this);

 		this.svg = d3.select(this.el)
 						.attr('width',this.stageWidth)
 						.attr('height',this.stageHeight)
 						.attr('class','svgBorder')
 						.call(d3.behavior.zoom()
 			.scaleExtent([1, this.maxScale]).on("zoom", this.zoomTransform))
 						.append('g');

 		this.currentScale = 1;	
 		this.addAll();
 		this.texts = this.svg.selectAll('text');
 	},

 	zoomTransform: function(){
 		
 		var thres = this.textShowThres;
 		if(d3.event.scale>=thres&&this.currentScale<thres){
 			this.texts.attr('display','default');
 			this.currentScale = d3.event.scale;
 		};

 		if(d3.event.scale<=thres&&this.currentScale>thres){
 			this.texts.attr('display','none');
 			this.currentScale = d3.event.scale;
 		};

 		this.svg.attr("transform","translate(" + 
 			d3.event.translate + ")scale(" + d3.event.scale + ")");
 	},

 	highlightSearchTerm:function(event){
 		// console.log(event);
 		var self = this;
 		var highlights = [];
 		this.svg.selectAll('g')
 				   .filter(function(d){ return d[3].toLowerCase()
 				   									.search(event.term)>-1;})
 				   .each(function(d){
 							var D = d;
 							var size = D[2] > 12 ? D[2]+1:12;
 							var highlight = self.svg.append('rect')
 									.datum([D[0],D[1]])
 									.attr('transform',
 					'translate(' + (D[0]-size/2) + "," + (D[1]-size/2) +')')
 									.attr('width',size)
 									.attr('height',size)
 									.attr('class','highlight');
 							highlights.push(highlight);				
 						});
 		event.highlights = highlights;
 		self.trigger('highlighted',event);
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

				// console.log(selectedTerm);
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


var searchModel = new SearchModel;
var searchView = new SearchView({model:searchModel});
var appPathway = new DotsViewGeometryZoom({dbTable:"side_effect_network",maxScale:20,
		textShowThres:5,sizeScale:0.1,scaleExponent:1});

// interaction views. Only appear after certain interaction acitivities.
var selectionPanel = new SelectionPanel;
var colorPicker = new ColorPicker;

appPathway.onStage();
searchModel.listenTo(appPathway.dots,'autoCompleteListGot',function(){
	this.set("autoCompleteList",appPathway.dots.autoCompleteList);
});

// events flow: first highlight terms in Map then add corresponding bar.
appPathway.listenTo(searchView,"searchTermSelected",appPathway.highlightSearchTerm);
selectionPanel.listenTo(appPathway,"highlighted",selectionPanel.addBar);
colorPicker.listenTo(selectionPanel,"selectionBarAppended",colorPicker.showPicker);


appPathway.dots


// var app = new DotsView({dbTable:"ljp4"});
// app.onStage();

// // var appKegg = new DotsView({dbTable:"kegg"});
// var appKegg = new DotsView({dbTable:"kegg_rot"});
// var appPathway = new DotsView({dbTable:"pathway",maxScale:200,
// 		textShowThres:180,sizeScale:0.2,scaleExponent:1});

// var appPathway = new DotsView({dbTable:"pathway_squeezed",maxScale:20,
// 		textShowThres:18,sizeScale:0.2,scaleExponent:1});

// var appPathway = new DotsView({dbTable:"pathway_final",maxScale:20,
// 		textShowThres:18,sizeScale:0.1,scaleExponent:1});




//trivial initializations
downloadLink("#svgDownload","svg");

//trivial non-modulized functions
function buttonClick(){
	if(app.isOnStage){
		app.offStage();
		appKegg.onStage();
		d3.select('button').text('KEGG');
	}
	else if(appKegg.isOnStage){
		appKegg.offStage();
		appPathway.onStage();
		d3.select('button').text('pathway');
		d3.select('p').style('display','block');
	}
	else{
		appPathway.offStage();
		d3.select('p').style('display','none');
		app.onStage();
		d3.select('button').text('LJP004');
	}
}



function downloadLink(linkID,svgID){
			// Allows downloading and printing of the current canvas view
			// require d3 JavaScript library
	d3.select(linkID).on('click',function(){
		var html = d3.select(svgID).attr("xmlns", "http://www.w3.org/2000/svg")
					.node().parentNode.innerHTML;
		var newWindow=window.open("data:image/svg+xml;base64,"+ 
			btoa(html), " ", 'location=yes');
		newWindow.print();
	});  
}
		

displayNodeInfo = function(nodeInfoSelector, model, info) { 
	// take the selector of DOM to contain node info
	// must be used after `findElement()` and before `preloadNodeInfo()`
	// var findSelector = this.findSelector
	d3.select(nodeInfoSelector + ' div').remove();
	d3.select(nodeInfoSelector + ' span').remove();
	d3.select(nodeInfoSelector)
		.append("div")
		// .style("height", '1000px')
		// .style("overflow", "auto")
	var div = d3.select(nodeInfoSelector + ' div'); // the container to put node info
	div.append("span")
		.text("Side effect: ")
		.append("a")
		.text(model.get('label'))
		.attr('href', 'se_profile.html?umls_id='+model.get('id'))
		.attr('target', '_blank');
	div.append('br');
	div.append('span')
		.text('UMLS ID: ')
		.append('a')
		.text(model.get('id'))
		.attr('href', 'se_profile.html?umls_id='+model.get('id'))
		.attr('target', '_blank');
	var table = div.append('table')
		.attr('class', 'table table-hover table-striped')
	var th = table.append('thead').append('tr');
	th.append('td').attr('width', "70%").text('Drugs');
	th.append('td').attr('width', "30%").text('probability');
	var tbody = table.append('tbody')

	// sort genes based on p-values 
	sortedGenePval = _.sortBy(info, function(o) { return -o.p_val });
	// use d3 to bind data)
	var trs = tbody.selectAll('tr').data(sortedGenePval)
		.enter()
		.append('tr')
	var tdDrug = trs.append('td')
		.text(function(d){return [d.name]})
	tdDrug.append('span').text(' ')	
	tdDrug.append('a')
		.attr('class', 'glyphicon glyphicon-info-sign')
		.attr('data-toggle', 'tooltip')
		.attr('data-placement', 'top')
		.attr('title', function(d){return 'more info about '+d.name;})
		.attr('href', function(d){return 'drug_profile.html?pert_id='+d.pert_id});

	// if (findSelector !== null) { // bind find anchor to the tdDrug if findSelector is set
	// 	tdDrug.append('span').text(' ')
	// 	tdDrug.append('a')
	// 		.attr('class', 'glyphicon glyphicon-search')
	// 		.attr('data-toggle', 'tooltip')
	// 		.attr('data-placement', 'top')
	// 		.attr('title', function(d){return 'display side effects for '+genes[d[0]];})
	// 		.on('click', function(d){
	// 			canvasObj.findByGenesAndFillNode(d[0])
	// 		})
	// };
	var fmt = d3.format(".2f")
	trs.append('td')
		.text(function(d){return fmt(d.p_val)} ) // pval
};

