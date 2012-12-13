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
	"./_variableTestMixin",
	"dojo/i18n",
	"dojo/i18n!./nls/shortlist",
	"dojo/text!./views/shortlist.html"
], function(
	declare,
	_widget, _templated, _wTemplate, _variableTestMixin,
	i18n, strings, template
){
	"use strict";
	
	var construct = declare([
		_widget, _templated, _wTemplate,  _variableTestMixin
	], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"value": [],
		
		clear: function(){
			domConstr.empty(this.domNode);
		},
		
		_setValueAttr: function(value){
			
		}
	});
	
	return construct;
});