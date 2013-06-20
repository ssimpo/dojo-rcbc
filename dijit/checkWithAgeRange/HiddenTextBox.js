// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dijit/form/TextBox"
], function(
	declare, TextBox
) {
	"use strict";
	
	var construct = declare([TextBox], {
		"moreDetailsNode": null,
		
		_getValueAttr: function(){
			return this.moreDetailsNode[nodeName].get("value");
		},
		_setValueAttr: function(value){
			this.moreDetailsNode[nodeName].set("value",value);
			tx.value = value;
		}
	});
	
	return construct;
});