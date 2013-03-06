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
	"dojo/i18n!./nls/telephone",
	"dojo/text!./views/telephone.html",
	"dojo/dom-attr",
	"simpo/typeTest"
], function(
	declare, _base, _templated, _wTemplate, i18n, strings, template,
	domAttr, typeTest
) {
	"use strict";
	
	var construct = declare([_base, _templated, _wTemplate], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"type": "Fax",
		"details": "",
		"description": "",
		"descriptionNode": null,
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			try{
				if(!typeTest.isBlank(this.details)){
					domAttr.set(this.detailsCell, "innerHTML", this.details);
				}
				this._createDescription();
			}catch(e){
				console.info(e);
			}
		}
	});
	
	return construct;
});