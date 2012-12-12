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
	"dojo/dom-construct",
	"dojo/dom-attr",
	
	"./pin/sideMenu",
	"./pin/serviceDisplayer",
	"./pin/serviceListDisplayer"
], function(
	declare,
	_widget, _templated, _wTemplate, _variableTestMixin,
	i18n, strings, template,
	store, hash, topic, lang, ioQuery, request, array, domConstr, domAttr
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
		
		"id": "",
		
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._store = new store();
			//this._store.clear(true);
			this._initTopicSubscriptions();
			this._hashChange();
		},
		
		_initTopicSubscriptions: function(){
			topic.subscribe(
				"/dojo/hashchange",
				lang.hitch(this, this._hashChange)
			);
			topic.subscribe(
				"/rcbc/pin/updateService",
				lang.hitch(this, this._serviceDataUpdate)
			);
		},
		
		_hashChange: function(cHash){
			cHash = ((cHash == undefined) ? hash() : cHash);
			var query = ioQuery.queryToObject(cHash);
			
			if(query.hasOwnProperty("id")){
				console.log("Changing to service: ", query.id);
				this.serviceListDisplayer.clear();
				this.set("id", query.id.toLowerCase());
				this._displayService(query.id.toLowerCase());
			}else if(query.hasOwnProperty("section") && query.hasOwnProperty("category")){
				console.log("Changing to category: ", query.category, " in: ", query.section);
				this.serviceDisplayer.clear();
				this.set("id", "");
				this._displayCategoryList(query.section, query.category);
			}else{
				console.log("CLEARING ALL");
				this.serviceDisplayer.clear();
				this.serviceListDisplayer.clear();
				this.set("id", "");
			}
		},
		
		_setTitleAttr: function(title){
			this.title = title;
			if(this._isBlank(this.title)){
				domConstr.empty(this.titleNode);
			}else{
				domAttr.set(this.titleNode, "innerHTML", this.title);
			}
		},
		
		_getTitle: function(value){
			var title = "";
			var serviceTitle = this._getField(value, "serviceName");
			var orgTitle = this._getField(value, "orgName");
			
			if((serviceTitle === "") && (orgTitle !== "")){
				title = orgTitle;
			}else if((serviceTitle !== "") && (orgTitle !== "")){
				title = serviceTitle + " ("+orgTitle+")";
			}else{
				title = serviceTitle;
			}
			
			return title;
		},
		
		_displayCategoryList: function(section, category){
			section = (this._isEqual(section,"Family Services")) ? 1 : 2;
			var services = this._store.getCategory(section, category);
			this.set("title", category);
			this.serviceListDisplayer.set("value", services);
		},
		
		_displayService: function(id){
			var service = this._store.getService(id);
			console.log("*service: "+id, service);
			
			if(!this._isBlank(service)){
				this.set("title", this._getTitle(service.data));
				this.serviceDisplayer.set("value", service.data);
				if(service.isStub){
					this._store.updateService(id);
				}
			}else{
				this._store.updateService(id);
			}
			
			this._loadMenuJson(id);
		},
		
		_serviceDataUpdate: function(id){
			if(!this._isBlank(id)){
				if(this._isEqual(id, this.id)){
					this._displayService(id)
				}
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
		},
		
		_getField: function(data, fieldName){
			var value = ""
			
			if(data.hasOwnProperty(fieldName)){
				value = data[fieldName];
			}
			
			return lang.trim(value);
		}
	});
	
	return construct;
});