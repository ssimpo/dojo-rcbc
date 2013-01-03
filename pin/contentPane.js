// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dijit/layout/ContentPane",
	"dojo/dom-construct"
], function(
	declare, ContentPane, domConstr
) {
	"use strict";
	
	var construct = declare([ContentPane], {
		"application": null,
		"parentNode": null,
		"hiddenNode": null,
		"parentPosPlace": "after",
		
		"section": "",
		"category": "",
		"pageId": "",
		
		_initNodes: function(){
			if(this.application !== null){
				if(this.parentNode === null){
					this.parentNode = this.application.titleNode;
				}
				if(this.hiddenNode === null){
					this.hiddenNode = this.application.hiddenDiv;
				}
			}
		},
		
		_hideWidget: function(){
			if(this.hiddenNode !== null){
				domConstr.place(this.domNode, this.hiddenNode);
			}
		},
		
		_showWidget: function(){
			if(this.parentNode !== null){
				domConstr.place(
					this.domNode, this.parentNode, this.parentPosPlace
				);
			}
		},
		
		clear: function(){
			this._initNodes();
			this._hideWidget();
			this.set("content", "");
			this.set("href", "");
		}
	});
	
	return construct;
});