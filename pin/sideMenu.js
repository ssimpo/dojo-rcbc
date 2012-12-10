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
	"dojo/i18n!./nls/sideMenu",
	"dojo/text!./views/sideMenu.html",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dojo/dom-class"
], function(
	declare,
	_widget, _templated, _wTemplate, _variableTestMixin,
	i18n, strings, template,
	lang, array, domConstr, domClass
){
	"use strict";
	
	var construct = declare([
		_widget, _templated, _wTemplate,  _variableTestMixin
	], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"data": [],
		"section": "",
		
		"_updateUrl": "/test/stephen/pin.nsf/getMenu?openagent",
		
		_setDataAttr: function(data){
			domConstr.empty(this.domNode);
			this._parseMenuData(data);
			this.data = data;
		},
		
		_setSectionAttr: function(section){
			this._updateClass(
				this._createItemClass(section),
				this._createItemClass(this.section)
			);
			this.section = section;
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
		
		_parseMenuData: function(data){
			if(!this._isBlank(data)){
				array.forEach(data, function(item){
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
		}
	});
	
	return construct;
});