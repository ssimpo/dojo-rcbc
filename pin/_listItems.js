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
	"dojo/dom-class",
	"dojo/dom-attr",
	"dojo/io-query"
], function(
	declare, domConstr, typeTest, lang, domClass, domAttr, ioQuery
) {
	"use strict";
	
	var construct = declare(null, {
		"_cache": {},
		
		_createItem: function(itemData){
			var li = domConstr.create("li", {});
			this._cache[itemData.id.toLowerCase()] = li;
			
			li.anchor = domConstr.create("a", {
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
			
			var href = domAttr.get(li.anchor, "href");
			var parts = href.split("#");
			if(parts.length > 0){
				var hash = ioQuery.queryToObject(parts[1]);
				hash.section = this.section;
				domAttr.set(
					li.anchor, "href", parts[0]+"#"+ioQuery.objectToQuery(hash)
				);
			}
			
			domConstr.place(li, parentNode);
			
			return li;
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