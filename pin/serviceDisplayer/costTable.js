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
	"dojo/i18n!./nls/costTable",
	"dojo/text!./views/costTable.html",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dojo/_base/array"
], function(
	declare,
	_widget, _templated, _wTemplate, _tableMixin,
	i18n, strings, template,
	domConstr, domAttr, array
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
		
		"data": [],
		"title": "",
		"columnWidths": [30],
		"titleLevel": 2,
		
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
				this._createRows();
			}
			if(!this._tableIsEmpty()){
				this._showTable();
				this._writeLastRow();
			}else{
				this._hideTable();
			}
		},
		
		_createRows: function(){
			array.forEach(this.data, function(row){
				if(!this._isBlank(row)){
					this._createRow(row);
				}
			},this);
		},
		
		_createRow: function(row){
			domConstr.place(
				this._createTr([row.type, this._getCostDetails(row)]),
				this.tableNode
			)
		},
		
		_getCostDetails: function(rowData){
			var costDetails = rowData.details;
			if(!this._isBlank(rowData.description)){
				costDetails += "&nbsp;("+rowData.description+")";
			}
			
			return costDetails;
		},
		
		_writeLastRow: function(){
			domConstr.place(this._createLastTr(2), this.tableNode);
		}
	});
	
	return construct;
});