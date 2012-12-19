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
	"dojo/dom-class",
	"dojo/query",
	"dojo/on",
	
	"dijit/form/Button",
	"./pin/shortlist",
	"./pin/sectionMenu",
	"./pin/sideMenu",
	"./pin/serviceDisplayer",
	"./pin/serviceListDisplayer"
], function(
	declare,
	_widget, _templated, _wTemplate, _variableTestMixin,
	i18n, strings, template,
	store, hash, topic, lang, ioQuery, request, array,
	domConstr, domAttr, domClass, $, on
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
		
		"store": {},
		
		"serviceId": "",
		"section": "",
		"category": "",
		"tag": "",
		"pageTitle": "",
		
		"shortlistCounterNode": {},
		"headTitleNode": null,
		
		"_blankHashValue": {
			"id": "",
			"section": "",
			"category": "",
			"tag": ""
		},
		
		
		postCreate: function(){
			try{
				this._init();
			}catch(e){
				console.info("Could load PIN application.");
			}
		},
		
		_init: function(){
			try{
				this.store = new store();
				//uncomment to clear the localstorage.
				//this.store.clear(true);
			
				this._initTopicSubscriptions();
				this._initShortlist();
				this._initTitle();
				this._initEvents();
				this._hashChange();
			}catch(e){
				console.info("Could inititiate the PIN application.");
			}
		},
		
		_initTopicSubscriptions: function(){
			try{
				topic.subscribe(
					"/dojo/hashchange",
					lang.hitch(this, this._hashChange)
				);
				topic.subscribe(
					"/rcbc/pin/updateService",
					lang.hitch(this, this._serviceDataUpdate)
				);
				topic.subscribe(
					"/rcbc/pin/changeShortlist",
					lang.hitch(this, this._shortlistUpdate)
				);
				topic.subscribe(
					"/rcbc/pin/titleChange",
					lang.hitch(this, this._setPageTitleAttr)
				);
			}catch(e){
				console.warn("Could not initiate PIN subscriptions");
			}
		},
		
		_initEvents: function(){
			try{
				on(
					this.manageShortlistButton,
					"click",
					lang.hitch(this, this._shortlistClick)
				);
			}catch(e){
				console.warn("Could not initiate PIN events");
			}
		},
		
		_initShortlist: function(){
			try{
				var shortlist = this.store.getShortlist();
				var qry = $("#shortlistCounter");
				if(qry.length > 0){
					this.shortlistCounterNode = qry[0];
					this._shortlistUpdate(shortlist);
				}
			}catch(e){
				console.warn("Shortlist could not be loaded.")
			}
		},
		
		_initTitle: function(){
			var qry = $("head title");
			if(qry.length > 0){
				this.headTitleNode = qry[0];
			}
		},
		
		_setServiceIdAttr: function(id){
			var query = this._getHashObj();
			if(!this._isEqual(query.id, this.get("serviceId"))){
				this.serviceId = id;
				query.id = id.toLowerCase();
				this._updateHash(query);
			}
		},
		
		_setSectionAttr: function(section){
			var query = this._getHashObj();
			if(!this._isEqual(query.section, this.get("section"))){
				var oldSection = this._createItemClass(this.section);
				this.section = section;
				domClass.add(this.domNode, this._createItemClass(this.section));
				if(!this._isBlank(oldSection)){
					domClass.remove(this.domNode, oldSection);
				}
				query.section = section;
				this._updateHash(query);
			}
		},
		
		_setCategoryAttr: function(category){
			var query = this._getHashObj();
			if(!this._isEqual(query.category, this.get("category"))){
				var oldCategory = this._createItemClass(this.category);
				this.category = category;
				domClass.add(this.domNode, this._createItemClass(this.category));
				if(!this._isBlank(oldCategory)){
					domClass.remove(this.domNode, oldCategory);
				}
				query.category = category;
				this._updateHash(query);
			}
		},
		
		_createItemClass: function(category){
			category = category.replace(/ \& | and /g," ");
			category = category.replace(/ /g,"-");
			
			return category.toLowerCase();
		},
		
		_setTagAttr: function(tag){
			var query = this._getHashObj();
			if(!this._isEqual(query.tag, this.get("tag"))){
				this.tag = tag;
				query.tag = tag;
				this._updateHash(query);
			}
		},
		
		_setPageTitleAttr: function(title){
			try{
				this.pageTitle = title;
				if(this._isBlank(this.pageTitle)){
					domConstr.empty(this.titleNode);
				}else{
					domAttr.set(this.titleNode, "innerHTML", this.pageTitle);
				}
				
				this._changeHeadTitle(title);
			}catch(e){
				console.warn("Could not change the page heading");
			}
		},
		
		_changeHeadTitle: function(title){
			try{
				if(this.headTitleNode !== null){
					if(!this._isBlank(title)){
						try{
							domAttr.set(this.headTitleNode, "innerHTML", title);
						}catch(e){
							window.document.title = title;
						}
					}else{
						var query = this._getHashObj();
						if(!this._isBlank(query.section)){
							title = query.section;
							if(!this._isBlank(query.category)){
								title += " > " + query.category;
								if(!this._isBlank(query.tag)){
									title += " > " + query.tag;
								}
							}
							
							try{
								domAttr.set(this.headTitleNode, "innerHTML", title);
							}catch(e){
								window.document.title = title;
							}
						}else{
							try{
								domAttr.set(
									this.headTitleNode,
									"innerHTML",
									"Peoples Information Network"
								);
							}catch(e){
								window.document.title = title;
							}
						}
					}
				}
			}catch(e){
				console.warn("Could not change the page title", e);
			}
		},
		
		_hashChange: function(cHash){
			var query = this._getHashObj(cHash);
			
			if(!this._isBlank(query.id)){
				this._hashChangeNewId(query);
			}else if(!this._isBlank(query.section)){
				this._hashChangeNewSection(query);
			}else{
				this._hashChangeDefaultFallback(query);
			}
		},
		
		_hashChangeNewId: function(query){
			this.showButtonPanel();
			this._setShortlistLabel();
				
			if(!this._isBlank(query.section)){
				this._displayMenu(query.section);
			}
			
			if(!this._isEqual(query.id, this.get("serviceId"))){
				this.serviceListDisplayer.clear();
				this.sectionMenu.clear();
				this.shortlist.clear();
				
				this._displayService(query.id.toLowerCase());
				this.set("serviceId", query.id.toLowerCase());
			}
		},
		
		_hashChangeNewSection: function(query){
			if(!this._isEqual(query.section, this.get("section"))){
				this.set("section", query.section);
			}
			
			this.hideButtonPanel();
			this.serviceDisplayer.clear();
			
			if(!this._isBlank(query.category)){
				this._hashChangeNewCategory(query);
			}else{
				this.serviceListDisplayer.clear();
				this.sideMenu.clear();
				this.sectionMenu.clear();
					
				if(this._isEqual(query.section,"shortlist")){
					this._hashChangeNewSectionIsShortlist();
				}else{
					this.shortlist.clear();
					this._displaySectionMenu(query.section);
				}
			}
		},
		
		_hashChangeNewCategory: function(query){
			if(!this._isEqual(query.category, this.get("category"))){
				this.set("category", query.category);
			}
			if(!this._isEqual(query.tag, this.get("tag"))){
				this.set("tag", query.tag);
			}
			
			if(!this._isBlank(query.section)){
				this._displayMenu(query.section);
			}
			this.sectionMenu.clear();
			this.shortlist.clear();
			this._displayCategoryList(
				query.section, query.category, query.tag
			);
		},
		
		_hashChangeNewSectionIsShortlist: function(){
			var shortlist = this.store.getShortlist();
			if(Object.prototype.hasOwnProperty.call(shortlist, "services")){
				//articleContentNode
				this.shortlist.set("value", shortlist.services);
				if(shortlist.services.length > 0){
					this.showButtonPanel();
					this._setShortlistLabel();
				}
			}
		},
		
		_hashChangeDefaultFallback: function(){
			this.hideButtonPanel();
			this.sideMenu.clear();
			this.sectionMenu.clear();
			this.shortlist.clear();
			this.serviceDisplayer.clear();
			this.serviceListDisplayer.clear();
		},
		
		hideButtonPanel: function(){
			domConstr.place(
				this.buttonsPanelNode, this.hiddenDiv
			);
		},
		
		showButtonPanel: function(){
			domConstr.place(
				this.buttonsPanelNode, this.articleContentNode, "first"
			);
		},
		
		_setShortlistLabel: function(){
			var hash = this._getHashObj();
			
			if(!this._isBlank(hash.id)){
				if(this.store.inShortlist(hash.id)){
					this.manageShortlistButton.set("label", "Remove from shortlist");
				}else{
					this.manageShortlistButton.set("label", "Add to shortlist");
				}
			}else{
				if(this._isEqual(hash.section, "shortlist")){
					this.manageShortlistButton.set("label", "Empty shortlist");
				}
			}
			
			this.manageShortlistButton.startup();
		},
		
		_shortlistClick: function(){
			var hash = this._getHashObj();
			
			if(!this._isBlank(hash.id)){
				if(this.store.inShortlist(hash.id)){
					this.store.removeFromShortlist(hash.id);
					this._setShortlistLabel();
				}else{
					this.store.addToShortlist(hash.id);
					this._setShortlistLabel();
				}
			}else{
				if(this._isEqual(hash.section, "shortlist")){
					this.store.emptyShortlist();
					this.hideButtonPanel();
				}
			}
		},
		
		_getHashObj: function(cHash){
			try{
				return this._sanitizeHashObject(
					ioQuery.queryToObject(
						((cHash == undefined) ? hash() : cHash)
					)
				);
			}catch(e){
				console.warn("Could not get the hash object");
				return this._blankHashValue;
			}
		},
		
		_sanitizeHashObject: function(hashQuery){
			try{
				for(var propName in this._blankHashValue){
					hashQuery = this._addPropertyToObject(hashQuery, propName);
				}
				hashQuery.id = hashQuery.id.toLowerCase();
				
				return hashQuery;
			}catch(e){
				console.warn("Could not sanitize the hash object");
				return this._blankHashValue;
			}
		},
		
		_addPropertyToObject: function(obj, propName, defaultValue){
			try{
				if(!this._isBlank(propName)){
					defaultValue = ((defaultValue === undefined) ? "" : defaultValue);
					obj[propName] = ((Object.prototype.hasOwnProperty.call(obj, propName)) ? obj[propName] : defaultValue);
					
				}
			}catch(e){
				console.error("Failed to add property to object");
			}
			
			return obj;
		},
		
		_displayCategoryList: function(section, category, tag){
			section = (this._isEqual(section,"Family Services")) ? 1 : 2;
			tag = (tag === undefined) ? "" : tag;
			
			this.serviceListDisplayer.set("section", section);
			this.serviceListDisplayer.set("category", category);
			this.serviceListDisplayer.set("tag", tag);
			
			if(this._isBlank(tag)){
				var services = this.store.getCategory(section, category);
				this.serviceListDisplayer.set("value", services);
				var tags = this.store.getTagsList(section, category);
				this.serviceListDisplayer.set("tags", tags);
			}else{
				var services = this.store.getTag(section, category, tag);
				this.serviceListDisplayer.set("value", services);
				this.serviceListDisplayer.set("tags", []);
			}
		},
		
		_displaySectionMenu: function(section){
			var categories = this.store.getCategoryList(section);
			this.sectionMenu.set("section", section);
			this.sectionMenu.set("value", categories);
		},
		
		_displayService: function(id){
			var service = this.store.getService(id);
			
			if(!this._isBlank(service)){
				this._setServiceHash(service);
				this.serviceDisplayer.set("value", service.data);
				
				if(service.isStub){
					this.store.updateService(id);
				}
			}else{
				this.store.updateService(id);
			}
		},
		
		_displayMenu: function(section){
			var categories = this.store.getCategoryList(section);
			this.sideMenu.set("section", section);
			this.sideMenu.set("value", categories);
		},
		
		_setServiceHash: function(service){
			var query = this._getHashObj();
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
				if(Object.prototype.hasOwnProperty.call(service, "data")){
					service = service.data;
				}
			}else{
				return 0;
			}
			
			if(Object.prototype.hasOwnProperty.call(service, section)){
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
		
		_parseCategory: function(service, section){
			section = (this._isEqual(section,"Family Services")) ? 1 : 2;
			var fieldName = "category" + section.toString();
			
			if(service.hasOwnProperty(fieldName)){
				if(!this._isArray(service[fieldName])){
					if(this._isBlank(service[fieldName])){
						return new Array();
					}else{
						return this._trimArray(new Array(service[fieldName]));
					}
				}else{
					return this._trimArray(service[fieldName]);
				}
			}
			
			return new Array();
		},
		
		_trimArray: function(ary){
			var newAry = new Array();
			
			array.forEach(ary, function(item){
				item = lang.trim(item);
				if(!this._isBlank(item)){
					newAry.push(item);
				}
			}, this);
			
			return newAry;
		},
		
		_shortlistUpdate: function(shortlist){
			if(this._isElement(this.shortlistCounterNode)){
				var counter = 0;
				if(Object.prototype.hasOwnProperty.call(shortlist, "services")){
					counter = shortlist.services.length;
				}
				domAttr.set(
					this.shortlistCounterNode,
					"innerHTML",
					counter.toString()
				);
			}
			
			var query = this._getHashObj();
			if(this._isEqual(query.section, "shortlist")){
				this.shortlist.set("value", shortlist.services);
			}
		},
		
		_serviceDataUpdate: function(id, data){
			if(!this._isBlank(id)){
				var query = this._getHashObj();
				
				if(this._isEqual(query.id, id)){
					this._displayService(query.id)
				}
				
				/*if(!this._isBlank(query.category) && !this._isBlank(query.section) && this._isBlank(query.id)){
					if(data.hasOwnProperty("data")){
						data = data.data;
					}
					
					var categories = this._parseCategory(data, query.section);
					array.forEach(categories, function(category){
						if(this._isEqual(category, query.category)){
							this._displayCategoryList(query.section, query.category, query.tag);
						}
					}, this);
				}*/
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