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
	"./_tableMixin",
	"dojo/i18n",
	"dojo/i18n!./nls/serviceHoursTable",
	"dojo/text!./views/serviceHoursTable.html",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dojo/_base/array",
	"dojo/_base/lang"
], function(
	declare,
	_widget, _templated, _wTemplate, _tableMixin,
	i18n, strings, template,
	domConstr, domAttr, array, lang
){
	"use strict";
	
	var construct = declare([
		_widget, _templated, _wTemplate, _tableMixin
	], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"title": "",
		"data": [],
		"columnWidths": [10, 20],
		"titleLevel": 2,
		
		_days: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
		
		_fixTitleLevel: function(){
			if(!this._isEqual(this.titleDom.tagName, "h"+this.titleLevel.toString())){
				this.titleDom = domConstr.create(
					"h"+this.titleLevel.toString(),
					{"innerHTML": domAttr.get(this.titleDom, "innerHTML")},
					this.titleDom,
					"replace"
				);
			}
		},
		
		_setDataAttr: function(data){
			this.data = data;
			this._init();
		},
		
		_setTitleAttr: function(title){
			this.title = title;
			this._addTitle();
			this._showTitleNode();
		},
		
		_init: function(){
			this._fixTitleLevel();
			domConstr.empty(this.tableNode);
			if(!this._isBlank(this.data)){
				this._createTableRows();
			}
			if(!this._tableIsEmpty()){
				this._showTable();
				this._writeLastRow();
			}else{
				this._hideTable();
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
			domConstr.place(this._createLastTr(3), this.tableNode);
		},
		
		_placeRows: function(rows){
			array.forEach(this._days, function(day){
				if(Object.prototype.hasOwnProperty.call(rows, day)){
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
				if(Object.prototype.hasOwnProperty.call(obj1, key)){
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
				
				if(Object.prototype.hasOwnProperty.call(rows, day)){
					rows[day].push(tr);
				}else{
					rows[day] = new Array(tr);
				}
			}, this);
			
			return rows;
		},
		
		_createRow: function(day, row){
			var hours = this._formatHoursRange(row.hours1, row.hours2);
			return this._createTr([day, hours, row.description]);
		},
		
		_formatHours: function(hours){
			return hours.substring(0,5);
		},
		
		_formatHoursRange: function(hours1, hours2){
			return this._formatHours(hours1) + "-" + this._formatHours(hours2);
		}
	});
	
	return construct;
});