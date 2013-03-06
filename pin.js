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
	"dojo/i18n",
	"dojo/i18n!./nls/pin",
	"dojo/i18n!dijit/nls/loading",
	"dojo/text!./views/pin.html",
	"./pin/cacheStore2",
	"dojo/hash",
	"dojo/topic",
	"dojo/_base/lang",
	"dojo/io-query",
	"dojo/request",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dojo/dom-class",
	"dojo/dom-style",
	"dojo/query",
	"dojo/on",
	"dijit/registry",
	"dojo/string",
	"simpo/typeTest",
	"simpo/interval",
	
	"rcbc/pin/contentPane",
	"dijit/form/Button",
	"./pin/shortlist",
	"./pin/sectionMenu",
	"./pin/sideMenu",
	"./pin/serviceDisplayer",
	"./pin/serviceListDisplayer",
	"dijit/Tooltip"
], function(
	declare,_widget, _templated, _wTemplate, i18n, strings, loadingStrings,
	template, store, hash, topic, lang, ioQuery, request, array, domConstr,
	domAttr, domClass, domStyle, $, on, registry, string, typeTest, interval
){
	"use strict";
	
	var staticStoreReady = false;
	var staticStoreReadyStubs = false;
	
	var staticStore = new store({
		"ready": function(){
			staticStoreReady = true;
		},
		"readyStubs": function(){
			staticStoreReadyStubs = true;
		}
	});
	
	var construct = declare([_widget, _templated, _wTemplate], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		"i18nLoading": loadingStrings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"store": {},
		
		"serviceId": "",
		"section": "",
		"category": "",
		"tag": "",
		"pageTitle": "",
		"searchForm": "",
		"heading": "",
		
		"shortlistCounterNode": {},
		"headTitleNode": null,
		
		"_currentDeferred": null,
		
		"_blankHashValue": {
			"id": "",
			"section": "",
			"category": "",
			"tag": "",
			"search": "",
			"pageId": ""
		},
		
		"_previousHash": {},
		"_databaseReadyActionDone": false,
		
		postCreate: function(){
			try{
				window.errorLevel = 5;
				this._init();
			}catch(e){
				console.warn("consoleInfo.couldNotLoad");
			}
		},
		
		_init: function(){
			try{
				this.loading(true);
				/*this.store = new store({
					"ready": lang.hitch(this, this._databaseReady),
					"readyStubs": lang.hitch(this, this._databaseReadyStubs)
				});*/
				
				this._initIntervalPeriod();
				this.store = staticStore;
				if(!staticStoreReadyStubs){
					staticStore.readyStubs = lang.hitch(this, this._databaseReadyStubs);
				}
				if(!staticStoreReady){
					staticStore.ready = lang.hitch(this, this._databaseReady);
				}
				
				//uncomment to clear the localstorage.
				//this.store.clear(true);
			
				this._initTopicSubscriptions();
				this._initTitle();
				this._initHeading();
				this._initSearchForm();
				this._initTooltip();
			}catch(e){
				console.warn("pin.couldNotInit", e);
			}
		},
		
		_initIntervalPeriod: function(){
			interval.set("period", 75);
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
				console.warn("pin.couldNotInitSubs");
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
				console.warn("pin.couldNotInitEvents", e);
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
				console.warn("pin.shortlistNotLoaded", e)
			}
		},
		
		_initTitle: function(){
			var qry = $("head title");
			if(qry.length > 0){
				this.headTitleNode = qry[0];
			}
		},
		
		_initHeading: function(){
			var qry = $(".header");
			if(qry.length > 0){
				this.heading = qry[0];
			}
		},
		
		_initSearchForm: function(){
			var qry = $("form.rcbcPinSearchWidget");
			if(qry.length > 0){
				var node = qry[0];
				var widget = registry.byNode(node);
				if(typeTest.isWidget(widget)){
					this.searchForm = widget;
					this.searchForm.application = this;
				}
			}
		},
		
		_initTooltip: function(){
			this.tooltip.addTarget(this.manageShortlistButton.domNode);
		},
		
		_getRootNode: function(getHtmlNode){
			getHtmlNode = ((getHtmlNode === undefined) ? false : true);
			var qry = $((getHtmlNode ? "html" : "body"));
			return ((qry.length > 0) ? qry[0] : null);
		},
		
		_setRootCursor: function(cursor){
			cursor = ((cursor === undefined) ? "default" : cursor);
			domStyle.set(this._getRootNode(false), "cursor", cursor);
			domStyle.set(this._getRootNode(true), "cursor", cursor);
		},
		
		loading: function(isLoading){
			isLoading = ((isLoading === undefined) ? true : isLoading);
			if(isLoading){
				this._setRootCursor("progress");
				domAttr.set(
					this.loadingNode, "innerHTML", loadingStrings.loadingState
				);
			}else{
				this._setRootCursor();
				domAttr.set(
					this.loadingNode, "innerHTML", ""
				);
				this.shortlist.ready();
			}
		},
		
		_databaseReady: function(data){
			if(data.size > 0){
				this._databaseReadyAction();
			}
		},
		
		_databaseReadyStubs: function(){
			this._databaseReadyAction();
		},
		
		_databaseReadyAction: function(){
			if(!this._databaseReadyActionDone){
				this._databaseReadyActionDone = true;
				this._initShortlist();
				this._initEvents();
				this._hashChange();
				this.loading(false);
			}
		},
		
		_setServiceIdAttr: function(id){
			var query = this._getHashObj();
			if(!typeTest.isEqual(query.id, this.get("serviceId"))){
				var oldCategory = this._createItemClass(this.category);
				if(!typeTest.isBlank(oldCategory)){
					domClass.remove(this.heading, oldCategory);
					domClass.remove(this.domNode, oldCategory);
				}
				this.serviceId = id;
				query.id = id.toLowerCase();
				this._updateHash(query);
			}
		},
		
		_setSectionAttr: function(section){
			var query = this._getHashObj();
			if(!typeTest.isEqual(query.section, this.get("section"))){
				var oldSection = this._createItemClass(this.section);
				var newSection = this._createItemClass(section);
				this.section = section;
				query.section = section;
				domAttr.set(this.heading, "innerHTML", query.section);
				
				domClass.add(this.domNode, newSection);
				domClass.add(this.heading, newSection);
				domClass.add(this.searchForm.domNode, newSection);
				domClass.add(this.tooltipText, newSection);
				if(!typeTest.isBlank(oldSection)){
					domClass.remove(this.heading, oldSection);
					domClass.remove(this.domNode, oldSection);
					domClass.remove(this.searchForm.domNode, oldSection);
					domClass.remove(this.tooltipText, oldSection);
				}
				
				this.searchForm.set("section", query.section);
				this._updateHash(query);
			}
		},
		
		_setCategoryAttr: function(category){
			var query = this._getHashObj();
			if(!typeTest.isEqual(query.category, this.get("category"))){
				var oldCategory = this._createItemClass(this.category);
				this.category = category;
				domClass.add(this.domNode, this._createItemClass(this.category));
				if(!typeTest.isBlank(oldCategory)){
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
			if(!typeTest.isEqual(query.tag, this.get("tag"))){
				this.tag = tag;
				query.tag = tag;
				this._updateHash(query);
			}
		},
		
		_setPageTitleAttr: function(title){
			try{
				this.pageTitle = title;
				if(typeTest.isBlank(this.pageTitle)){
					domConstr.empty(this.titleNode);
				}else{
					domAttr.set(this.titleNode, "innerHTML", this.pageTitle);
				}
				
				this._changeHeadTitle(title);
			}catch(e){
				console.warn("pin.couldNotChangePageHeading");
			}
		},
		
		_changeHeadTitle: function(title){
			try{
				if(this.headTitleNode !== null){
					if(!typeTest.isBlank(title)){
						try{
							domAttr.set(this.headTitleNode, "innerHTML", title);
						}catch(e){
							window.document.title = title;
						}
					}else{
						var query = this._getHashObj();
						if(!typeTest.isBlank(query.section)){
							title = query.section;
							if(!typeTest.isBlank(query.category)){
								title += " > " + query.category;
								if(!typeTest.isBlank(query.tag)){
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
				console.warn("pin.couldNotChangePageTitle");
			}
		},
		
		_hashChange: function(cHash){
			profiler.reset();
			var query = this._getHashObj(cHash);
			
			if(!typeTest.isBlank(query.pageId)){
				this._hashChangeNewPageId(query);
			}else{
				this.contentPane.clear();
			}
			
			if(!typeTest.isBlank(query.search)){
				this._hashChangeNewSearch(query);
			}else if(!typeTest.isBlank(query.id)){
				this._hashChangeNewId(query);
			}else if(!typeTest.isBlank(query.section)){
				this._hashChangeNewSection(query);
			}else{
				this._hashChangeDefaultFallback(query);
			}
		},
		
		_hashChangeNewPageId: function(query){
			this.contentPane.set("pageId", query.pageId);
			this.sectionMenu.clear();
			
			if(typeTest.isBlank(query.section)){
				this.sectionMenu.clear();
			}else if(typeTest.isBlank(query.category) && typeTest.isBlank(query.id)){
				this.set("pageTitle","");
				if(query.pageId.length == 32){
					this.sectionMenu.clear();
				}
			}
		},
		
		_hashChangeNewSearch: function(query){
			this.hideButtonPanel();
			this.serviceDisplayer.clear();
			this.serviceListDisplayer.clear();
			this.sectionMenu.clear();
			this.contentPane.clear();
			
			if(!typeTest.isBlank(query.section)){
				this._displayMenu(query.section);
			}else{
				this._displayMenu("Adult Services");
				query.section = "Adult Services";
			}
			
			this._displaySearch(query.search);
		},
		
		_hashChangeNewId: function(query){
			this.showButtonPanel();
			this._setShortlistLabel();
				
			if(!typeTest.isBlank(query.section)){
				this._displayMenu(query.section);
				if(!typeTest.isEqual(query.section, this.get("section"))){
					this.set("section", query.section);
				}
			}
			
			this.serviceListDisplayer.clear();
			this.sectionMenu.clear();
			this.shortlist.clear();
			this.searchForm.clear();
				
			this._displayService(query.id.toLowerCase(), query.section);
			this.set("serviceId", query.id.toLowerCase());
		},
		
		_hashChangeNewSection: function(query){
			if(!typeTest.isEqual(query.section, this.get("section"))){
				this.set("section", query.section);
			}
			
			this.hideButtonPanel();
			this.serviceDisplayer.clear();
			this.searchForm.clear();
			
			if(!typeTest.isBlank(query.category)){
				this._hashChangeNewCategory(query);
			}else{
				this.serviceListDisplayer.clear();
				if(!typeTest.isBlank(query.pageId)){
					this._displayMenu(query.section);
				}else{
					this.sideMenu.clear();
					if(typeTest.isEqual(query.section,"shortlist")){
						this.contentPane.clear();
						this._hashChangeNewSectionIsShortlist();
					}else{
						this.shortlist.clear();
						this._displaySectionMenu(query.section);
						this.contentPane.set("pageId",query.section);
					}
				}
			}
		},
		
		_setNodeStyle: function(nodeName, styleProp, styleValue){
			var node = ((typeTest.isString(nodeName)) ? this[nodeName] : nodeName);
			node = ((typeTest.isWidget(node)) ? node.domNode : node);
			
			domStyle.set(node, styleProp, styleValue);
			
			try{
				node.parentNode.style.cssText += "";
				node.parentNode.style.zoom = 1;
				node.style.cssText += "";
				node.style.zoom = 1;
			}catch(e){}
		},
		
		_setVisibility: function(nodeName, visibility){
			if(visibility === undefined){
				nodeName = ((typeTest.isString(nodeName)) ? this[nodeName] : nodeName);
				nodeName = ((typeTest.isWidget(nodeName)) ? nodeName.domNode : nodeName);
			
				visibility = (
					(typeTest.isEqual(domStyle.get(nodeName, "visibility"), "hidden"))
				? "visible" : "hidden");
			}
			
			this._setNodeStyle(nodeName, "visibility", visibility);
		},
		
 		_hashChangeNewCategory: function(query){
			this._setPageTitleAttr("Loading...");
			this._setVisibility("serviceListDisplayer", "hidden");
			this.sectionMenu.clear();
			this.searchForm.clear();
			this.shortlist.clear();
			
			if(this._currentDeferred !== null){
				this._currentDeferred.cancel();
			}
			
			this._currentDeferred = interval.priorityAdd(lang.hitch(this, function(){
				if(!typeTest.isEqual(query.category, this.get("category"))){
					this.set("category", query.category);
				}
				if(!typeTest.isEqual(query.tag, this.get("tag"))){
					this.set("tag", query.tag);
				}
				if(!typeTest.isBlank(query.section)){
					this._displayMenu(query.section);
				}
				this.contentPane.set(
					"pageId", query.section, query.category
				);
			
				this._displayCategoryList(
					query.section, query.category, query.tag
				);
				
				this._setVisibility("serviceListDisplayer", "visible");
				this._currentDeferred = null;
			}));
		},
		
		_hashChangeNewSectionIsShortlist: function(){
			var shortlist = this.store.getShortlist();
			if(typeTest.isProperty(shortlist, "services")){
				this.set("pageTitle", "");
				this.sectionMenu.clear();
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
			
			if(!typeTest.isBlank(hash.id)){
				if(this.store.inShortlist(hash.id)){
					this.manageShortlistButton.set(
						"label", "Remove from shortlist"
					);
					domAttr.set(
						this.tooltipText,
						"innerHTML",
						"Remove this item from the shortlist."
					);
				}else{
					this.manageShortlistButton.set(
						"label", "Add to shortlist"
					);
					domAttr.set(
						this.tooltipText,
						"innerHTML",
						"Add to your shortlist so you can print and compare services.  Items will remain in your shortlist until you remove them, allowing you to save information to look at later."
					);
				}
			}else{
				if(typeTest.isEqual(hash.section, "shortlist")){
					this.manageShortlistButton.set(
						"label", "Empty shortlist"
					);
					domAttr.set(
						this.tooltipText,
						"innerHTML",
						"Remove all items from the shortlist."
					);
				}
			}
			
			this.manageShortlistButton.startup();
		},
		
		_shortlistClick: function(){
			var hash = this._getHashObj();
			
			if(!typeTest.isBlank(hash.id)){
				if(this.store.inShortlist(hash.id)){
					this.store.removeFromShortlist(hash.id);
					this._setShortlistLabel();
				}else{
					this.store.addToShortlist(hash.id);
					this._setShortlistLabel();
				}
			}else{
				if(typeTest.isEqual(hash.section, "shortlist")){
					this.store.emptyShortlist();
					this.hideButtonPanel();
				}
			}
		},
		
		_getHashObj: function(cHash){
			try{
				if(!typeTest.isObject(cHash) || typeTest.isBlank(cHash)){
					cHash = ((cHash == undefined) ? hash() : cHash);
					cHash = ioQuery.queryToObject(cHash);
				}else{
				}
				
				return this._sanitizeHashObject(cHash);
			}catch(e){
				console.warn("pin.couldNotGetHash");
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
				console.warn("pin.couldNotSanitizeHash");
				return this._blankHashValue;
			}
		},
		
		_addPropertyToObject: function(obj, propName, defaultValue){
			try{
				if(!typeTest.isBlank(propName) && !typeTest.isBlank(obj)){
					defaultValue = ((defaultValue === undefined) ? "" : defaultValue);
					obj[propName] = ((typeTest.isProperty(obj, propName)) ? obj[propName] : defaultValue);
					
				}
			}catch(e){
				console.warn("pin.failedToAddProperty",{"propertyName": propName});
			}
			
			return obj;
		},
		
		_displayCategoryList: function(section, category, tag){
			this.serviceListDisplayer.set("section", section);
			tag = (tag === undefined) ? "" : tag;
			
			this.serviceListDisplayer.set("category", category);
			this.serviceListDisplayer.set("tag", tag);
			
			var self = this;
			if(typeTest.isBlank(tag)){
				var services = self.store.getCategory(section, category);
				self.serviceListDisplayer.set("value", services);	
				var tags = self.store.getTagsList(section, category);
				self.serviceListDisplayer.set("tags", tags);
			}else{
				var services = self.store.getTag(section, category, tag);
				self.serviceListDisplayer.set("value", services);
				self.serviceListDisplayer.set("tags", []);
			}
		},
		
		_displaySearch: function(search){
			var cHash = this._getHashObj(cHash);
			if(typeTest.isBlank(search)){
				cHash.search = "";
				this._hashChange(cHash);
			}else{
				this.contentPane.clear();
				this._doSearch(search, this.section, lang.hitch(this, function(query){
					var info = "Found "+query.length.toString()+" items for search: <b>\""+search+"\"</b>";
					var title = "Search Results: \""+search+"\"";
			
					if(!typeTest.isBlank(cHash.section)){
						if(!typeTest.isEqual(cHash.section, "Family Services") && !typeTest.isEqual(cHash.section, "Adult Services")){
							this._displayMenu("Adult Services");
						}else{
							this._displayMenu(cHash.section);
							info += ", in: <b>"+cHash.section+"</b>";
						}
					}
				
					this.serviceDisplayer.clear();
					this.sectionMenu.clear();
					this.shortlist.clear();
				
					this.serviceListDisplayer.set("category", title);
					this.serviceListDisplayer.set("value", query);
					this.serviceListDisplayer.set("tags", []);
					this.serviceListDisplayer.addMessage("<p>"+info+".</p>");
				}));
			}
		},
		
		"_doSearchId": 0,
		_doSearch: function(search, section, callback){
			var id = Math.floor((Math.random()*1000000000000)+1);
			this._doSearchId = id;
			
			if(search !== ""){
				this._setPageTitleAttr("Loading...");
				this._setVisibility("serviceListDisplayer", "hidden");
				this.sectionMenu.clear();
				this.shortlist.clear();
				
				var self = this;
				interval.priorityAdd(function(){
					if(id === self._doSearchId){
						callback(self.store.searchServices(search, section));
					}
					
					self._setVisibility("serviceListDisplayer", "visible");
				});
			}else{
				callback([], section);
			}
		},
		
		_displaySectionMenu: function(section){
			var categories = this.store.getCategoryList(section);
			this.sectionMenu.set("section", section);
			this.sectionMenu.set("value", categories);
		},
		
		_displayService: function(id, section){
			var service = this.store.getService(id);
			
			if(!typeTest.isBlank(service)){
				if(typeTest.isBlank(section)){
					this._setServiceHash(service, false);
				}
				
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
		
		_setServiceHash: function(service, updateHistory){
			updateHistory = ((updateHistory == undefined) ? true : updateHistory);
			
			var query = this._getHashObj();
			var ASD = this._getCategorySize(service, "category1");
			var FSD = this._getCategorySize(service, "category2");
			
			if(FSD > ASD){
				query.section = "Family Services";
			}else{
				query.section = "Adult Services";
			}
			
			this._updateHash(query, updateHistory);
		},
		
		_getCategorySize: function(service, section){
			if(typeTest.isObject(service)){
				if(typeTest.isProperty(service, "data")){
					service = service.data;
				}
			}else{
				return 0;
			}
			
			if(typeTest.isProperty(service, section)){
				if(typeTest.isArray(service[section])){
					return service[section].length;
				}else{
					return 1;
				}
			}
			
			return 0
		},
		
		//"_updateHashDeferred": null,
		_updateHash: function(query, updateHistory){
			updateHistory = ((updateHistory == undefined) ? true : updateHistory);
			var newQuery = {};
			for(var key in query){
				if(!typeTest.isBlank(query[key])){
					newQuery[key] = query[key];
				}
			}
			newQuery = ioQuery.objectToQuery(newQuery);
			//if(this._updateHashDeferred !== null){
				//this._updateHashDeferred.cancel();
			//}
			//interval.add(function(){
				hash(newQuery, !updateHistory);
				//this._updateHashDeferred = null;
			//});
			this._previousHash = newQuery;
		},
		
		_parseCategory: function(service, section){
			section = (typeTest.isEqual(section,"Family Services")) ? 1 : 2;
			var fieldName = "category" + section.toString();
			
			if(typeTest.isProperty(service, fieldName)){
				if(!typeTest.isArray(service[fieldName])){
					if(typeTest.isBlank(service[fieldName])){
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
				if(!typeTest.isBlank(item)){
					newAry.push(item);
				}
			}, this);
			
			return newAry;
		},
		
		_shortlistUpdate: function(shortlist){
			if(typeTest.isElement(this.shortlistCounterNode)){
				var counter = 0;
				if(typeTest.isProperty(shortlist, "services")){
					counter = shortlist.services.length;
				}
				domAttr.set(
					this.shortlistCounterNode,
					"innerHTML",
					counter.toString()
				);
			}
			
			var query = this._getHashObj();
			if(typeTest.isEqual(query.section, "shortlist")){
				this.shortlist.set("value", shortlist.services);
			}
		},
		
		_serviceDataUpdate: function(id, data){
			if(!typeTest.isBlank(id)){
				var query = this._getHashObj();
				
				if(typeTest.isEqual(query.id, id)){
					this._displayService(query.id)
				}
			}
		},
		
		_getField: function(data, fieldName){
			var value = ""
			
			if(typeTest.isProperty(data, fieldName)){
				value = data[fieldName];
			}
			
			if(typeTest.isString(value)){
				value = lang.trim(value);
			}
			
			return value;
		}
	});
	
	return construct;
});