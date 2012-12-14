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
		
		_initNodes: function(){
			if(this.application !== null){
				if(this.parentNode === null){
					this.parentNode = this.application.articleContentNode;
				}
				if(this.hiddenNode === null){
					this.hiddenNode = this.application.hiddenDiv;
				}
			}
		},
		
		_hideWidget: function(){
			if(this.hiddenNode !== null){
				domConstr.place(this.domNode, this.hiddenNode);
				domClass.replace(
					this.parentNode,
					"articleContent",
					"articleContent-wide"
				);
			}
		},
		
		_showWidget: function(){
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
		},
		
		clear: function(){
			this.set("value",[]);
		},
		
		_setValueAttr: function(value){
			this._initNodes();
			
			this._destroyDisplayers();
			domConstr.empty(this.domNode);
			if(this._isBlank(value)){
				this._hideWidget();
			}else{
				topic.publish("/rcbc/pin/titleChange", "");
				this._showWidget();
				this._displayShortlist(value);
			}
			this.value = value;
		},
		
		_destroyDisplayers: function(){
			array.forEach(this._displayers, function(displayer){
				displayer.destroy();
			}, this);
			this._displayers = new Array();
		},
		
		_testForNewValues: function(value){
			var newValues = new Array();
			var compare = this.value;
			
			if(this._isArray(compare) && this._isArray(value)){
				var lookup = new Object();
				
				array.forEach(compare, function(id){
					lookup[id] = true;
				}, this);
				
				array.forEach(value, function(id){
					if(!lookup.hasOwnProperty(id)){
						newValues.push(id);
					}
				}, this);
			}else{
				return value;
			}
			
			return newValues;
		},
		
		_addHr: function(){
			domConstr.create("br", null, this.domNode);
			domConstr.create("hr", null, this.domNode);
			domConstr.create("br", null, this.domNode);
		},
		
		_displayShortlist: function(ids){
			this._displayers = new Array();
			var services = this._getServices(ids);
			
			array.forEach(services, function(service, n){
				var displayer = new serviceDisplayer({
					"application": this.application,
					"parentNode": this.domNode,
					"titleLevel": 2,
					"show": this.show
				});
				this._displayers.push(displayer);
				domConstr.place(displayer.domNode, this.domNode);
				displayer.set("value", service.data);
				
				if(n < (services.length-1)){
					this._addHr();
				}
			}, this);
		},
		
		_getServices: function(ids){
			var services = new Array();
			
			array.forEach(ids, function(id){
				var service = this.application.store.get(id);
				if(!this._isBlank(service)){
					services.push(service);
				}
			}, this);
			
			return services;
		}
	});
	
	return construct;
});