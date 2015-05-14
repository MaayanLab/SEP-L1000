
$('#selectionPanel').tooltip({
	items: "[pathways]",
	content: function(){
		var element = $(this);
		cc = element;
		if( element.is("[pathways]")){
			return element.attr('pathways');
		}
	},
	hide:{
		delay: 5,
	},
	tooltipClass:"custom-ui-tooltip",
	// position:{
	// 	my:"left bottom",
	// }
});


var x;
var SelectionPanel = Backbone.View.extend({

	initialize: function(){
		this.$el = $("#selectionPanel");
	},

	addBar:function(event){
		// event is an object with "term" key, "autoCompleteOptions" key and
		// "highlights" key triggered in highlightSearchTerm function in 
		// appPathway
		var selectionBar = new SelectionBar(event);
		this.$el.append(selectionBar.$el);
		this.trigger('selectionBarAppended',selectionBar);
		x = selectionBar;

	},

	removeBar:function(event){
		this.$el.remove()
	}

});


var SelectionBar = Backbone.View.extend({

	events:{
		"click div.destroy" : "destroy",
	},

	initialize:function(options){
		// The options here passed parameter object
		this.term = options.term;
		options.trimmedTerm = this.trimTerm(options.term);
		this.$el = $(_.template($('#selectionBar-template').html(),options));
		this.el = this.$el[0];
		this.highlights = options.highlights;
		
	},

	destroy:function(){
		console.log(this.highlights);
		_.each(this.highlights,function(highlight){
			highlight.remove();
		});

		this.$el.remove();
	},

	trimTerm: function(term){
		if(term.length>22)
			return term.slice(0,20) + '...';
		else
			return term;
	},

	absolutePosition:function(){
		//reference webpage:
		//http://www.quirksmode.org/js/findpos.html

		//This function is for colorpick coordinates.

		var obj = this.el;
		var curleft = curtop = 0;
		if (obj.offsetParent) {
			do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
			} while (obj = obj.offsetParent);
		return [curleft,curtop,this.$el.height()];
		}
	},

});




// //test script !!!!!!
// var test = new Test({term:'xx',autoCompleteOptions:['a','b','c']});
// $('body').append(test.$el);

// var Test2 = Backbone.View.extend({
// 	id:'ff',
// 	events:{
// 		"click" : "destroy",
// 	},

// 	initialize:function(){
		
// 		this.$el.text('height');
// 	},

// 	destroy:function(){
// 		console.log('haha');
// 		console.log(this);
// 	},
// });
// var test2 = new Test2;
// $('body').append(test2.$el);

// $