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
	store, hash, topic, lang, ioQuery, request, array,
	domConstr, domAttr
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
			var query = this._sanitizeHashObject(
				ioQuery.queryToObject(
					((cHash == undefined) ? hash() : cHash)
				)
			);
			
			if(!this._isBlank(query.section)){
				this._displayMenu(query.section);
			}
			
			if(!this._isBlank(query.id)){
				//console.log("Changing to service: ", query.id);
				if(!this._isEqual(query.id, this.get("id"))){
					this.serviceListDisplayer.clear();
					this._displayService(query.id.toLowerCase());
					this.set("id", query.id.toLowerCase());
				}
			}else if(!this._isBlank(query.section)){
				if(!this._isBlank(query.category)){
					//console.log("Changing to category: ", query.category, " in: ", query.section);
					this.serviceDisplayer.clear();
					this._displayCategoryList(
						query.section, query.category, query.tag
					);
				}
			}else{
				//console.log("CLEARING ALL");
				this.serviceDisplayer.clear();
				this.serviceListDisplayer.clear();
			}
		},
		
		_sanitizeHashObject: function(hashQuery){
			array.forEach(["id","section","category","tag"], function(propName){
				hashQuery = this._addPropertyToObject(hashQuery, propName);
			}, this);
			hashQuery.id = hashQuery.id.toLowerCase();
			
			return hashQuery;
		},
		
		_addPropertyToObject: function(obj, propName, defaultValue){
			if(!this._isBlank(propName)){
				defaultValue = ((defaultValue === undefined) ? "" : defaultValue);
				obj[propName] = ((obj.hasOwnProperty(propName)) ? obj[propName] : defaultValue);
			}
			
			return obj;
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
		
		_displayCategoryList: function(section, category, tag){
			section = (this._isEqual(section,"Family Services")) ? 1 : 2;
			tag = (tag === undefined) ? "" : tag;
			
			var title = category + ((this._isBlank(tag)) ? "" : ": " + tag);
			this.set("title", title);
			
			if(this._isBlank(tag)){
				var services = this._store.getCategory(section, category);
				this.serviceListDisplayer.set("value", services);
				var tags = this._store.getTagsList(section, category);
				this.serviceListDisplayer.set("tags", tags);
			}else{
				var services = this._store.getTag(section, category, tag);
				this.serviceListDisplayer.set("value", services);
				this.serviceListDisplayer.set("tags", []);
			}
		},
		
		_displayService: function(id){
			var service = this._store.getService(id);
			
			if(!this._isBlank(service)){
				this._setServiceHash(service);
				this.set("title", this._getTitle(service.data));
				this.serviceDisplayer.set("value", service.data);
				
				if(service.isStub){
					this._store.updateService(id);
				}
			}else{
				this._store.updateService(id);
			}
		},
		
		_displayMenu: function(section){
			var categories = this._store.getCategoryList(section);
			this.sideMenu.set("section", section);
			this.sideMenu.set("value", categories);
		},
		
		_setServiceHash: function(service){
			var query = this._sanitizeHashObject(
				ioQuery.queryToObject(hash())
			);
			
			var ASD = this._getCategorySize(service, "category1");
			var FSD = this._getCategorySize(service, "category2");
			
			if(FSD > ASD){
				query.section = "Family Services";
			}else{
				query.section = "Adult Services";
			}
			
			this._updateHash(query);
		},
		
		_getCategorySize: function(service, section){
			if(this._isObject(service)){
				if(service.hasOwnProperty("data")){
					service = service.data;
				}
			}else{
				return 0;
			}
			
			if(service.hasOwnProperty(section)){
				if(this._isArray(service[section])){
					return service[section].length;
				}else{
					return 1;
				}
			}
			
			return 0
		},
		
		_updateHash: function(query){
			var newQuery = {};
			
			for(var key in query){
				if(!this._isBlank(query[key])){
					newQuery[key] = query[key];
				}
			}
			
			hash(ioQuery.objectToQuery(newQuery));
		},
		
		_serviceDataUpdate: function(id){
			if(!this._isBlank(id)){
				if(this._isEqual(id, this.id)){
					this._displayService(id)
				}
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