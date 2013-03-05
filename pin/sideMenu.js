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
	"./_listItems",
	"dojo/i18n",
	"dojo/i18n!./nls/sideMenu",
	"dojo/text!./views/sideMenu.html",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dojo/dom-class",
	"dojo/io-query",
	"simpo/typeTest"
], function(
	declare, _widget, _templated, _wTemplate, _listItems, i18n, strings, template,
	lang, array, domConstr, domClass, ioQuery, typeTest
){
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate, _listItems], {
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
		"parentPosPlace": "last",
		
		"_categoryItemsShowing": {},
		
		_initNodes: function(){
			if(this.application !== null){
				if(this.parentNode === null){
					this.parentNode = this.application.asideNode;
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
		
		clear: function(){
			this.set("value",[]);
		},
		
		_setValueAttr: function(value){
			this._initNodes();
			
			if(typeTest.isBlank(value)){
				this._hideWidget();
			}else{
				this._showWidget();
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
		
		_parseValue: function(value){
			var menu = new Array();
			var href = location.href.replace(/^.*\/\/[^\/]+/, '').split("#");
			href = href[0];
			
			if(typeTest.isObject(value)){
				for(var key in value){
					
					menu.push({
						"title": key,
						"href": href + "#" + ioQuery.objectToQuery({
							"section": this.section,
							"category": key
						})
					});
					
				}
				
				return menu.sort(function(a, b){
					return ((a.title < b.title) ? -1 : 1);
				});
			}
			
			return value;
		},
		
		_updateClass: function(nClass, oldClass){
			if(nClass !== oldClass){
				if(!typeTest.isBlank(nClass)){
					if(!typeTest.isBlank(oldClass)){
						domClass.remove(this.domNode, oldClass);
					}
					
					domClass.add(this.domNode, nClass);
				}
			}
		},
		
		_parseMenuData: function(value){
			if(!typeTest.isBlank(value)){
				var itemsShowing = new Object();
				array.forEach(value, function(item){
					var id = this._getCategoryId(this.section, item.title);
					if(!typeTest.isProperty(this._cache, id)){
						var title = this._getCategoryTitle(item);
						
						this._createItem({
							"id": id,
							"href": this._getCategoryHref(item),
							"title": title,
							"class": this._createItemClass(title)
						});
					}
					
					itemsShowing[id] = true;
					
					this._placeItem(
						id, this.containerNode, this._categoryItemsShowing
					);
				}, this);
				
				this._hideNonItemsListedItems(
					itemsShowing, this._categoryItemsShowing, this.hiddenList
				);
			}
		},
		
		_getCategoryHref: function(item){
			return item.href;
		},
		
		_getCategoryTitle: function(item){
			return item.title;
		},
		
		_getCategoryId: function(section, category){
			var id = section + "_" + category;
			return id.toLowerCase();
		}
	});
	
	return construct;
});