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
	"dojo/i18n!./nls/costTable",
	"dojo/text!./views/costTable.html",
	"dojo/dom-construct",
	"dojo/_base/array"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template,
	domConstr, array
) {
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"data": [],
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			array.forEach(this.data, function(row){
				this._createRow(row);
			},this);
		},
		
		_createRow: function(row){
			var tr = domConstr.create("tr", {}, this.domNode);
			domConstr.create("th", {
				"innerHTML": row.type
			}, tr);
			var td = domConstr.create("td", {
				"innerHTML": row.details
			}, tr);
			if(row.description != ""){
				domConstr.create("span", {
					"innerHTML": "&nbsp;("+row.description+")"
				}, td);
			}
		}
	});
	
	return construct;
});