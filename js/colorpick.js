
//jscolor.color is customized at lines 377-379,582,583,586

// var colorPicker = new jscolor.color(document.getElementById('colorPickerInput'), {});

var ColorPicker = Backbone.View.extend({

	events:{
		"change" : "updateColor",
	},

	initialize: function(){
		this.$el = $('#colorPickerInput');
		this.el = this.$el[0];
		this.picker = new jscolor.color(this.el, {});
		this.currentSelectionBar = null;
	},

	updateColor:function(){
		var color = '#' + this.$el.val();
		this.currentSelectionBar.$el.css('background-color',color);
		_.each(this.currentSelectionBar.highlights,function(highlight){
			highlight.style('stroke',color);
		}); 
	},

	showPicker:function(event){
		this.currentSelectionBar = event;
		var self = this;
		this.picker.showPicker(this.currentSelectionBar.$el[0]);
		var pickerLeft = parseFloat( $('#pickerBox').css('left') );
		var pickerTop = parseFloat($('#pickerBox').css('top'));
		var okLeft = 187.5;
		var okTop = 121;
		$('#colorPickerButton').css('display','block')
							   .css('left',okLeft+pickerLeft)
							   .css('top',okTop+pickerTop)
							   .click(function(){
							   		self.picker.hidePicker();
							   		$(this).css('display','none');
							   		this.currentSelectionBar = null;
							   });
	},

});

