// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dojo/dom-construct",
	"simpo/typeTest",
	"dojo/_base/lang",
	"dojo/dom-class"
], function(
	declare, domConstr, typeTest, lang, domClass
) {
	"use strict";
	
	var construct = declare(null, {
		"_cache": {},
		
		_createItem: function(itemData){
			var li = domConstr.create("li", {});
			this._cache[itemData.id.toLowerCase()] = li;
			
			domConstr.create("a", {
				"innerHTML": itemData.title,
				"href": itemData.href
			}, li);
			
			if(typeTest.isProperty(itemData, "class")){
				domClass.add(li, itemData["class"])
			}
			
			return li;
		},
		
		_placeItem: function(id, parentNode, showingLog){
			id = id.toLowerCase();
			var li = this._cache[id];
			showingLog[id] = true;
			domConstr.place(li, parentNode);
		},
		
		_hideNonItemsListedItems: function(currentItems, allItems, hiddenList){
			for(var id in allItems){
				if((allItems[id]) && (!typeTest.isProperty(currentItems, id))){
					allItems[id] = false;
					domConstr.place(this._cache[id], hiddenList);
				}
			}
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
		
		_createItemClass: function(title){
			title = title.replace(/ \& | and /g," ");
			title = title.replace(/ /g,"-");
			
			return title.toLowerCase();
		}
	});
	
	return construct;
});