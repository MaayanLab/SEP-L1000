function initTour() {
    var steps = [
    {
        content: [
        	'<h5>The color legend</h5>',
            '<p>Side effects are colored by their System Organ Class in MedDRA </p>',
            '<p>Click a legend to highlight all the corresponding side effects that belong to a class of side effects.</p>'
        ].join(''),
        highlightTarget: true,
        nextButton: true,
        closeButton: true,
        target: $('#colorLegend'),
        my: 'top left',
        at: 'bottom center',
    }, 
    {
        content: [
            '<p>Side effects in the bubble chart can be searched by name</p>',
            '<p>For example, type "Hepatitis"</p>',
            '<p>Once searched, the dot representing the side effect will be centered. </p>'
        ].join(''),
        highlightTarget: true,
        nextButton: false,
        closeButton: true,
        target: $('#searchBox'),
        my: 'top center',
        at: 'bottom center',
        // only allow to continue after user typed a term
        setup: function(tour, options){
            options.searchView.bind('searchTermSelected', this.myEvent);
        },
        bind: ['myEvent'],
        teardown: function(tour, options){
            options.searchView.unbind('searchTermSelected', this.myEvent)
        },
        myEvent: function(tour, options, view){
            tour.next();
        }
    },
    {
    	content: [
    		'<h5>Side effect information panel</h5>',
    		'<p>Drugs that are known/predicted to cause the selected side effect is displayed here.</p>',
    		'<p>This panel can also be dragged around and minmized</p>'
    	].join(''),
        highlightTarget: true,
        nextButton: true,
        closeButton: true,
        target: $('#sidebar-wrapper'),
        my: 'bottom center',
        at: 'top center',
        setup: function(){
            $(".panel-body").slideDown(250);
        }
    },
    {
    	content: [
    		'<p>Drugs and side effects are hyperlinked to their profile page for more information</p>'
    	].join(''),
        highlightTarget: true,
        nextButton: true,
        closeButton: true,
        target: $('#nodeInfo'),
        my: 'bottom center',
        at: 'top center',
        setup: function(){
            $(".panel-body").slideDown(250);
        }        
    },
    {
    	content: [
    		'<h5>Side effect bubble chart</h5>',
    		'<p>You can also explore side effects by zooming and panning in this bubble chart. And display the information of side effects by clicking them.</p>'
    	].join(''),
        highlightTarget: true,
        nextButton: false,
        closeButton: true,
        target: $('#stage'),
        my: 'bottom center',
        at: 'top center', 
        setup: function(tour, options){
            options.graphView.bind('dotClicked', this.myEvent);
        },
        bind: ['myEvent'],
        teardown: function(tour, options){
            options.graphView.unbind('dotClicked', this.myEvent)
        },
        myEvent: function(tour, options, view){
            tour.next();
        }
    },
    {
        content: [
            '<p>Drug and side effect profiles that are available on the site can be searched using this search box. </p>',
            '<p>For example, search "ibuprofen", or "Hepatitis".</p>'
        ].join(''),
        highlightTarget: true,
        nextButton: true,
        closeButton: true,
        target: $('.form-group'),
        my: 'top center',
        at: 'bottom center'
    }
    ];

    tour = new Tourist.Tour({
        steps: steps,
        tipClass: 'Bootstrap',
        tipOptions:{ showEffect: 'slidein' },
        stepOptions: {
            searchView: searchView,
            graphView: graphView,
        }
    });
    tour.start();
}

$(document).ready(function() {
    $("#tour").click(function(){
        window.setTimeout(initTour, 500);
        // $(".icon-remove").removeClass("icon icon-remove").addClass("glyphicon glyphicon-remove")
    })
})