/**
A Backbone.View that exposes a custom search bar.  The search bar provides autocomplete
functionality for Connectivity Map pert\_inames and cell\_ids.  When the user types in the
search view's input, a "search:DidType" event is fired.

@class PertSearchBar
@constructor
@extends Backbone.View
**/
PertSearchBar = Backbone.View.extend({
        initialize: function(){
                var self = this;

                /**
                determines wether or not the search view will match cell lines for autocomplete

                @property match_cell_lines
                @default true
                @type Boolean
                **/
                // determine wether or not we will match cell line strings in the autocomplete
                this.match_cell_lines = (this.options.match_cell_lines !== undefined) ? this.options.match_cell_lines : true;

                // grab cell_ids and store them as an atribute of the view
                var cellinfo = 'http://api.lincscloud.org/a2/cellinfo?callback=?';
                var params = {q:'{"cell_id":{"$regex":""}}',d:"cell_id"};
                $.getJSON(cellinfo,params,function(res){
                        self.cell_lines = res;
                        self.render();

                        // once the view is rendered, bind a change event to trigger a "search:DidType" event from the view
                        $("#search",self.el).bind('input propertychange change', function () {
                                var val  = $("#search",self.el).val();
                                var type = "";
                                if (self.cell_lines.indexOf(val) != -1 && self.match_cell_lines){
                                        type = "cell";
                                }

                                /**
                                Fired when the text in the view's search box changes

                                @event search:DidType
                                @param {Object} [msg={val:"",type:""}] an object containing the message of the event
                                @param {String} [msg.val=""] the string val of the views search bar at the time of the event
                                @param {String} [msg.type=""] the type of message being passed, either "" or "cell". "cell" is passed, if the string matches a cell line and match\_cell\_lines is set
                                **/
                                self.trigger("search:DidType",{val: val,type: type});
                        });
                });

        },


        /**
    Gets the current text entered in the view's search bar
    
    @method get_val
    **/
        get_val: function(){
                return $("#search",this.el).val();
        },

        /**
    fills the view's search bar with a random pert_iname and triggers a "search:DidType" event
    
    @method random_val
    **/
        random_val: function(){
                var self = this;
                skip = Math.round(Math.random()*40000);
                var pertinfo = 'http://api.lincscloud.org/a2/pertinfo?callback=?';
                params = {f:'{"pert_iname":1}',
                                                                                l:1,
                                                                                sk:skip};
                $.getJSON(pertinfo,params,function(res){
                        var val = res[0].pert_iname;
                        $("#search",this.el).val(val);
                        self.trigger("search:DidType",{val: val,type: 'single'});
                });
        },

        set_val: function(new_val){
                $("#search",this.el).val(new_val);
                this.trigger("search:DidType",{val: new_val,type: 'single'});
        },

        /**
     the html template to be used as the views code
     
     @property template
     @default '<div class="input-append span10"><input class="span12" autocomplete="off" type="text" placeholder="search gene, compound, or cell type name; separate compound searches with :" data-provide="typeahead" id="search"><span class="add-on">Search 1,209,824 profiles</span></div>'
     @type String
     **/
        template: function(template_string){
                if (template_string === undefined){
                        template_string = '<div class="input-append span10"><input class="span12" autocomplete="off" type="text" placeholder="search gene, compound, or cell type name; separate compound searches with :" data-provide="typeahead" id="search"><span class="add-on">Search 1,209,824 profiles</span></div>';
                }
                var compiled_template = Handlebars.compile(template_string);
                return compiled_template;
        },

        /**
    renders the view
    
    @method render
    **/
        render: function(){
                var self = this;
                // load the template into the view's el tag
                this.$el.html(this.template());

                // configure the typeahead to autocomplete off of RESTful calls to pertinfo
                var auto_data = [];
                var pertinfo = 'http://api.lincscloud.org/a2/pertinfo?callback=?';
                
                // instatiate an object to serve as a pert_iname to pert_type hash
                var object_map = {};

                $('#search',this.$el).typeahead({
                        // only return 4 items at a time in the autocomplete dropdown
                        items: 4,

                        // custom source argument to pull results from pert_info
                        source: function(query,process){
                        var val = $("#search",this.$el).val();
                        return $.getJSON(pertinfo,{q:'{"pert_iname":{"$regex":"' + val + '", "$options":"i"}}',
                                                                                f:'{"pert_iname":1,"pert_type":1}',
                                                                                l:100,
                                                                                s:'{"pert_iname":1}'},
                                                                                function(response){
                                                                                        // for each item, pull out its pert_iname and use that for the
                                                                                        // autocomplete value. Map its type to the pert_iname for use 
                                                                                        // in the highlighter function below
                                                                                        response.forEach(function(element){
                                                                                                auto_data.push(element.pert_iname);
                                                                                                object_map[element.pert_iname] = element;
                                                                                        });

                                                                                        // make sure we only show unique items
                                                                                        auto_data = _.uniq(auto_data);

                                                                                        // add cell lines if required
                                                                                        if (self.match_cell_lines){
                                                                                                auto_data = auto_data.concat(self.cell_lines);        
                                                                                        }

                                                                                        // return the processed list of data for the autocomplete
                                                                                        return process(auto_data);
                                                                                });
                        },

                        // custom highlighter argument to display matched types
                        highlighter: function(item){
                                if (self.cell_lines.indexOf(item) != -1){
                                        return '<div><span class="label" style="background-color: #CC79A7">Cellular Context</span>  ' + item  +  '</div>';
                                }
                                if (object_map[item].pert_type === 'trt_sh' || object_map[item].pert_type === 'trt_oe'){
                                        return '<div><span class="label" style="background-color: #0072B2">Genetic Reagent</span>  ' + item  +  '</div>';
                                }
                                if (object_map[item].pert_type === 'trt_cp' ){
                                        return '<div><span class="label" style="background-color: #E69F00">Chemical Reagent</span>  ' + item  +  '</div>';
                                }
                        }

                });
        }
});