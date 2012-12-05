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
	"dojo/i18n!./nls/serviceHoursTable",
	"dojo/text!./views/serviceHoursTable.html",
	"dojo/dom-construct",
	"dojo/_base/array",
	"dojo/_base/lang"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template,
	domConstr, array, lang
) {
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"title": "",
		"data": [],
		
		_days: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			if(!this._isBlank(this.data)){
				this._createTableRows();
				this._writeLastRow();
				if(!this._isBlank(this.title)){
					this._addTitle();
				}
			}
		},
		
		_createTableRows: function(){
			var rows = {};
			array.forEach(this.data, function(row){
				rows = this._mixin(rows, this._createRows(row));
			},this);
			this._placeRows(rows);
		},
		
		_writeLastRow: function(){
			var tr = domConstr.create("tr", {}, this.tableNode);
			domConstr.create("td", {
				"innerHTML": "&nbsp;",
				"class": "r"
			}, tr);
			domConstr.create("td", {
				"innerHTML": "&nbsp;",
				"class": "r"
			}, tr);
			domConstr.create("td", {
				"innerHTML": "&nbsp;"
			}, tr);
		},
		
		_addTitle: function(){
			domConstr.create("h2",{
				"innerHTML": this.title + ":",
			}, this.domNode, "first");
		},
		
		_placeRows: function(rows){
			array.forEach(this._days, function(day){
				if(rows.hasOwnProperty(day)){
					array.forEach(rows[day], function(tr){
						domConstr.place(tr, this.tableNode);
					}, this);
				}
			}, this);
		},
		
		_mixin: function(obj1o, obj2o){
			var obj1 = lang.clone(obj1o);
			var obj2 = lang.clone(obj2o);
			
			for(var key in obj2){
				if(obj1.hasOwnProperty(key)){
					if((Object.prototype.toString.call(obj1[key]) === '[object Array]') || (Object.prototype.toString.call(obj2[key]) === '[object Array]')){
						if(Object.prototype.toString.call(obj1[key]) !== '[object Array]'){
							obj1[key] = new Array(obj1[key]);
						}
						if(Object.prototype.toString.call(obj2[key]) !== '[object Array]'){
							obj2[key] = new Array(obj2[key]);
						}
						obj1[key] = obj1[key].concat(obj2[key]);
					}
				}else{
					obj1[key] = obj2[key];
				}
			}
			
			return obj1;
		},
		
		_createRows: function(row){
			if(Object.prototype.toString.call(row.day) !== '[object Array]'){
				row.day = new Array(row.day);
			}
			
			var rows = {};
			array.forEach(row.day, function(day){
				var tr = this._createRow(day, row);
				
				if(rows.hasOwnProperty(day)){
					rows[day].push(tr);
				}else{
					rows[day] = new Array(tr);
				}
			}, this);
			
			return rows;
		},
		
		_createRow: function(day, row){
			var tr = domConstr.create("tr");
				
			domConstr.create("th", {
				"innerHTML": day,
				"class": "r b p10"
			}, tr);
			domConstr.create("td", {
				"innerHTML": this._formatHours(row.hours1) + "-" + this._formatHours(row.hours2),
				"class": "r b p20"
			}, tr);
			
			domConstr.create("td", {
				"innerHTML": row.description,
				"class": "b"
			}, tr);
			
			return tr;
		},
		
		_formatHours: function(hours){
			return hours.substring(0,5);
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