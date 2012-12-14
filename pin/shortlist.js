// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"./_variableTestMixin",
	"dojo/i18n",
	"dojo/i18n!./nls/shortlist",
	"dojo/text!./views/shortlist.html",
	"./serviceDisplayer",
	"dojo/dom-construct",
	"dojo/dom-class",
	"dojo/_base/array",
	"dojo/topic"
], function(
	declare,
	_widget, _templated, _wTemplate, _variableTestMixin,
	i18n, strings, template,
	serviceDisplayer, domConstr, domClass, array, topic
){
	"use strict";
	
	var construct = declare([
		_widget, _templated, _wTemplate, _variableTestMixin
	], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"value": [],
		"_displayers": [],
		
		"application": null,
		"parentNode": null,
		"hiddenNode": null,
		"parentPosPlace": "last",
		
		"show": {
			"title": true,
			"description": true,
			"keyFeatures": true,
			"contacts": true,
			"costs": true,
			"venues": true,
			"serviceHours": true,
			"accessDetails": true
		},
		
		_init: function(){
			try{
				this._initNodes();
				this._destroyDisplayers();
				domConstr.empty(this.domNode);
			}catch(e){
				console.info("Could not ininitate shortlist displayer.");
			}
		},
		
		_initNodes: function(){
			try{
				if(this.application !== null){
					if(this.parentNode === null){
						this.parentNode = this.application.articleContentNode;
					}
					if(this.hiddenNode === null){
						this.hiddenNode = this.application.hiddenDiv;
					}
				}
			}catch(e){
				console.info("Could not ininitate shortlist nodes.");
			}
		},
		
		_hideWidget: function(){
			try{
				if(this.hiddenNode !== null){
					domConstr.place(this.domNode, this.hiddenNode);
					domClass.replace(
						this.parentNode,
						"articleContent",
						"articleContent-wide"
					);
				}
			}catch(e){
				console.info("Could not hide shortlist displayer.");
			}
		},
		
		_showWidget: function(){
			try{
				if(this.parentNode !== null){
					domConstr.place(
						this.domNode, this.parentNode, this.parentPosPlace
					);
					domClass.replace(
						this.parentNode,
						"articleContent-wide",
						"articleContent"
					);
				}
			}catch(e){
				console.info("Could not show shortlist displayer.");
			}
		},
		
		clear: function(){
			this.set("value",[]);
		},
		
		_setValueAttr: function(value){
			this._init();
			
			try{
				if(this._isBlank(value)){
					this._hideWidget();
				}else{
					topic.publish("/rcbc/pin/titleChange", "");
					this._showWidget();
					this._displayShortlist(value);
				}
				this.value = value;
			}catch(e){
				console.info("Could not set shortlist displayer value.");
			}
		},
		
		_destroyDisplayers: function(){
			try{
				array.forEach(this._displayers, function(displayer){
					displayer.destroy();
				}, this);
				this._displayers = new Array();
			}catch(e){
				console.info("Could not destroy shortlist displayers");
			}
		},
		
		_addHr: function(){
			try{
				domConstr.create("br", null, this.domNode);
				domConstr.create("hr", null, this.domNode);
				domConstr.create("br", null, this.domNode);
			}catch(e){
				console.info("Could not add shortlist divider");
			}
		},
		
		_displayShortlist: function(ids){
			try{
				this._displayers = new Array();
				var services = this._getServices(ids);
			
				array.forEach(services, function(service, n){
					this._createDisplayer(service.data);
				
					if(n < (services.length-1)){
						this._addHr();
					}
				}, this);
			}catch(e){
				console.info("Could not display shortlist.");
			}
		},
		
		_createDisplayer: function(data){
			try{
				var displayer = new serviceDisplayer({
					"application": this.application,
					"parentNode": this.domNode,
					"titleLevel": 2,
					"show": this.show
				});
				this._displayers.push(displayer);
				domConstr.place(displayer.domNode, this.domNode);
				displayer.set("value", data);
			}catch(e){
				console.info("Could not create displayer.");
			}
		},
		
		_getServices: function(ids){
			var services = new Array();
			
			try{
				array.forEach(ids, function(id){
					var service = this.application.store.get(id);
					if(!this._isBlank(service)){
						services.push(service);
					}
				}, this);
			}catch(e){
				console.info("Could not get services");
			}
			
			return services;
		}
	});
	
	return construct;
});