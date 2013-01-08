// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dijit/layout/ContentPane",
	"./_variableTestMixin",
	"dojo/dom-construct",
	"dojo/request",
	"dojo/_base/lang"
], function(
	declare, ContentPane, _variableTestMixin,
	domConstr, request, lang
) {
	"use strict";
	
	var construct = declare([ContentPane, _variableTestMixin], {
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
				console.log(this.parentPosPlace);
				domConstr.place(
					this.domNode, this.parentNode, this.parentPosPlace
				);
			}
		},
		
		clear: function(){
			this._initNodes();
			this._hideWidget();
			this.set("content", "");
			this.href = ""; // Do not use set() as it will trigger a url load of "".
		},
		
		_setPageIdAttr: function(id, category){
			if(this._isString(id)){
				this._initNodes();
				this.parentNode = this.application.titleNode;
				
				if(id.length === 32){
					this.pageId = id.toLowerCase();
					var url = "/pin.nsf/pages3/"+id;
					if(!this._isEqual(this.get("href"), url)){
						this.set("href", url);
						this._showWidget();
					}
				}else{
					if(this._isBlank(category)){
						var url = "/pin.nsf/pages2/"+id;
						this.parentNode = this.application.hiddenDiv;
					}else{
						var url = "/pin.nsf/pages2/"+id+"_"+category;
					}
					
					if(!this._isEqual(this.get("href"), url)){
						this.set("href", url);
						this._showWidget();
					}
				}
			}
		}
	});
	
	return construct;
});