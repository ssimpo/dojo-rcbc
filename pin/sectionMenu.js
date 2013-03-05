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
	"dojo/i18n!./nls/sectionMenu",
	"dojo/text!./views/sectionMenu.html",
	"dojo/dom-construct",
	"dojo/io-query",
	"dojo/_base/array",
	"dojo/dom-class",
	"dojo/topic",
	"simpo/typeTest"
], function(
	declare, _widget, _templated, _wTemplate, _listItems, i18n, strings, template,
	domConstr, ioQuery, array, domClass, topic, typeTest
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
		"parentPosPlace": "after",
		
		"_sectionItemsShowing": {},
		
		_initNodes: function(){
			if(this.application !== null){
				if(this.parentNode === null){
					this.parentNode = this.application.hiddenDiv;
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
				this._createTitle();
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
		
		_createTitle: function(){
			try{
				var title = "";
				topic.publish("/rcbc/pin/titleChange", title);
			}catch(e){
				console.warn("Could not create a title for the current section");
			}
			
			return title;
		},
		
		_parseMenuData: function(value){
			if(!typeTest.isBlank(value)){
				var itemsShowing = new Object();
				
				value = value.sort(function(a, b){
					return ((a.title < b.title) ? -1 : 1);
				});
				
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
						id, this.containerNode, this._sectionItemsShowing
					);
				}, this);
				
				this._hideNonItemsListedItems(
					itemsShowing, this._sectionItemsShowing, this.hiddenList
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
				
				return menu;
			}
			
			return value;
		}
	});
	
	return construct;
});