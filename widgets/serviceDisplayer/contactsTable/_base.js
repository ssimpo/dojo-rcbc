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
			if((value === null) || (value === undefined) || (value === "") || (value === false)){
				return true;
			}
			
			if(toString.call(value) === '[object String]'){
				if(lang.trim(value) === ""){
					return true;
				}
			}else if(Object.prototype.toString.call(value) === '[object Object]'){
				return (this._isEmptyObject(value) || this._isBlankObject(value));
			}else if(Object.prototype.toString.call(value) === '[object Array]'){
				if(value.length == 0){
					return true;
				}else{
					return this._isBlankArray(value);
				}
			}
			
			return false;
		},
		
		_isBlankArray: function(ary){
			for(var i = 0; i < ary.length; i++){
				if(!this._isBlank(ary[i])){
					return false;
				}
			}
			
			return true;
		},
		
		_isEmptyObject: function(obj){
			for(var key in obj){
				if(obj.hasOwnProperty(key)){
					return false;
				}
			}
			return true;
		},
		
		_isBlankObject: function(obj){
			for(var key in obj){
				if(!this._isBlank(obj[key])){
					return false
				}
			}
			
			return true;
		}
	});
	
	return construct;
});