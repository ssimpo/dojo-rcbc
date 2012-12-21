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
	"dojo/i18n!./nls/serviceListDisplayer",
	"dojo/text!./views/serviceListDisplayer.html",
	"dojo/_base/lang",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dojo/dom-class",
	"dojo/_base/array",
	"dojo/hash",
	"dojo/io-query",
	"dojo/topic",
	
	"rcbc/pin/expandingDiv"
], function(
	declare,
	_widget, _templated, _wTemplate, _variableTestMixin,
	i18n, strings, template,
	lang, domConstr, domAttr, domClass, array, hash, ioQuery, topic
){
	"use strict";
	
	var construct = declare([
		_widget, _templated, _wTemplate, _variableTestMixin
	],{
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
		
		"application": null,
		"parentNode": null,
		"hiddenNode": null,
		"parentPosPlace": "last",
		
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
			if(!this._isBlank(oldCategory)){
				domClass.remove(this.domNode, oldCategory);
			}
		},
		
		_setValueAttr: function(value){
			this._initNodes();
			
			this.value = value;
			if(this._isBlank(this.value)){
				if(this._isElement(this.serviceListNode) || this._isWidget(this.serviceListNode)){
					domConstr.empty(this.serviceListNode);
				}
				this._hideWidget();
			}else{
				this.loading(true);
				this._showWidget();
				this._createContent(value);
				this.loading(false);
			}
		},
		
		_setTagsAttr: function(value){
			this.tags = value;
			if(this._isBlank(this.tags)){
				if(this._isElement(this.tagListNode) || this._isWidget(this.tagListNode)){
					domConstr.empty(this.tagListNode);
				}
			}else{
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
		
		loading: function(isLoading){
			isLoading = ((isLoading === undefined) ? true : isLoading);
			if(isLoading){
				this._clear();
				domAttr.set(
					this.loadingNode, "innerHTML", "Loading please wait..."
				);
			}else{
				domAttr.set(
					this.loadingNode, "innerHTML", ""
				);
			}
		},
		
		_clear: function(){
			this._ifHasClear("serviceListNode");
			this._ifHasClear("tagListNode");
		},
		
		_ifHasClear: function(nodeName, destroy){
			destroy = ((destroy === undefined) ? false: destroy);
			if(this._isElement(this[nodeName]) || this._isWidget(this[nodeName])){
				if(destroy){
					domConstr.destroy(this[nodeName]);
					this[nodeName] = null;
				}else{
					if(this._isElement(this[nodeName])){
						domConstr.empty(this[nodeName]);
					}else{
						domConstr.empty(this[nodeName].domNode);
					}
				}
			}
		},
		
		_createAttachPoint: function(propName, tagName, constructor){
			constructor = ((constructor == undefined) ? {} : constructor);
			
			if(!this._isElement(this[propName]) && !this._isWidget(this[propName])){
				if(Object.prototype.toString.call(tagName) === '[object String]'){
					this[propName] = domConstr.create(
						tagName, constructor, this.domNode
					);
				}else{
					this[propName] = new tagName(constructor);
					if(this._isWidget(this[propName])){
						domConstr.place(this[propName].domNode, this.domNode);
					}
				}
			}else if((this._isWidget(this[propName])) && (Object.prototype.toString.call(tagName) !== '[object String]')){
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
			
				if(!this._isBlank(category)){
					title = category + ((this._isBlank(tag)) ? "" : ": " + tag);
					topic.publish("/rcbc/pin/titleChange", title);
				}
			
				
			}catch(e){
				console.warn("Could not create a title for the current category/tag");
			}
			
			return title;
		},
		
		_createContent: function(value){
			this._createTitle();
			this._createServiceList(value);
		},
		
		_createTagList: function(value){
			this._createTitle();
			this._createAttachPoint("tagListNode", "ul");
			domConstr.empty(this.tagListNode);
			
			if(!this._isBlank(value)){
				var tags = new Array();
				for(var tag in value){
					tags.push(tag);
				}
				tags.sort(function(a,b){
					return ((value[a] > value[b]) ? -1 : 1);
				});
				
				array.forEach(tags, function(tag){
					var li = domConstr.create("li", {}, this.tagListNode);
					
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
			this._createAttachPoint("serviceListNode", "ul");
			domConstr.empty(this.serviceListNode);
			
			if(!this._isBlank(value)){
				array.forEach(value, function(service){
					var li = domConstr.create("li", {}, this.serviceListNode);
					var title = this._getTitle(service.data);
					
					domConstr.create("a", {
						"innerHTML": title,
						"href": service.data.href
					}, li);
				}, this);
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
		
		_getField: function(data, fieldName){
			if(fieldName == undefined){
				fieldName = data;
				data = this.value;
			}
			
			var value = ""
			
			if(this._hasProperty(data, fieldName)){
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