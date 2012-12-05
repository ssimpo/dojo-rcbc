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
		"title": "",
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			if(!this._isBlank(this.data)){
				this._createRows();
				this._writeLastRow();
				this._addTitle();
			}
		},
		
		_addTitle: function(){
			domConstr.create("h2",{
				"innerHTML": this.title + ":",
			}, this.domNode, "first");
		},
		
		_createRows: function(){
			array.forEach(this.data, function(row){
				if(!this._isBlank(row)){
					this._createRow(row);
				}
			},this);
		},
		
		_createRow: function(row){
			var tr = domConstr.create("tr", {}, this.tableNode);
			domConstr.create("th", {
				"innerHTML": row.type,
				"class": "r b p30"
			}, tr);
			var td = domConstr.create("td", {
				"innerHTML": row.details,
				"class": "b"
			}, tr);
			if(row.description != ""){
				domConstr.create("span", {
					"innerHTML": "&nbsp;("+row.description+")"
				}, td);
			}
		},
		
		_writeLastRow: function(){
			var tr = domConstr.create("tr", {}, this.tableNode);
			domConstr.create("td", {
				"innerHTML": "&nbsp;",
				"class": "r"
			}, tr);
			domConstr.create("td", {
				"innerHTML": "&nbsp;"
			}, tr);
		},
		
		_isBlank: function(value){
			if((value === null) || (value === undefined) || (value === "") || (value === false)){
				return true;
			}
			
			if(toString.call(value) === '[object String]'){
				if(lang.trim(value) === ""){
					return true;
				}
			}else if(Object.prototype.toString.call(value) === '[object Object]'){
				return (this._isEmptyObject(value) || this._isBlankObject(value));
			}else if(Object.prototype.toString.call(value) === '[object Array]'){
				if(value.length == 0){
					return true;
				}else{
					return this._isBlankArray(value);
				}
			}
			
			return false;
		},
		
		_isBlankArray: function(ary){
			for(var i = 0; i < ary.length; i++){
				if(!this._isBlank(ary[i])){
					return false;
				}
			}
			
			return true;
		},
		
		_isEmptyObject: function(obj){
			for(var key in obj){
				if(obj.hasOwnProperty(key)){
					return false;
				}
			}
			return true;
		},
		
		_isBlankObject: function(obj){
			for(var key in obj){
				if(!this._isBlank(obj[key])){
					return false
				}
			}
			
			return true;
		}
	});
	
	return construct;
});