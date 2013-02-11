// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"../../_variableTestMixin",
	"dojo/dom-attr",
	"dojo/_base/lang",
	"dojo/dom-construct"
], function(
	declare, _widget, _variableTestMixin, domAttr, lang, domConstr
){
	"use strict";
	
	var construct = declare([_widget, _variableTestMixin], {
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
		}
	});
	
	return construct;
});