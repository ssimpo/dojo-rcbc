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
	"dojo/_base/array"
], function(
	declare, _variableTestMixin, domConstr, lang, array
) {
	"use strict";
	
	var construct = declare(_variableTestMixin, {
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