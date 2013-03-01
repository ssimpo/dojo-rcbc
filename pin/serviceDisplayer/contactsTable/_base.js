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
	"dojo/dom-construct",
	"simpo/typeTest"
], function(
	declare, _widget, domAttr, lang, domConstr, typeTest
){
	"use strict";
	
	var construct = declare([_widget], {
		"type": "",
		"details": "",
		"description": "",
		"descriptionNode": null,
		
		_createDescription: function(){
			if(!typeTest.isBlank(this.description)){
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
			if(typeTest.isBlank(this.descriptionNode)){
				this.descriptionNode = domConstr.create("div", {
				}, this.detailsCell);
			}
		},
		
		_removeDescriptionNode: function(){
			if(!typeTest.isBlank(this.descriptionNode)){
				domConstr.destroy(this.descriptionNode);
				this.descriptionNode = null;
			}
		}
	});
	
	return construct;
});