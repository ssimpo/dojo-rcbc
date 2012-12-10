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
	"./pin/_variableTestMixin",
	"dojo/i18n",
	"dojo/i18n!./nls/pin",
	"dojo/text!./views/pin.html",
	"dojo/hash",
	"dojo/topic",
	"dojo/_base/lang",
	"dojo/io-query",
	"dojo/request",
	
	"./pin/sideMenu",
	"./pin/serviceDisplayer"
], function(
	declare,
	_widget, _templated, _wTemplate, _variableTestMixin,
	i18n, strings, template,
	hash, topic, lang, ioQuery, request
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
		
		"_menuUpdateUrl": "/test/stephen/pin.nsf/getMenu?openagent",
		"_serviceUpdateUrl": "/test/stephen/pin.nsf/getService?openagent",
		
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			topic.subscribe(
				"/dojo/hashchange",
				lang.hitch(this, this._hashChange)
			);
			this._hashChange();
		},
		
		_hashChange: function(cHash){
			cHash = ((cHash == undefined) ? hash() : cHash);
			var query = ioQuery.queryToObject(cHash);
			
			if(query.hasOwnProperty("id")){
				this._loadMenuJson(query.id);
				this._loadServiceJson(query.id);
			}
		},
		
		_loadMenuJson: function(id){
			if(!this._isBlank(id)){
				if(id.length == 32){
					request(
						this._menuUpdateUrl + "&id=" + id, {
							"handleAs": "json",
							"preventCache": true
						}
					).then(
						lang.hitch(this, this._jsonMenuLoaded),
						function(err){
							console.error(err);
						}
					);
				}
			}
		},
		
		_loadServiceJson: function(id){
			if(!this._isBlank(id)){
				if(id.length == 32){
					request(
						this._serviceUpdateUrl + "&id=" + id, {
							//"handleAs": "text",
							"handleAs": "json",
							"preventCache": true
						}
					).then(
						lang.hitch(this, this._jsonServiceLoaded),
						function(err){
							console.error(err);
						}
					);
				}
			}
		},
		
		_jsonMenuLoaded: function(data){
			this.sideMenu.set("section", data.section);
			this.sideMenu.set("value", data.items);
		},
		
		_jsonServiceLoaded: function(data){
			console.log(data);
			this.serviceDisplayer.set("value", data);
			
		},
	});
	
	return construct;
});