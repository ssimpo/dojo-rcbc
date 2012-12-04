// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/i18n",
	"dojo/i18n!./nls/website",
	"dojo/text!./views/website.html",
	"dojo/dom-attr",
	"dojo/_base/lang",
	"dojo/dom-construct"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template,
	domAttr, lang, domConstr
) {
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"type": "Website",
		"details": "",
		"description": "",
		"descriptionNode": null,
		
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._createAnchor();
			this._createDescription();
		},
		
		_createAnchor: function(){
			var details = lang.trim(this.details);
			if(!this._isBlank(details)){
				domAttr.set(this.anchorNode, "href", this._parseUrl(details));
				details = details.replace(/http\:\/\/|https\:\/\//,"");
				domAttr.set(this.anchorNode, "innerHTML", details);
			}
		},
		
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
		
		_parseUrl: function(url){
			if((url.indexOf("http://") !== -1 || url.indexOf("https://") !== -1)){
				return url;
			}
			return "http://"+url;
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