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
	"dojo/i18n!dijit/nls/loading",
	"dojo/text!./views/pin.html",
	"rcbc/console!./nls/errors",
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
	
	"rcbc/pin/ContentPane",
	"dijit/form/Button",
	"./pin/shortlist",
	"./pin/sectionMenu",
	"./pin/sideMenu",
	"./pin/serviceDisplayer",
	"./pin/serviceListDisplayer"
], function(
	declare,
	_widget, _templated, _wTemplate, _variableTestMixin,
	i18n, strings, loadingStrings, template, console,
	store, hash, topic, lang, ioQuery, request, array,
	domConstr, domAttr, domClass, domStyle, $, on, registry, string
){
	"use strict";
	
	var construct = declare([
		_widget, _templated, _wTemplate, _variableTestMixin
	], {
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
		
		"_blankHashValue": {
			"id": "",
			"section": "",
			"category": "",
			"tag": "",
			"search": "",
			"pageId": ""
		},
		
		
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
				this.store = new store();
				//uncomment to clear the localstorage.
				//this.store.clear(true);
			
				this._initTopicSubscriptions();
				this._initTitle();
				this._initHeading();
				this._initSearchForm();
			}catch(e){
				console.warn("pin.couldNotInit");
			}
		},
		
		_initTopicSubscriptions: function(){
			try{
				topic.subscribe(
					"/simpo/store/local/databaseReady",
					lang.hitch(this, this._databaseReady)
				);
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
				console.warn("pin.couldNotInitEvents");
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
				console.warn("pin.shortlistNotLoaded")
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
				if(this._isWidget(widget)){
					this.searchForm = widget;
					this.searchForm.application = this;
				}
			}
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
			}
		},
		
		_databaseReady: function(){
			this._initShortlist();
			this._initEvents();
			this._hashChange();
			this.loading(false);
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
				domAttr.set(this.heading, "innerHTML", query.section);
				this.searchForm.set("section", query.section);
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
				console.warn("pin.couldNotChangePageHeading");
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
				console.warn("pin.couldNotChangePageTitle");
			}
		},
		
		_hashChange: function(cHash){
			var query = this._getHashObj(cHash);
			
			if(!this._isBlank(query.pageId)){
				this._hashChangeNewPageId(query);
			}else{
				this.contentPane.clear();
			}
			
			if(!this._isBlank(query.search)){
				this._hashChangeNewSearch(query);
			}else if(!this._isBlank(query.id)){
				this._hashChangeNewId(query);
			}else if(!this._isBlank(query.section)){
				this._hashChangeNewSection(query);
			}else{
				this._hashChangeDefaultFallback(query);
			}
		},
		
		_hashChangeNewPageId: function(query){
			this.contentPane.set("pageId", query.pageId);
			if(this._isBlank(query.section)){
				this.sectionMenu.clear();
			}else if(this._isBlank(query.category) && this._isBlank(query.id)){
				this.set("pageTitle","");
			}
		},
		
		_hashChangeNewSearch: function(query){
			this.hideButtonPanel();
			this.serviceDisplayer.clear();
			this.serviceListDisplayer.clear();
			this.sectionMenu.clear();
			
			if(!this._isBlank(query.section)){
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
				
			if(!this._isBlank(query.section)){
				this._displayMenu(query.section);
			}
			
			//if(!this._isEqual(query.id, this.get("serviceId"))){
				this.serviceListDisplayer.clear();
				this.sectionMenu.clear();
				this.shortlist.clear();
				this.searchForm.clear();
				
				this._displayService(query.id.toLowerCase());
				this.set("serviceId", query.id.toLowerCase());
			//}else{
			//}
		},
		
		_hashChangeNewSection: function(query){
			if(!this._isEqual(query.section, this.get("section"))){
				this.set("section", query.section);
			}
			
			this.hideButtonPanel();
			this.serviceDisplayer.clear();
			this.searchForm.clear();
			
			if(!this._isBlank(query.category)){
				this._hashChangeNewCategory(query);
			}else{
				this.serviceListDisplayer.clear();
				if(!this._isBlank(query.pageId)){
					this._displayMenu(query.section);
				}else{
					this.sideMenu.clear();
					if(this._isEqual(query.section,"shortlist")){
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
			this.contentPane.set(
				"pageId", query.section, query.category
			);
			this.sectionMenu.clear();
			this.searchForm.clear();
			this.shortlist.clear();
			this._displayCategoryList(
				query.section, query.category, query.tag
			);
		},
		
		_hashChangeNewSectionIsShortlist: function(){
			var shortlist = this.store.getShortlist();
			if(this._hasProperty(shortlist, "services")){
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
				if(!this._isObject(cHash) || this._isBlank(cHash)){
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
				if(!this._isBlank(propName) && !this._isBlank(obj)){
					defaultValue = ((defaultValue === undefined) ? "" : defaultValue);
					obj[propName] = ((this._hasProperty(obj, propName)) ? obj[propName] : defaultValue);
					
				}
			}catch(e){
				console.warn("pin.failedToAddProperty",{"propertyName": propName});
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
		
		_displaySearch: function(search){
			var cHash = this._getHashObj(cHash);
			if(this._isBlank(search)){
				cHash.search = "";
				this._hashChange(cHash);
			}else{
				var query = this._doSearch(search, this.section);
				var info = "Found "+query.length.toString()+" items for search: <b>\""+search+"\"</b>";
				var title = "Search Results: \""+search+"\"";
			
				if(!this._isBlank(cHash.section)){
					if(!this._isEqual(cHash.section, "Family Services") && !this._isEqual(cHash.section, "Adult Services")){
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
			}
		},
		
		_doSearch: function(search, section){
			var tests = this._parseSearch(search);
			var query = this.store.query(lang.hitch(this, function(obj){
				var type = this._getField(obj, "type");
				var data = this._getField(obj, "data");
				
				if((type == "service") && (!this._isBlank(data))){
					try{
						if(this._searchCategoryTest(data, section)){
							var searcher = JSON.stringify(data);
							return this._searchTest(searcher, tests);
						}
						return false;
					}catch(e){
						return false;
					}
				}
				return false;
			}));
			
			return query;
		},
		
		_searchCategoryTest: function(item, section){
			if(this._isEqual(section, "Family Services")){
				if(this._isBlank(item.category1)){
					return false;
				}
			}else if(this._isEqual(section, "Adult Services")){
				if(this._isBlank(item.category2)){
					return false;
				}
			}
			
			return true;
		},
		
		_searchTest: function(query, tests){
			var found = true;
			
			array.every(tests, function(test){
				if(!test.test(query)){
					found = false;
					return false;
				}
				return true;
			}, this);
			
			return found;
		},
		
		_parseSearch: function(search){
			var words = search.split(" ");
			var tests = new Array();
			array.forEach(words, function(word){
				tests.push(new RegExp("\\W"+word,"i"));
			}, this);
			return tests;
		},
		
		_displaySectionMenu: function(section){
			var categories = this.store.getCategoryList(section);
			this.sectionMenu.set("section", section);
			this.sectionMenu.set("value", categories);
		},
		
		_displayService: function(id){
			var service = this.store.getService(id);
			
			if(!this._isBlank(service)){
				this._setServiceHash(service, false);
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
			if(this._isObject(service)){
				if(this._hasProperty(service, "data")){
					service = service.data;
				}
			}else{
				return 0;
			}
			
			if(this._hasProperty(service, section)){
				if(this._isArray(service[section])){
					return service[section].length;
				}else{
					return 1;
				}
			}
			
			return 0
		},
		
		_updateHash: function(query, updateHistory){
			updateHistory = ((updateHistory == undefined) ? true : updateHistory);
			var newQuery = {};
			
			for(var key in query){
				if(!this._isBlank(query[key])){
					newQuery[key] = query[key];
				}
			}
			
			hash(ioQuery.objectToQuery(newQuery), !updateHistory);
		},
		
		_parseCategory: function(service, section){
			section = (this._isEqual(section,"Family Services")) ? 1 : 2;
			var fieldName = "category" + section.toString();
			
			if(this._hasProperty(service, fieldName)){
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
				if(this._hasProperty(shortlist, "services")){
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
			}
		},
		
		_getField: function(data, fieldName){
			var value = ""
			
			if(this._hasProperty(data, fieldName)){
				value = data[fieldName];
			}
			
			if(this._isString(value)){
				value = lang.trim(value);
			}
			
			return value;
		}
	});
	
	return construct;
});