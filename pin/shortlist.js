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
		
		clear: function(){
			this.set("value",[]);
			this._displayers = new Array();
		},
		
		_setValueAttr: function(value){
			if(this._isBlank(value)){
				domConstr.place(
					this.domNode,
					this.application.hiddenDiv
				);
			}else{
				domConstr.place(
					this.domNode,
					this.application.hiddenDiv,
					"after"
				);
				this._displayShortlist(value);
			}
			this.value = value;
		},
		
		_displayShortlist: function(ids){
			this._displayers = new Array();
			var services = this._getServices(ids);
			array.forEach(services, function(service){
				var displayer = new serviceDisplayer({
					"application": this.application
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