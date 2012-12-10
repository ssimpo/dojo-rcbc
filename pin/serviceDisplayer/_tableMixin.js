// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"../_variableTestMixin",
	"dojo/dom-construct",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-style",
	"dojo/query",
	"dojo/dom-attr"
], function(
	declare, _variableTestMixin, domConstr, lang, array, domStyle, $, domAttr
){
	"use strict";
	
	var construct = declare(_variableTestMixin, {
		"titleDom": null,
		
		_tableIsEmpty: function(tableDom){
			tableDom = this._getTableDom(tableDom);
			
			var trs = $("tr", tableDom);
			if(trs.length == 0){
				return true;
			}
			
			var cells = $("td,th", tableDom);
			var isBlank = true;
			array.every(cells, function(cell){
				if(!this._isBlank(domAttr.get(cell, "innerHTML"))){
					isBlank = false;
					return false;
				}
				return true;
			}, this);
			
			
			return isBlank;
		},
		
		_hasTitle: function(tableDom){
			return this._isElement(this.titleDom);
		},
		
		_getTableDom: function(tableDom){
			if(tableDom === undefined){
				if(this.tableNode !== undefined){
					tableDom = this.tableNode;
				}else{
					return true;
				}
			}
			
			return tableDom;
		},
		
		_hideTable: function(){
			if(this._isElement(this.hiddenNode)){
				this._hideTitleNode();
				this._hideDetailsNode();
				this._hideTableNode();
			}
		},
		
		_hideTitleNode: function(){
			if(this._isElement(this.titleDom)){
				domConstr.place(this.titleDom, this.hiddenNode);
			}
		},
		
		_hideDetailsNode: function(){
			if(this._isElement(this.detailsNode)){
				domConstr.place(this.detailsNode, this.hiddenNode);
			}
		},
		
		_hideTableNode: function(){
			if(this._isElement(this.tableNode)){
				domConstr.place(this.tableNode, this.hiddenNode);
			}
		},
		
		_showTable: function(){
			if(this._isElement(this.hiddenNode)){
				this._showTitleNode();
				this._showDetailsNode();
				this._showTableNode();
			}
		},
		
		_showTitleNode: function(){
			if(this._isElement(this.titleDom)){
				if((!this._isBlank(this.titleDom)) && (!this._tableIsEmpty() || !this._isBlank(this.detailsNode))){
					domConstr.place(this.titleDom, this.domNode, "first");
				}else{
					this._hideTitleNode();
				}
			}
		},
		
		_showDetailsNode: function(){
			if(this._isElement(this.detailsNode)){
				if(!this._isBlank(this.detailsNode)){
					domConstr.place(this.detailsNode, this.domNode);
				}else{
					this._hideDetailsNode();
				}
			}
		},
		
		_showTableNode: function(){
			if(this._isElement(this.tableNode)){
				if(!this._isBlank(this.tableNode)){
					domConstr.place(this.tableNode, this.domNode);
				}else{
					this._hideTableNode();
				}
			}
		},
		
		_addTitle: function(){
			if(!this._isBlank(this.title) && !this._hasTitle()){
				this.titleDom = domConstr.create(
					"h2",{}, this.domNode, "first"
				);
			}
			if(this._hasTitle()){
				domConstr.empty(this.titleDom);
				if(!this._isBlank(this.title)){
					domAttr.set(this.titleDom, "innerHTML", this.title + ":");
				}else{
					domAttr.set(this.titleDom, "innerHTML", "");
				}
			}
		},
		
		_createTr: function(cells, lastRow){
			lastRow = ((lastRow === undefined) ? false : lastRow);
			var tr = domConstr.create("tr");
			var classWidths = this._getCellWidths();
			
			array.forEach(cells, function(cellData, n){
				var cClass = ""
				if(!lastRow){
					cClass = "b "
				}
				if(classWidths.length > n){
					cClass += "p"+classWidths[n].toString();
				}
				if(n < (cells.length-1)){
					cClass += " r";
				}
				cClass = lang.trim(cClass);
				
				domConstr.create(
					((n == 0) ? "th" : "td"),
					this._getCellConstruct(cellData, cClass),
					tr
				);
			},this);
			
			return tr;
		},
		
		_getCellWidths: function(){
			var classWidths = [];
			if(!this._isBlank(this.columnWidths)){
				classWidths = this.columnWidths;
			}
			
			return classWidths;
		},
		
		_getCellConstruct: function(cellData, cClass){
			var cellConstruct = {
				"innerHTML": cellData
			};
			if(cClass != ""){
				cellConstruct = lang.mixin(cellConstruct, {
					"class": cClass
				});
			}
			
			return cellConstruct;
		},
		
		_createLastTr: function(columnTotal){
			var cells = [];
			for(var i = 0; i < columnTotal; i++){
				cells.push("&nbsp;");
			}
			
			return this._createTr(cells, true);
		}
	});
	
	return construct;
});