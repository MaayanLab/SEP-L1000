var removeActive = function(){
	$("ul.navbar-nav").children().each(function() {
		$(this).removeClass('active');
	});	
};

var Router = Backbone.Router.extend({
	
	el: "#page-content", // selector to load page content

	routes: {
		'': 'home',
		'browseDrugs': 'browseDrugs',
		'browseSEs': 'browseSEs',
		'methods': 'methods',
		'links': 'links',
		'contact': 'contact',
		'drug/:id': 'drug',
		'se/:id': 'se',
		'search/:searchStr': 'search'
	},

	home: function(){
		$(this.el).load("home.html", function() {
			removeActive();
			$("#home").addClass("active");
		});
	},

	browseDrugs: function(){
		$(this.el).load("browse_drug.html", function() {
			removeActive();
			$("#browse").addClass('active');
		});
	},

	browseSEs: function(){
		$(this.el).load("browse_se.html", function() {
			removeActive();
			$("#browse").addClass('active');
		});
	},

	links: function(){
		$(this.el).load("links.html", function() {
			removeActive();
			$("#links").addClass('active');
		});
	},

	contact: function(){
		$(this.el).load("contact.html", function() {
			removeActive();
			$("#contact").addClass('active');
		});
	},

	drug: function(id){
		$(this.el).load("drug_profile.html", function() {
			removeActive();
			$("#browse").addClass('active');			
		});
	},

	se: function(id){
		$(this.el).load("se_profile.html", function() {
			removeActive();
			$("#browse").addClass('active');			
		});
	},

	search: function(searchStr){
		$(this.el).load("search.html", function() {
		});
	}

});

var appRouter = new Router();
Backbone.history.start(); 


