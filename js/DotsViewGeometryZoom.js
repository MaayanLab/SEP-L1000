var DotsViewGeometryZoom = DotsView.extend({

	afterFetchInitialize: function(){

 		this.stageHeight = this.dots.transformRange(this.stageWidth,
 			this.paddingWidth, this.sizeScale);

 		this.zoomTransform = _.bind(this.zoomTransform,this);

 		this.zoom_g = d3.select(this.el)
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

 		this.zoom_g.attr("transform","translate(" + 
 			d3.event.translate + ")scale(" + d3.event.scale + ")");
 	},

 	highlightSearchTerm:function(event){
 		console.log(event.term);
 		var self = this;
 		this.zoom_g.selectAll('g')
 				   .filter(function(d){ return d[3]==event.term;})
 				   .call(function(selection){
 							var D = selection.datum();
 							var currentTransform = selection.attr('transform');
 							var size = D[2] > 12 ? D[2]+1:12;
 							self.zoom_g.append('g')
 											.datum([D[0],D[1]])
 											.attr('transform',currentTransform)
 											.append('rect')
 											.attr('transform',
 						'translate(' + (-size/2) + "," + (-size/2) +')')
 											.attr('width',size)
 											.attr('height',size)
 											.attr('class','highlight');
 											
 						});
 	},
});