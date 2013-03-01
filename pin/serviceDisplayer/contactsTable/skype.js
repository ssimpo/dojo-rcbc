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
	"dojo/i18n!./nls/skype",
	"dojo/text!./views/skype.html",
	"simpo/typeTest"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template, typeTest
) {
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			
		}
	});
	
	return construct;
});