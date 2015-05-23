var Router = Backbone.Router.extend({
	
	el: "#page-content", // selector to load page content

	routes: {
		'': 'home',
		'browseDrugs': 'browseDrugs',
		'browseSEs': 'browseSEs',
		'methods': 'methods',
		'links': 'links',
		'contact': 'contact'
	},

	home: function(){
		$(this.el).load("home.html", function() {
			$("#home").addClass("active");
		});
	},

	browseDrugs: function(){
		$(this.el).load("browse_drug.html", function() {
			$("#browse").addClass('active');
		});
	},

	browseSEs: function(){
		$(this.el).load("browse_se.html", function() {
			$("#browse").addClass('active');
		});
	},

	links: function(){
		$(this.el).load("links.html", function() {
			$("#links").addClass('active');
		});
	},

	contact: function(){
		$(this.el).load("contact.html", function() {
			$("#contact").addClass('active');
		});
	}

});

var appRouter = new Router();
Backbone.history.start(); 


