// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dijit/layout/ContentPane",
	"dojo/dom-construct",
	"dojo/request",
	"dojo/_base/lang",
	"simpo/typeTest"
], function(
	declare, ContentPane, domConstr, request, lang, typeTest
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
			this.href = ""; // Do not use set() as it will trigger a url load of "".
		},
		
		_setPageIdAttr: function(id, category){
			if(typeTest.isString(id)){
				this._initNodes();
				this.parentNode = this.application.titleNode;
				
				if(id.length === 32){
					this.pageId = id.toLowerCase();
					var url = "/pin.nsf/pages3/"+id;
					if(!typeTest.isEqual(this.get("href"), url)){
						this.set("href", url);
						this._showWidget();
					}
				}else{
					if(typeTest.isBlank(category)){
						var url = "/pin.nsf/pages2/"+id;
						this.parentNode = this.application.hiddenDiv;
					}else{
						var url = "/pin.nsf/pages2/"+id+"_"+category;
					}
					
					if(!typeTest.isEqual(this.get("href"), url)){
						this.set("href", url);
						this._showWidget();
					}
				}
			}
		}
	});
	
	return construct;
});