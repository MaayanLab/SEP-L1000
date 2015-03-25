// An object-oriented version of visualizing network generated from N2C.py script
// Author: Zichen Wang
// input: json file from N2C.py output
// json file in the format of a gmt file 
// term map between their ids and names
// gene map between their ids and names
// output: canvas

function Canvas(args) { // args should be the json file of N2C.py
	var terms = args.texts,
		weights = args.weights;

	this.names = terms, // term identifier;
	this.nodes = []; // to hold Node objects
	this.width = Math.sqrt(weights.length);
	this.canvasSize = 420;
	this.canvasRGB =  [255, 128, 0];
	this.indicatorColor = [255, 255, 255];
	this.avgWeight =  0;
	this.scaleZoom = 1;
	this.translateZoom = [0,0];
	this.infoDict = {}; // infoDict {gene: [terms], ...}
	this.infos = {}; // infos {term: [genes], ...}
	this.randomArray = [];
	this.reverseInfos = {};
	this.genes = {}; // map from gene id to gene name
	this.genesRev = {}; // map from gene name to gene id

	this.svgContainerSelector = null;
	this.nodeInfoSelector = null;
	this.findSelector = null;

	for (var i = 0; i < weights.length; i++) {
		var node = new Node(i, weights[i], terms[i]);
		this.avgWeight += weights[i] / weights.length / 8;
		this.nodes.push(node);
	};
	this.scale = Math.log(0.25)/Math.log(this.avgWeight);
};

Canvas.prototype.setCanvasSize = function(size) {
	this.canvasSize = size;
};

Canvas.prototype.setInfos = function(infoJson) {
	this.infos = infoJson;
};

Canvas.prototype.setInfoDict = function(infoJson) { // infoJson is basically the json version of gmt
	var infoDict = this.infoDict;
	for (var line in infoJson){
		elements = infoJson[line];
		for (var i = 0; i < elements.length; i++){
			if (elements[i] in infoDict){
				infoDict[elements[i]].push(line);
			} else {
				infoDict[elements[i]] = [line];
			} 
		}
	}
	this.infoDict = infoDict
};

Canvas.prototype.visualize = function(svgContainerSelector) {
	// wrapper function for visualizing the canvas
	for (var i = 0; i < this.nodes.length; i++){ // color rects based on weights
		this.nodes[i].colorize(this.scale, this.canvasRGB);
	}
	this.svgContainerSelector = svgContainerSelector;
	this.createCanvas();
	this.weightVisualize();
	d3.select(svgContainerSelector).style.display="block";
	d3.select("#mainSVG").style.display="inline";
};

Canvas.prototype.preloadNodeInfo = function() {
	var genes = this.genes;
	var nodeInfoSelector = this.nodeInfoSelector
	var findSelector = this.findSelector
	var canvasObj = this;
	var d = this.nodes[2];
	d3.select(nodeInfoSelector + ' div').remove();
	d3.select(nodeInfoSelector + ' span').remove();
	d3.select(nodeInfoSelector)
		.append("div")
		.style("height", '1000px')
		.style("overflow", "auto")
	var div = d3.select(nodeInfoSelector + ' div'); // the container to put node info
	div.append("span")
		.text("Side effect: ")
		.append("a")
		.text(d.name)
		.attr('href', 'se_profile.html?umls_id='+d.identifier)
		.attr('target', '_blank');
	div.append('br');
	div.append('span')
		.text('UMLS ID: ')
		.append('a')
		.text(d.identifier)
		.attr('href', 'se_profile.html?umls_id='+d.identifier)
		.attr('target', '_blank');
	var table = div.append('table')
		.attr('class', 'table table-hover table-striped')
	var th = table.append('thead').append('tr');
	th.append('td').attr('width', "70%").text('Drugs');
	th.append('td').attr('width', "30%").text('probability');
	var tbody = table.append('tbody').attr('id', 'preload')
	// sort genes based on p-values in d.genes[0]
	var sortedGenePval = [];
	for (var geneId in d.genes[0]) {
		sortedGenePval.push([geneId, d.genes[0][geneId]]);
	}
	sortedGenePval.sort(function(a, b) {return parseFloat(b[1]) - parseFloat(a[1])})
	var trs = tbody.selectAll('tr').data(sortedGenePval)
		.enter()
		.append('tr')
	var tdDrug = trs.append('td')
		.text(function(d){return genes[d[0]]})
	tdDrug.append('span').text(' ')
	tdDrug.append('a')
		.attr('class', 'glyphicon glyphicon-info-sign')
		.attr('data-toggle', 'tooltip')
		.attr('data-placement', 'top')
		.attr('title', function(d){return 'more info about '+genes[d[0]];})
		.attr('href', function(d){return 'drug_profile.html?pert_id='+d[0]})

	if (findSelector !== null) { // bind find anchor to the tdDrug if findSelector is set
		tdDrug.append('span').text(' ')
		tdDrug.append('a')
			.attr('class', 'glyphicon glyphicon-search')
			.attr('data-toggle', 'tooltip')
			.attr('data-placement', 'top')
			.attr('title', function(d){return 'display side effects for '+genes[d[0]];})
			.on('click', function(d){
				canvasObj.findByGenesAndFillNode(d[0])
			})
	};
	var fmt = d3.format(".2f")
	trs.append('td')
		.text(function(d){return fmt(d[1])}) // pval
};

Canvas.prototype.displayNodeInfo = function() { 
	// take the selector of DOM to contain node info
	// must be used after `findElement()` and before `preloadNodeInfo()`
	var nodeInfoSelector = this.nodeInfoSelector
	var rectSelector = this.svgContainerSelector + ' rect';
	var genes = this.genes;
	var findSelector = this.findSelector
	var canvasObj = this
	d3.selectAll(rectSelector)
		.on("mousedown", function(d){
			d3.select(nodeInfoSelector + ' div').remove();
			d3.select(nodeInfoSelector + ' span').remove();
			d3.select(nodeInfoSelector)
				.append("div")
				.style("height", '1000px')
				.style("overflow", "auto")
			var div = d3.select(nodeInfoSelector + ' div'); // the container to put node info
			div.append("span")
				.text("Side effect: ")
				.append("a")
				.text(d.name)
				.attr('href', 'se_profile.html?umls_id='+d.identifier)
				.attr('target', '_blank');
			div.append('br');
			div.append('span')
				.text('UMLS ID: ')
				.append('a')
				.text(d.identifier)
				.attr('href', 'se_profile.html?umls_id='+d.identifier)
				.attr('target', '_blank');
			var table = div.append('table')
				.attr('class', 'table table-hover table-striped')
			var th = table.append('thead').append('tr');
			th.append('td').attr('width', "70%").text('Drugs');
			th.append('td').attr('width', "30%").text('probability');
			var tbody = table.append('tbody')
			// sort genes based on p-values in d.genes[0]
			var sortedGenePval = [];
			for (var geneId in d.genes[0]) {
				sortedGenePval.push([geneId, d.genes[0][geneId]]);
			}
			sortedGenePval.sort(function(a, b) {return parseFloat(b[1]) - parseFloat(a[1])})
			// use d3 to bind data
			var trs = tbody.selectAll('tr').data(sortedGenePval)
				.enter()
				.append('tr')
			var tdDrug = trs.append('td')
				.text(function(d){return genes[d[0]]})
			tdDrug.append('span').text(' ')	
			tdDrug.append('a')
				.attr('class', 'glyphicon glyphicon-info-sign')
				.attr('data-toggle', 'tooltip')
				.attr('data-placement', 'top')
				.attr('title', function(d){return 'more info about '+genes[d[0]];})
				.attr('href', function(d){return 'drug_profile.html?pert_id='+d[0]})

			if (findSelector !== null) { // bind find anchor to the tdDrug if findSelector is set
				tdDrug.append('span').text(' ')
				tdDrug.append('a')
					.attr('class', 'glyphicon glyphicon-search')
					.attr('data-toggle', 'tooltip')
					.attr('data-placement', 'top')
					.attr('title', function(d){return 'display side effects for '+genes[d[0]];})
					.on('click', function(d){
						canvasObj.findByGenesAndFillNode(d[0])
					})
			};
			var fmt = d3.format(".2f")
			trs.append('td')
				.text(function(d){return fmt(d[1])} ) // pval
		});
};

Canvas.prototype.makeCircle = function() {
	var nodes = this.nodes,
		width = Math.sqrt(nodes.length),
		pixels = this.canvasSize / width,
		radius = Math.floor(pixels/2.5);
	var svgContainerSelector = this.svgContainerSelector;
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		if (node.circles.length !== 0) {
			circles = indicate.data(node.circles).enter().append("svg:circle");
			circles.attr("cx", (node.index % width) * pixels + pixels/2)
			.attr("cy", Math.floor(node.index / width) * pixels + pixels/2)
			.attr("fill", function(d) { return d[1];})
			.attr("opacity", function(d){ return d[3]})
			.transition()
			.duration(1000)
			.ease(Math.sqrt)
			.attr("r", function(d) {return(radius * d[2]);});
			circles.append("title").text(function(d) {return d[0]; })
		};
	};
};

Canvas.prototype.makeRect = function() {
	// Defines the square attributes. Position and color are controlled here.
	var nodes = this.nodes,
		width = Math.sqrt(nodes.length),
		pixels = this.canvasSize / width;
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		rects = rect.data([node]).enter().append("svg:rect");
		rects.attr("x", function(d){ return d.index%width * pixels;})
			.attr("y", function(d) { return Math.floor(d.index/width) * pixels;})
			.attr("width", pixels)
			.attr("height", pixels)
			.attr("fill", function(d) {return d.color});
		rects.append("title") // to display node name
			.text(function(d) { return d.name; });
	};
};

Canvas.prototype.weightVisualize = function() {
	// Removes all elements of canvas and then recreates those elements
	// Object removal prevents multiple elements from appearing when the SVG is downloaded.	
	var pixels = this.canvasSize / Math.sqrt(this.nodes.length);
	var svgContainerSelector = this.svgContainerSelector;
	var canvas = d3.select(svgContainerSelector);
	canvas.selectAll("rect").remove();
	canvas.selectAll("circle").remove();
	this.makeRect();
	this.makeCircle();
	this.displayNodeInfo();
};

Canvas.prototype.createCanvas = function() {
	var canvasSize = this.canvasSize;
	var svgContainerSelector = this.svgContainerSelector;

	canvas = d3.select(svgContainerSelector)
		.append("svg:svg")
		.attr("id","mainSVG")
		.attr("width", canvasSize)
		.attr("height", canvasSize)
		.attr("pointer-events", "all")
		.append('svg:g')
		.attr("id", "zoomLayer")
		.attr('fill', 'black')
		.attr('opacity', 0.5)
		.on('mouseover', function(){
			d3.select("#zoomLayer").attr('fill', 'none')
				.attr('opacity', 1)
			d3.select('#textOverlay').remove()
		})
		.call(d3.behavior.zoom()
			.scaleExtent([1,10])
			.on("zoom", this.redraw ))
		
		d3.select("#zoomLayer").append('svg:g')
			.attr("id","main");

		d3.select("#mainSVG").append('text')
			.attr('x',canvasSize/2)
			.attr('y',canvasSize/2)
			.attr('text-anchor', 'middle')
			.style({'fill':'white', 'font-size':'24'})
			.attr('id', 'textOverlay')
			.text('Side Effect Canvas')

	// Fill Canvas with Weights and Names
	rect = canvas.selectAll("rect");
	indicate = canvas.selectAll("circle");
};

Canvas.prototype.redraw = function() {
	// Allows panning and zooming of the canvas
	d3.select('#zoomLayer').attr("transform", "translate(" + d3.event.translate + ")"
		+ " scale(" + d3.event.scale + ")");
	this.scaleZoom = d3.event.scale;
	this.translateZoom = d3.event.translate;
};

Canvas.prototype.scaleColor = function(modWeight) {
	// Modifies the color scaling of the SVG, giving greater contrast to similarly colored elements.
	if (this.avgWeight != 1.0){
		var scale = Math.log(modWeight)/Math.log(this.avgWeight);
	};
	for (var i = 0; i < this.nodes.length; i++){
		this.nodes[i].colorize(scale, this.canvasRGB);
	};
	this.weightVisualize();	
	this.scale = scale;
};

Canvas.prototype.centerCanvas = function() {
	// Centers canvas with current attributes on click.
	this.scaleZoom = 1;
	this.translateZoom = [0,0];
	d3.selectAll("svg#mainSVG").remove();
	this.createCanvas();
	this.weightVisualize();
};


Canvas.prototype.resetColorScale = function() {
	var scale = Math.log(0.25)/Math.log(this.avgWeight);
	for (var i = 0; i < this.nodes.length; i++){
		this.nodes[i].colorize(scale, this.canvasRGB);
	};
	this.weightVisualize();
	this.scale = scale; 
};

Canvas.prototype.colorCanvas = function(color) {
	this.canvasRGB = color;
	this.resetColorScale();
}; 

Canvas.prototype.canvasOptions = function(canvasOptionSelector) {
	// wrapper for triggering all canvas option functions
	var canvasObj = this;
	var resetWeight = 0.25
	var divLeft = d3.select(canvasOptionSelector)
		.append('div')
		.attr('class', 'row text-center')
	var divMid = d3.select(canvasOptionSelector)
		.append('div')
		.attr('class', 'row text-center')
	var divRight = d3.select(canvasOptionSelector)
		.append('div')
		.attr('class', 'row text-center')

	divLeft.append('input')
		.attr('type', 'range')
		.attr('min', '0')
		.attr('max', '1')
		.attr('value', resetWeight)
		.attr('step', '.01')
		.attr('name', 'scale')
		.attr('id', 'slider')
		.on('change', function(){
			canvasObj.scaleColor(this.value)
			d3.select('em').text(this.value)
		})
	divLeft.append('p')
		.text('Color Scale: ')
		.attr('class', 'text-center')
		.append('em')
		.text(resetWeight)
	divLeft.append('button')
		.text('Reset Color Scale')
		.attr('class', 'btn btn-info')
		.attr('type', 'button')
		.on('click', function(){
			canvasObj.resetColorScale()
			document.getElementById('slider').value = resetWeight
			d3.select('em').text(resetWeight)
		})
	divMid.append('label')
		.attr('for', 'colorPicker')
		.text('Pick a different color')
	divMid.append('input')
		.attr('type', 'color')
		.attr('value', '#fff')
		.attr('id', 'colorPicker')
		.on('change', function(){
			var colorRGB = d3.rgb(this.value)
			var colorRGB = [colorRGB.r, colorRGB.g, colorRGB.b]
			canvasObj.colorCanvas(colorRGB)
		})
	divRight.append('button')
		.text('Center Canvas')
		.attr('class', 'btn btn-info')
		.attr('type', 'button')
		.on('click', function(){
			canvasObj.centerCanvas();
		});
};


function json2map(json, key, val){ // util function to convert a json file to a map
	var map = {};
	for (var i = 0; i < json.length; i++) {
		var line = json[i];
		map[line[key]] = line[val];
	};
	return map
}

Canvas.prototype.loadNodeNames = function(map) { // map {nodeId : nodeName}
	var nodes = this.nodes;
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		node.name = map[node.identifier];
		nodes[i] = node;
	};
	this.nodes = nodes;
};

Canvas.prototype.loadGenesForNodes = function(map) { // json: [{nodeId : {gene: val, ...}}]
	for (var i = 0; i < this.nodes.length; i++) {
		var node = this.nodes[i];
		node.addGene(map[node.identifier]);
		this.nodes[i] = node;
	};
};

Canvas.prototype.loadGenes = function(map, key, val) { // map: [{id: id, name: name}]
	for (var i = 0; i < map.length; i++) {
		var line = map[i];
		var	geneId = line[key];
		var	geneName = line[val];
		this.genes[geneId] = geneName;
		this.genesRev[geneName] = geneId;
	};
};

Canvas.prototype.clearCircle = function() {
	for (var i = 0; i < this.nodes.length; i++) {
		this.nodes[i].clearCircle();
	};
};

Canvas.prototype.findAndFillNode = function(elements) {
	// creates an array of indicated values using delimiter "\n", 
	// and calls circleMake to create the indicator circles.
	this.clearCircle();
	var RGB = this.indicatorColor
	var elementList = elements.split("\n");
	var checkIndex = {};    // Prevents nodes from being indicated more than once per fill
	for (var i in this.nodes){
		if (elementList.indexOf(this.nodes[i].name) > -1 || elementList.indexOf(this.nodes[i].identifier) > -1 && !(i in checkIndex)){
			this.nodes[i].makeCircle(RGB, 1);
			checkIndex[i] = i;
		}
	}
	this.weightVisualize();
	if ($.isEmptyObject(checkIndex)) {
		return false
	} else {
		return true
	};
};

function onlyUnique(value, index, self) { //get uniq values in array
    return self.indexOf(value) === index;
};

Canvas.prototype.findByGenesAndFillNode = function(elements) {
	// find by gene names or ids associated with each node
	this.clearCircle();
	var genesRev = this.genesRev; // name : id map for genes	
	var infoDict = this.infoDict
	var RGB = this.indicatorColor
	var elementList = elements.split("\n");			
	var checkIndex = {};    // Prevents nodes from being indicated more than once per fill
	var allNodes = []; // contain all nodes associated input elements
	for (var i = 0; i < elementList.length; i++) {
		var element = elementList[i];
		if (genesRev.hasOwnProperty(element)) {
			element = genesRev[element];
		};
		var nodes = infoDict[element]
		allNodes.push.apply(allNodes, nodes) // extend
	};
	allNodesUniq = allNodes.filter(onlyUnique)
	for (var i in this.nodes){
		if (allNodesUniq.indexOf(this.nodes[i].identifier) > -1 && !(i in checkIndex)){
			var pval = this.nodes[i].genes[0][element]
			var opacity = pval;
			this.nodes[i].makeCircle(RGB, opacity);
			checkIndex[i] = i;
		};
	};
	this.weightVisualize();
	if ($.isEmptyObject(checkIndex)) {
		return false
	} else {
		return true
	};
};

Canvas.prototype.findElement = function(findSelector) {
	// wrapper function for the finding functionality
	this.findSelector = findSelector;
	var canvasObj = this;
	var form = d3.select(findSelector).append('form')
		.attr('role', 'form')
		.attr('class', 'form-horizontal')
	var divUp = form.append('div')	
		.attr('class', 'row')
	var divDown = form.append('div')
		.attr('class', 'row')
	var label1 = divDown.append('div')
		.attr('class', 'radio')
		.append('label')
		.attr('for', 'findBySE')
	label1.append('input')
		.property({'value':'0', 'name':'options', 'type':'radio', 'checked':'checked'})
		.attr('id', 'findBySE')
	label1.append('span').text('find by side effect(s)')
	var label2 = divDown.append('div')
		.attr('class', 'radio')
		.append('label')
		.attr('for', 'findByDrug')
	label2.append('input')
		.property({'value':'0', 'name':'options', 'type':'radio'})
		.attr('id', 'findByDrug')
	label2.append('span').text('find by drug(s)')
	divUp.append('textarea')
		.attr('rows', '5')
		.attr('class', 'form-control')
		.attr('id', 'textInput')
		.attr('placeholder', 'Search for drugs/side-effects by names or ids')
	
	divDown.append('div').text('try an example:')

	var btnGroup = divDown.append('div').attr('class', 'btn-group');
	btnGroup.append('input')
		.attr('type', 'button')
		.attr('class', 'btn btn-info')
		.attr('value' ,'Side effect')
		.on('click', function(){
			var nodes = canvasObj.nodes;
			var randIdx = Math.floor(Math.random()*nodes.length)
			var randomSE = canvasObj.nodes[Math.floor(Math.random()*nodes.length)].name
			this.form.textInput.value = randomSE
			this.form.findBySE.checked = true
		})
	btnGroup.append('input')
		.attr('type', 'button')
		.attr('class', 'btn btn-info')
		.attr('value' ,'Drug')
		.on('click', function(){
			var drugs = Object.keys(canvasObj.genesRev)
			var randIdx = Math.floor(Math.random()*drugs.length)
			var randomDrug = drugs[randIdx]
			this.form.textInput.value = randomDrug
			this.form.findByDrug.checked = true
		})
	btnGroup.append('input')
		.attr('type', 'button')
		.attr('class', 'btn btn-primary')
		.attr('id', 'findButton')
		.attr('value', 'Find')
		.on('click', function(){
			var input = this.form.textInput.value
			d3.select('#warning').remove()
			if (this.form.findBySE.checked) {
				if (!canvasObj.findAndFillNode(input)) {
					divDown.append('div').attr('id','warning')
						.attr('class', 'alert alert-danger')
						.attr('role', 'alert')
						.text('No side effects can be find, please try another one.')
				};
			} else {
				if (!canvasObj.findByGenesAndFillNode(input)) {
					divDown.append('div').attr('id','warning')
						.attr('class', 'alert alert-danger')
						.attr('role', 'alert')
						.text('No drugs can be find, please try another one.')
			};
		};
	});

};

function Node(index, weight, identifier) {
	this.index = index;
	this.weight = weight;
	this.identifier = identifier;
	this.name = identifier; // a placeholder for the name of term/node
	this.circles = [];
	this.color = "rgb(0,0,0)";
	this.genes = []; // to hold Gene objects
};

Node.prototype.makeCircle = function(RGB, opacity) {
	var adjust = Math.pow(0.7, this.circles.length)
	this.circles.push([this.name, ["rgb(", RGB.join(","), ")"].join("") , adjust, opacity]);
};

Node.prototype.clearCircle = function() {
	this.circles = [];
};

Node.prototype.colorize = function(scale, canvasRGB) {
	var oriNum = [];
	for (var i = 0; i < 3; i++) {
		oriNum.push(Math.floor(canvasRGB[i] * Math.pow(this.weight, scale)/Math.pow(8, scale) ));
	};
	this.color = ["rgb(", oriNum.join(","), ")"].join("");
};

Node.prototype.setName = function(name) {
	this.name = name;
};

Node.prototype.addGene = function(Gene) {
	this.genes.push(Gene);
};
