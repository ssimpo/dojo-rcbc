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
	"dojo/_base/array"
], function(
	declare,
	_widget, _templated, _wTemplate, _variableTestMixin,
	i18n, strings, template,
	serviceDisplayer, domConstr, array
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
		"parentPosPlace": "after",
		
		_initNodes: function(){
			if(this.application !== null){
				if(this.parentNode === null){
					this.parentNode = this.application.hiddenDiv;
				}
				if(this.hiddenNode === null){
					this.hiddenNode = this.application.hiddenDiv;
				}
			}
		},
		
		_hideWidget: function(){
			if(this.hiddenNode !== null){
				domConstr.place(this.domNode, this.hiddenNode);
			}
		},
		
		_showWidget: function(){
			if(this.parentNode !== null){
				domConstr.place(
					this.domNode, this.parentNode, this.parentPosPlace
				);
			}
		},
		
		clear: function(){
			this.set("value",[]);
		},
		
		_setValueAttr: function(value){
			this._initNodes();
			
			if(this._isBlank(value)){
				this._hideWidget();
				array.forEach(this._displayers, function(displayer){
					displayer.destroy();
				}, this);
				this._displayers = new Array();
			}else{
				this._showWidget();
				this._displayShortlist(value);
			}
			this.value = value;
		},
		
		_displayShortlist: function(ids){
			this._displayers = new Array();
			var services = this._getServices(ids);
			array.forEach(services, function(service){
				var displayer = new serviceDisplayer({
					"application": this.application,
					"parentNode": this.domNode
				});
				this._displayers.push(displayer);
				domConstr.place(displayer.domNode, this.domNode);
				displayer.set("value", service.data);
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