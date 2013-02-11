define([
	"dojo/_base/declare",
	"./checkWithDetails",
	"./checkboxGrid",
	"dojo/dom-construct",
	"dojo/dom-style"
], function(
	declare, _checkWithDetails, CheckboxGrid , domConstr, domStyle
){
	"use strict";
	
	var construct = declare([_checkWithDetails], {
		"_checkboxes": {},
		"values": [],
		"cols": 0,
		
		postCreate: function(){
			this._init();
			
			this._checkboxes = new CheckboxGrid({
				"values": this.values,
				"cols": this.cols
			});
			
			domConstr.place(
				this._checkboxes.domNode,
				this.moreDetailsNode.domNode,
				"replace"
			);
			this.moreDetailsNode = this._checkboxes;
		}
	});
	
	return construct;
});