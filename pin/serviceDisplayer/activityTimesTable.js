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
	"dojo/i18n!./nls/activityTimesTable",
	"dojo/text!./views/activityTimesTable.html",
	"dojo/dom-attr",
	"dojo/dom-construct",
	"dojo/_base/array"
], function(
	declare,
	_widget, _templated, _wTemplate, _tableMixin,
	i18n, strings, template,
	domAttr, domConstr, array
) {
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
		
		"titleLevel": 2,
		"days": null,
		"coveragePeriod": "",
		
		_init: function(){
			this._fixTitleLevel();
			domConstr.empty(this.tableNode);
			domConstr.empty(this.detailsNode);
			this._testShowHideTable();
		},
		
		_testShowHideTable: function(){
			if(!this._tableIsEmpty()){
				this._showTable();
				this._writeLastRow();
			}else{
				this._hideTable();
			}
		},
		
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
		
		_setDaysAttr: function(value){
			if(this._isArray(value)){
				if(value.length > 0){
					this.days = value;
					
					array.forEach(this.days, function(cDay){
						this._addRow(cDay);
					}, this);
				}
			}
			this._testShowHideTable();
		},
		
		_setCoveragePeriodAttr: function(value){
			
		},
		
		_addRow: function(details){
			var row = [
				details.day.charAt(0).toUpperCase() + details.day.slice(1),
				details.startTime.substring(0,5) + " - " + details.endTime.substring(0,5),
				""
			];
			
			if(this._isEqual(details.repeatType, "weekly")){
				if(details.repeatPeriod[0] == 1){
					row[2] = "Every week";
				}else if(details.repeatPeriod[0] == 2){
					row[2] = "Every fortnight";
				}else{
					row[2] = "Every " + details.repeatPeriod[0].toString()+ " weeks";
				}
			}else if(this._isEqual(details.repeatType, "monthly")){
				if(details.repeatPeriod[0] == 1){
					row[2] = "1st "+row[0]+" of every month";
				}else if(details.repeatPeriod[0] == 2){
					row[2] = "2nd "+row[0]+" of every month";
				}else if(details.repeatPeriod[0] == 3){
					row[2] = "3rd "+row[0]+" of every month"
				}else if(details.repeatPeriod[0] > 3){
					row[2] = details.repeatPeriod[0].toString() + "th "+row[0]+" of every month"
				}else if(details.repeatPeriod[0] == -1){
					row[2] = "Last "+row[0]+" of every month"
				}
				
				if(details.repeatPeriod.length > 1){
					if(details.repeatPeriod[1] == 1){
						row[2] += " and 1st "+row[0]+" of every month";
					}else if(details.repeatPeriod[1] == 2){
						row[2] += " and 2nd "+row[0]+" of every month";
					}else if(details.repeatPeriod[1] == 3){
						row[2] += " and 3rd "+row[0]+" of every month"
					}else if(details.repeatPeriod[1] > 3){
						row[2] += " and "+details.repeatPeriod[0].toString() + "th "+row[0]+" of every month"
					}else if(details.repeatPeriod[1] == -1){
						row[2] += " and last "+row[0]+" of every month"
					}
				}
			}
			
			domConstr.place(this._createTr(row), this.tableNode);
		},
		
		_writeLastRow: function(){
			domConstr.place(this._createLastTr(2), this.tableNode);
		},
	});
	
	return construct;
});