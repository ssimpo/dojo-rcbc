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
	"./pin/cacheStore",
	"dojo/hash",
	"dojo/topic",
	"dojo/_base/lang",
	"dojo/io-query",
	"dojo/request",
	"dojo/_base/array",
	
	"./pin/sideMenu",
	"./pin/serviceDisplayer",
	"./pin/serviceListDisplayer"
], function(
	declare,
	_widget, _templated, _wTemplate, _variableTestMixin,
	i18n, strings, template,
	store, hash, topic, lang, ioQuery, request, array
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
		
		"_store": {},
		
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._store = new store();
			//this._store.clear(true);
			//this._store._updateStubs();
			
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
				console.log("Changing to service: ", query.id);
				this._loadServiceData(query.id);
				this._loadMenuJson(query.id);
				this.serviceListDisplayer.clear();
			}else if(query.hasOwnProperty("section") && query.hasOwnProperty("category")){
				console.log("Changing to category: ", query.category, " in: ", query.section);
				this.serviceDisplayer.clear();
				this._displayCategoryList(query.section, query.category);
			}else{
				console.log("CLEARING ALL");
				this.serviceDisplayer.clear();
				this.serviceListDisplayer.clear();
			}
		},
		
		_displayCategoryList: function(section, category){
			section = (this._isEqual(section,"Family Services")) ? 1 : 2;
			var services = this._store.getCategory(section, category);
			this.serviceListDisplayer.set("title", category);
			this.serviceListDisplayer.set("value", services);
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
		
		_loadServiceData: function(id){
			var data = this._store.get(id);
			if(this._isBlank(data)){
				this._loadServiceJson(id);
			}else{
				//console.log("GETTING '"+id+"' FROM CACHE");
				this._jsonServiceLoaded(id, data.data);
				if(data.isStub){
					this._loadServiceJson(id);
				}
			}
		},
		
		_loadServiceJson: function(id){
			if(!this._isBlank(id)){
				if(id.length == 32){
					request(
						this._serviceUpdateUrl + "&id=" + id, {
							"handleAs": "json",
							"preventCache": true
						}
					).then(
						lang.hitch(this, this._jsonServiceLoaded, id),
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
		
		_jsonServiceLoaded: function(id, data){
			if(this._isObject(data)){
				if(data.hasOwnProperty("services")){
					if(this._isArray(data.services)){
						if(data.services.length == 1){
							this.serviceDisplayer.set("value", data.services[0]);
						}else if(data.services.length > 0){
							this.serviceDisplayer.set("value", data);
						}
						
						this._parseServices(data.services);
					}
				}
			}	
		},
		
		_parseServices: function(services){
			var getUpdate = new Array();
			
			array.forEach(services, function(service){
				if(service.isStub){
					var currentData = this._store.get(service.id);
					if(!this._isBlank(currentData)){
						if(currentData.isStub){
							this._store.put({
								"id": service.id,
								"type": "service",
								"data": service,
								"isStub": service.isStub
							});
							getUpdate.push(service.id);
						}
					}
				}else{
					this._store.put({
						"id": service.id,
						"type": "service",
						"data": service,
						"isStub": service.isStub
					});
				}
			}, this);
			
			if(!this._isBlank(getUpdate)){
				//this._store.updateCache(getUpdate);
			}
		}
	});
	
	return construct;
});