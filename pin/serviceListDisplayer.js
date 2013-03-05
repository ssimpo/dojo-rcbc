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
	"dojo/i18n!./nls/serviceListDisplayer",
	"dojo/text!./views/serviceListDisplayer.html",
	"dojo/i18n!dijit/nls/loading",
	"dojo/_base/lang",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dojo/dom-class",
	"dojo/_base/array",
	"dojo/hash",
	"dojo/io-query",
	"dojo/topic",
	"simpo/typeTest",
	"dojo/query",
	"simpo/interval",
	"rcbc/pin/expandingDiv"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template,
	loadingStrings, lang, domConstr, domAttr, domClass, array, hash, ioQuery,
	topic, typeTest, $, interval
){
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate],{
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"value": [],
		"tags": {},
		"section": "",
		"category": "",
		"tag": "",
		"sortTagsByAZ": true, // false will sort by quanity in each tag.
		
		"application": null,
		"parentNode": null,
		"hiddenNode": null,
		"serviceListWidget": null,
		"parentPosPlace": "last",
		"i18nLoading": loadingStrings,
		"_cache": {},
		"_loadingMessageIsShowing": false,
		"_itemsShowing": {},
		
		postCreate: function(){
			/*var displayer = new pagedColumnList({
				"columnTagName": "ul",
				"cols": 2,
				"gap": 10,
				"class": "rcbcWidgetsServicListDisplayerServices"
			});
			domConstr.place(displayer.domNode, this.domNode);
			this.serviceListNode = displayer.domNode;
			this.serviceListWidget = displayer;*/
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
			}
		},
		
		_showWidget: function(){
			if(this.parentNode !== null){
				domConstr.place(
					this.domNode, this.parentNode, this.parentPosPlace
				);
			}
		},
		
		_setCategoryAttr: function(category){
			var oldCategory = this._createItemClass(this.category);
			this.category = category;
			domClass.add(this.domNode, this._createItemClass(this.category));
			if(!typeTest.isBlank(oldCategory)){
				domClass.remove(this.domNode, oldCategory);
			}
		},
		
		_setValueAttr: function(value){
			this._initNodes();
			
			this.value = value;
			if(typeTest.isBlank(this.value)){
				if(typeTest.isElement(this.serviceListNode) || typeTest.isWidget(this.serviceListNode)){
					this._clearServiceList();
				}
				this._hideWidget();
			}else{
				//this.loading(true);
				this._showWidget();
				this._createContent(value);
				//this.loading(false);
			}
		},
		
		_setTagsAttr: function(value){
			this.tags = value;
			if(typeTest.isBlank(this.tags)){
				if(typeTest.isElement(this.tagListNode) || typeTest.isWidget(this.tagListNode)){
					domConstr.place(
						this.expandingDiv.domNode,
						this.hiddenDiv
					);
					domConstr.empty(this.tagListNode);
				}
			}else{
				domConstr.place(
					this.expandingDiv.domNode,
					this.infoNode,
					"after"
				);
				this._createTagList(value);
			}
		},
		
		clear: function(){
			this.set("value", []);
			this.set("tags", []);
			this.set("section", "");
			this.set("category", "");
			this.set("tag", "");
		},
		
		addMessage: function(message){
			domAttr.set(
				this.infoNode,
				"innerHTML",
				message
			);
		},
		
		clearMessage: function(){
			domAttr.set(
				this.infoNode,
				"innerHTML",
				""
			);
		},
		
		loading: function(isLoading){
			isLoading = ((isLoading === undefined) ? true : isLoading);
			if(isLoading){
				if(!this._loadingMessageIsShowing){
					this._loadingMessageIsShowing = true;
					//this._clear();
					//domAttr.set(
						//this.infoNode,
						//"innerHTML",
						//loadingStrings.loadingState
					//);
					topic.publish(
						"/rcbc/pin/titleChange",
						loadingStrings.loadingState
					);
					
				}
			}else{
				this._loadingMessageIsShowing = false;
				//this.clearMessage();
			}
		},
		
		_clear: function(){
			this._clearServiceList();
			this._ifHasClear("tagListNode");
			this.clearMessage();
		},
		
		_clearServiceList: function(){
			if(this.serviceListNode !== null){
				for(var id in this._itemsShowing){
					if(this._itemsShowing[id]){
						domConstr.place(this._cache[id], this.hiddenList);
					}
				}
			}
		},
		
		_ifHasClear: function(nodeName, destroy){
			destroy = ((destroy === undefined) ? false: destroy);
			if(typeTest.isElement(this[nodeName]) || typeTest.isWidget(this[nodeName])){
				if(destroy){
					domConstr.destroy(this[nodeName]);
					this[nodeName] = null;
				}else{
					if(typeTest.isElement(this[nodeName])){
						domConstr.empty(this[nodeName]);
					}else{
						domConstr.empty(this[nodeName].domNode);
					}
				}
			}
		},
		
		_createAttachPoint: function(propName, tagName, constructor){
			constructor = ((constructor == undefined) ? {} : constructor);
			
			if(!typeTest.isElement(this[propName]) && !typeTest.isWidget(this[propName])){
				if(Object.prototype.toString.call(tagName) === '[object String]'){
					this[propName] = domConstr.create(
						tagName, constructor, this.domNode
					);
				}else{
					this[propName] = new tagName(constructor);
					if(typeTest.isWidget(this[propName])){
						domConstr.place(this[propName].domNode, this.domNode);
					}
				}
			}else if((typeTest.isWidget(this[propName])) && (Object.prototype.toString.call(tagName) !== '[object String]')){
				try{
					for(var key in constructor){
						this[propName].set(key, constructor[key]);
					}
				}catch(e){}
			}
		},
		
		_createTitle: function(){
			try{
				var category = this.get("category");
				var tag = this.get("tag");
				var title = "";
			
				if(!typeTest.isBlank(category)){
					if(/^[A-Fa-f0-9]{32,32}$/.test(category)){
						var item = this.application.store.get(category.toLowerCase());
						title = this._getServiceTitle(item);
						if(title !== ""){
							topic.publish("/rcbc/pin/titleChange", title);
						}
					}else{
						title = category + ((typeTest.isBlank(tag)) ? "" : ": " + tag);
						topic.publish("/rcbc/pin/titleChange", title);
					}
				}
			
				
			}catch(e){
				console.warn("Could not create a title for the current category/tag");
			}
			
			return title;
		},
		
		_getServiceTitle: function(item){
			var title = "";
			
			if(this._isServiceType(item)){
				if(typeTest.isProperty(item, "data")){
					
					var serviceTitle = this._getField(item.data, "serviceName");
					var orgTitle = this._getField(item.data, "orgName");
					
					if((serviceTitle === "") && (orgTitle !== "")){
						title = orgTitle;
					}else if((serviceTitle !== "") && (orgTitle !== "")){
						title = serviceTitle + " ("+orgTitle+")";
					}else if(serviceTitle !== ""){
						title = serviceTitle;
					}else{
						title = this._getField(item.data, "title");
					}
					
					console.log(serviceTitle, orgTitle, title);
				}
			}
			
			return title;
		},
		
		_isServiceType: function(item){
			var isService = false;
			
			if(!typeTest.isBlank(item)){
				if(typeTest.isProperty(item, "type")){
					if(item.type == "service"){
						isService = true;
					}
					
				}
			}
			
			return isService;
		},
		
		_createContent: function(value){
			this._createServiceList(value);
			this._createTitle();
		},
		
		_createTagList: function(value){
			this._createTitle();
			this._createAttachPoint("tagListNode", "ul");
			domConstr.empty(this.tagListNode);
			
			if(!typeTest.isBlank(value)){
				var tags = new Array();
				for(var tag in value){
					if(!typeTest.isBlank(tag)){
						tags.push(tag);
					}
				}
				
				if(this.sortTagsByAZ){
					tags.sort();
				}else{
					tags.sort(function(a,b){
						return ((value[a] > value[b]) ? -1 : 1);
					});
				}
				
				array.forEach(tags, function(tag){
					var li = domConstr.create(
						"li", {}, this.tagListNode
					);
					
					domConstr.create("a", {
						"innerHTML": tag + " ("+value[tag].toString()+")",
						"href": this._createTagHref(tag)
					}, li);
				}, this);
				
				this.expandingDiv.setHeader("Filter services:");
			}else{
				this.expandingDiv.setHeader("");
			}
		},
		
		_createTagHref: function(tag){
			var hashQuery = ioQuery.queryToObject(hash());
			var href = location.href.replace(/^.*\/\/[^\/]+/, '').split("#");
			
			hashQuery.tag = tag;
			href = href[0]+"#"+ioQuery.objectToQuery(hashQuery);
			
			return href;
		},
		
		_createServiceList: function(value){
			var itemsShowing = new Object();
			this._createAttachPoint("serviceListNode", "ul");
			//domConstr.empty(this.serviceListNode);
			//if(this.serviceListWidget !== null){
				//this.serviceListWidget.clear();
			//}
			
			if(!typeTest.isBlank(value)){
				array.forEach(value, function(service){
					var li = null;
					if(typeTest.isProperty(this._cache, service.id)){
						li = this._cache[service.id];
					}else{
						li = domConstr.create("li", {});
						this._cache[service.id] = li;
						var title = this._getTitle(service.data);
					
						domConstr.create("a", {
							"innerHTML": title,
							"href": service.data.href + "&section=" + this.section
						}, li);
					}
					
					if(li !== null){
						itemsShowing[service.id] = true;
						this._itemsShowing[service.id] = true;
						domConstr.place(this._cache[service.id], this.serviceListNode);
					}	
				}, this);
				
				for(var id in this._itemsShowing){
					if((this._itemsShowing[id]) && (!typeTest.isProperty(itemsShowing, id))){
						this._itemsShowing[id] = false;
						domConstr.place(this._cache[id], this.hiddenList);
					}
				}
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
			}else if(serviceTitle !== ""){
				title = serviceTitle;
			}else{
				title = this._getField(value, "title");
			}
			
			return title;
		},
		
		_getField: function(data, fieldName){
			if(fieldName == undefined){
				fieldName = data;
				data = this.value;
			}
			
			var value = ""
			
			if(typeTest.isProperty(data, fieldName)){
				value = data[fieldName];
			}
			
			return lang.trim(value);
		},
		
		_createItemClass: function(category){
			category = category.replace(/ \& | and /g," ");
			category = category.replace(/ /g,"-");
			
			return category.toLowerCase();
		}
	});
	
	return construct;
});