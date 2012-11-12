define([
	"dojo/_base/declare",
	"./checkWithDetails",
	"./radioGrid",
	"dojo/dom-construct",
	"dojo/dom-style"
], function(
	declare, _checkWithDetails, Radio, domConstr, domStyle
){
	"use strict";
	
	var construct = declare([_checkWithDetails], {
		"_radios": {},
		
		postCreate: function(){
			this._init();
			
			this._radios = new Radio({
				"values": [ 'Male', 'Female' ]
			});
			
			domConstr.place(
				this._radios.domNode,
				this.moreDetailsNode.domNode,
				"replace"
			);
			this.moreDetailsNode = this._radios;
		}
	});
	
	return construct;
});