// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dojo/dom-attr",
	"dojo/_base/lang",
	"dojo/dom-construct"
], function(
	declare, _widget, domAttr, lang, domConstr
) {
	"use strict";
	
	var construct = declare([_widget], {
		"type": "",
		"details": "",
		"description": "",
		"descriptionNode": null,
		
		_createDescription: function(){
			if(!this._isBlank(this.description)){
				this._addDescriptionNode();
				domAttr.set(
					this.descriptionNode,
					"innerHTML",
					lang.trim(this.description)
				);
			}else{
				this._removeDescriptionNode();
			}
		},
		
		_addDescriptionNode: function(){
			if(this._isBlank(this.descriptionNode)){
				this.descriptionNode = domConstr.create("div", {
				}, this.detailsCell);
			}
		},
		
		_removeDescriptionNode: function(){
			if(!this._isBlank(this.descriptionNode)){
				domConstr.destroy(this.descriptionNode);
				this.descriptionNode = null;
			}
		},
		
		_isBlank: function(value){
			if((value === null) || (value === undefined) || (value === "")){
				return true;
			}
			
			if(toString.call(value) === '[object String]'){
				if(lang.trim(value) === ""){
					return true;
				}
			}else if(Object.prototype.toString.call(value) === '[object Object]'){
				for(var key in map){
					if(map.hasOwnProperty(key)){
						return false;
					}
				}
				return true;
			}else if(Object.prototype.toString.call(value) === '[object Array]'){
				if(value.length == 0){
					return true;
				}
			}
			
			return false;
		}
	});
	
	return construct;
});