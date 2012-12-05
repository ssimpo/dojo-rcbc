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
	"dojo/query"
], function(
	declare, _variableTestMixin, domConstr, lang, array, domStyle, $
){
	"use strict";
	
	var construct = declare(_variableTestMixin, {
		_tableIsEmpty: function(tableDom){
			tableDom = this._getTableDom(tableDom);
			
			var trs = $("tr", tableDom);
			if(trs.length == 0){
				return true;
			}
			
			var cells = $("td,th", tableDom);
			var isBlank = true;
			array.every(cells, function(cell){
				if(!this._isBlank(cell.innerHTML)){
					isBlank = false;
					return false;
				}
				return true;
			}, this);
			
			
			return isBlank;
		},
		
		_hasTitle: function(tableDom){
			return ($("h2", this.domNode).length > 0);
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
			domStyle.set(this.domNode, "display", "none");
		},
		
		_addTitle: function(){
			if(!this._isBlank(this.title) && !this._hasTitle()){
				domConstr.create("h2",{
					"innerHTML": this.title + ":",
				}, this.domNode, "first");
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