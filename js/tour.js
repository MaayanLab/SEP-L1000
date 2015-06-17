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
            '<p>Side effect can be searched by name</p>',
            '<p>For example, type "Neuropathy peripheral"</p>',
            '<p>Once searched, the dot representing the side effect will be centered. </p>'
        ].join(''),
        highlightTarget: true,
        nextButton: true,
        closeButton: true,
        target: $('#searchBox'),
        my: 'top center',
        at: 'bottom center'
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
        at: 'top center'
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
        at: 'top center'    	
    },
    {
    	content: [
    		'<h5>Side effect visualization canvas</h5>',
    		'<p>You can also explore side effects by zooming and panning in this canvas. And display the information of side effects by clicking them.</p>'
    	].join(''),
        highlightTarget: true,
        nextButton: true,
        closeButton: true,
        target: $('#stage'),
        my: 'bottom center',
        at: 'top center'    	    	
    }
    ];

    var tour = new Tourist.Tour({
        steps: steps,
        tipClass: 'Bootstrap',
        tipOptions:{ showEffect: 'slidein' },
    });
    tour.start();
}

$(document).ready(function() {
    $("#tour").click(function(){
        window.setTimeout(initTour, 500);
        // $(".icon-remove").removeClass("icon icon-remove").addClass("glyphicon glyphicon-remove")
    })
})