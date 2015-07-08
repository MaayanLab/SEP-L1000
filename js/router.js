var removeActive = function(){
	$("ul.navbar-nav").children().each(function() {
		$(this).removeClass('active');
	});	
};

var hideTour = function(){ // to hide 
	$('.tourist-popover').css('display', 'none');
};

var Router = Backbone.Router.extend({
	
	el: "#page-content", // selector to load page content

	routes: {
		'': 'home',
		'browseDrugs': 'browseDrugs',
		'browseSEs': 'browseSEs',
		'methods': 'methods',
		'links': 'links',
		'drug/:id': 'drug',
		'se/:id': 'se',
		'search/:searchStr': 'search',
		'network/:name': 'network'
	},

	home: function(){
		$(this.el).load("home.html", function() {
			removeActive();
			$("#home").addClass("active");
		});
	},

	browseDrugs: function(){
		$(this.el).load("browse_drug.html", function() {
			hideTour();
			removeActive();
			$("#browse").addClass('active');

		});
	},

	browseSEs: function(){
		$(this.el).load("browse_se.html", function() {
			hideTour();
			removeActive();
			$("#browse").addClass('active');
		});
	},

	methods: function(){
		$(this.el).load("method.html", function() {
			hideTour();
			removeActive();
			$("#methods").addClass('active');
		});
	},

	links: function(){
		$(this.el).load("links.html", function() {
			hideTour();
			removeActive();
			$("#links").addClass('active');
		});
	},

	drug: function(id){
		$(this.el).load("drug_profile.html", function() {
			hideTour();
			removeActive();
			$("#browse").addClass('active');			
		});
	},

	se: function(id){
		$(this.el).load("se_profile.html", function() {
			hideTour();
			removeActive();
			$("#browse").addClass('active');			
		});
	},

	search: function(searchStr){
		hideTour();
		$(this.el).load("search.html", function() {
		});
	},

	network: function(name){
		if (name === 'GO'){
			window.jsonFileName = 'data/GO_ADR_network.json';	
		}
		if (name === 'phenotype') {
			window.jsonFileName = 'data/pheno_ADR_network.json'
		}
		
		$(this.el).load("network.html", function() {
			hideTour();
			removeActive();
			$("#network").addClass('active');	
		});
	},

});

var appRouter = new Router();
Backbone.history.start(); 


