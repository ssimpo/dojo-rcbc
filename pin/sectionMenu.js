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
	"dojo/i18n!./nls/sectionMenu",
	"dojo/text!./views/sectionMenu.html",
	"dojo/dom-construct",
	"dojo/io-query",
	"dojo/_base/array",
	"dojo/dom-class"
], function(
	declare, _widget, _templated, _wTemplate, _variableTestMixin,
	i18n, strings, template,
	domConstr, ioQuery, array, domClass
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
		
		"value": [],
		"section": "",
		
		"application": null,
		"parentNode": null,
		"hiddenNode": null,
		"parentPosPlace": "after",
		
		_initNodes: function(){
			if(this.parentNode === null){
				this.parentNode = this.application.hiddenDiv;
			}
			if(this.hiddenNode === null){
				this.hiddenNode = this.application.hiddenDiv;
			}
			
		},
		
		clear: function(){
			this.set("value",[]);
		},
		
		_setValueAttr: function(value){
			this._initNodes();
			
			domConstr.empty(this.domNode);
			if(this._isBlank(value)){
				domConstr.place(
					this.domNode,
					this.hiddenNode
				);
			}else{
				domConstr.place(
					this.domNode,
					this.parentNode,
					this.parentPosPlace
				);
				value = this._parseValue(value);
				this._parseMenuData(value);
			}
			
			this.value = value;
		},
		
		_setSectionAttr: function(section){
			this._updateClass(
				this._createItemClass(section),
				this._createItemClass(this.section)
			);
			this.section = section;
		},
		
		_parseMenuData: function(value){
			if(!this._isBlank(value)){
				array.forEach(value, function(item){
					var listitem = this._createItem(item);
					if(!this._isBlank(listitem)){
						domConstr.place(listitem, this.domNode);
					}
				}, this);
			}
		},
		
		_createItem: function(item){
			var li = domConstr.create("li", {
				"class": this._createItemClass(item.title)
			});
			domConstr.create("a", {
				"innerHTML": item.title,
				"href": item.href
			}, li);
			
			return li;
		},
		
		_createItemClass: function(title){
			title = title.replace(/ \& | and /g," ");
			title = title.replace(/ /g,"-");
			
			return title.toLowerCase();
		},
		
		_updateClass: function(nClass, oldClass){
			if(nClass !== oldClass){
				if(!this._isBlank(nClass)){
					if(!this._isBlank(oldClass)){
						domClass.remove(this.domNode, oldClass);
					}
					
					domClass.add(this.domNode, nClass);
				}
			}
		},
		
		_parseValue: function(value){
			var menu = new Array();
			var href = location.href.replace(/^.*\/\/[^\/]+/, '').split("#");
			href = href[0];
			
			if(this._isObject(value)){
				for(var key in value){
					
					menu.push({
						"title": key,
						"href": href + "#" + ioQuery.objectToQuery({
							"section": this.section,
							"category": key
						})
					});
					
				}
				
				return menu;
			}
			
			return value;
		}
	});
	
	return construct;
});