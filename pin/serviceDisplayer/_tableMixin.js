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
			var isBlank = true;
			tableDom = this._getTableDom(tableDom);
			
			if(this._isElement(tableDom)){
				try{
					var trs = $("tr", tableDom);
					if(trs.length == 0){
						return true;
					}
			
					var cells = $("td,th", tableDom);
			
					array.every(cells, function(cell){
						if(!this._isBlank(domAttr.get(cell, "innerHTML"))){
							isBlank = false;
							return false;
						}
						return true;
					}, this);
				}catch(e){
					console.info("Could not test if table is empty.");
				}
			}
			
			return isBlank;
		},
		
		_hasTitle: function(tableDom){
			var hasTable = false;
			
			try{
				hasTable = this._isElement(this.titleDom);
			}catch(e){
				console.info("Could not check for table");
			}
			
			return hasTable;
		},
		
		_getTableDom: function(tableDom){
			try{
				if(tableDom === undefined){
					if(this.tableNode !== null){
						tableDom = this.tableNode;
					}else{
						return true;
					}
				}
			}catch(e){
				console.info("Could not get table Dom");
			}
			
			return tableDom;
		},
		
		_hideTable: function(){
			try{
				if(this._isElement(this.hiddenNode)){
					this._hideTitleNode();
					this._hideDetailsNode();
					this._hideTableNode();
				}
			}catch(e){
				console.info("Could not hide table unit.");
			}
		},
		
		_hideTitleNode: function(){
			try{
				if(this._isElement(this.titleDom)){
					domConstr.place(this.titleDom, this.hiddenNode);
				}
			}catch(e){
				console.info("Could not hide table title.");
			}
		},
		
		_hideDetailsNode: function(){
			try{
				if(this._isElement(this.detailsNode)){
					domConstr.place(this.detailsNode, this.hiddenNode);
				}
			}catch(e){
				console.info("Could not hide table details.");
			}
		},
		
		_hideTableNode: function(){
			try{
				if(this._isElement(this.tableNode)){
					domConstr.place(this.tableNode, this.hiddenNode);
				}
			}catch(e){
				console.info("Could not hide table node.");
			}
		},
		
		_showTable: function(){
			try{
				if(this._isElement(this.hiddenNode)){
					this._showTitleNode();
					this._showDetailsNode();
					this._showTableNode();
				}
			}catch(e){
				console.info("Could not show table unit.");
			}
		},
		
		_showTitleNode: function(){
			try{
				if(this._isElement(this.titleDom)){
					if((!this._isBlank(this.titleDom)) && (!this._tableIsEmpty() || !this._isBlank(this.detailsNode))){
						domConstr.place(this.titleDom, this.domNode, "first");
					}else{
					this._hideTitleNode();
					}
				}
			}catch(e){
				console.info("Could not show table title.");
			}
		},
		
		_showDetailsNode: function(){
			try{
				if(this._isElement(this.detailsNode)){
					if(!this._isBlank(this.detailsNode)){
						domConstr.place(this.detailsNode, this.domNode);
					}else{
						this._hideDetailsNode();
					}
				}
			}catch(e){
				console.info("Could not show table details.");
			}
		},
		
		_showTableNode: function(){
			try{
				if(this._isElement(this.tableNode)){
					if(!this._isBlank(this.tableNode)){
						domConstr.place(this.tableNode, this.domNode);
					}else{
						this._hideTableNode();
					}
				}
			}catch(e){
				console.info("Could not show table.");
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