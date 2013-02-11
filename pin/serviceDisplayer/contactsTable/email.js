// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"./_base",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/i18n",
	"dojo/i18n!./nls/email",
	"dojo/text!./views/email.html",
	"dojo/dom-attr",
	"dojo/_base/lang",
	"dojo/dom-construct"
], function(
	declare, _base, _templated, _wTemplate, i18n, strings, template,
	domAttr, lang, domConstr
) {
	"use strict";
	
	var construct = declare([_base, _templated, _wTemplate], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		
		"type": "Email Address",
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
			try{
			var details = lang.trim(this.details);
			if(!this._isBlank(details)){
				domAttr.set(this.anchorNode, "href", this._parseUrl(details));
				domAttr.set(this.anchorNode, "innerHTML", details);
			}
			}catch(e){
				console.log(e);
			}
		},
		
		_parseUrl: function(url){
			return "mailto:"+url;
		}
	});
	
	return construct;
});