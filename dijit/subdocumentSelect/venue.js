define([
	"dojo/_base/declare",
	"../subdocumentSelect",
	"dojo/on",
	"dojo/_base/lang"
], function(
	declare, _subDocumentSelect, on, lang
){
	"use strict";
	
	var construct = declare([_subDocumentSelect], {
		
		__init: function(dia){
			var itemList = dia.getWidget2("itemList");
			
			on(
				itemList.domNode,
				"additem",
				lang.hitch(this, this._newVenueAdded, dia)
			);
		},
		
		_newVenueAdded: function(dia, event){
			var valueLabelWidget = dia.getWidget2("valueLabel");
			var itemList = dia.getWidget2("itemList");
			var values = itemList.get("value");
			for(var id in values){
				valueLabelWidget.set("value",values[id].name);
			}
		}
	});
	
	return construct;
});