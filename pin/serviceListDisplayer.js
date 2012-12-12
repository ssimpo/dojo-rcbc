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
	"dojo/_base/array",
], function(
	declare,
	_widget, _templated, _wTemplate, _variableTestMixin,
	i18n, strings, template,
	lang, domConstr, domAttr, array
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
		
		_setTitleAttr: function(value){
			this.title = value;
			this._createTitle(value);
		},
		
		_setValueAttr: function(value){
			this.value = value;
			if(this._isBlank(this.value)){
				this.set("title", "");
				if(this._isElement(this.serviceListNode) || this._isWidget(this.serviceListNode)){
					domConstr.empty(this.serviceListNode);
				}
			}else{
				this._createContent(value);
			}
		},
		
		clear: function(){
			this.set("value",[]);
		},
		
		_clear: function(){
			this._ifHasClear("titleNode", true);
			this._ifHasClear("serviceListNode");
		},
		
		_ifHasClear: function(nodeName, destroy){
			destroy = ((destroy === undefined) ? false: destroy);
			if(this._isElement(this[nodeName]) || this._isWidget(this[nodeName])){
				if(destroy){
					domConstr.destroy(this[nodeName]);
					this[nodeName] = null;
				}else{
					domConstr.empty(this[nodeName]);
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
		
		_createContent: function(value){
			this._createServiceList(value);
		},
		
		_createTitle: function(value){
			if(this._isBlank(value)){
				if(this._isElement(this.titleNode) || this._isWidget(this.titleNode)){
					domConstr.destroy(this.titleNode);
				}
				return null;
			}else{
				this._createAttachPoint("titleNode", "h1");
				domConstr.place(this.titleNode, this.domNode, "first");
				domConstr.empty(this.titleNode);
			
				var title = this._getTitle(value);
				domAttr.set(this.titleNode, "innerHTML", this.title);
			
				return this.titleNode;
			}
			
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
			
			if(this._isBlank(title)){
				title = this._getField("title");
			}
			
			return title;
		},
		
		_getField: function(data, fieldName){
			if(fieldName == undefined){
				fieldName = data;
				data = this.value;
			}
			
			var value = ""
			
			if(data.hasOwnProperty(fieldName)){
				value = data[fieldName];
			}
			
			return lang.trim(value);
		}
	});
	
	return construct;
});