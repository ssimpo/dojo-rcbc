define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/i18n",
	"dojo/i18n!./nls/ageRange",
	"dojo/text!./views/ageRange.html",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/dom-attr",
	"dojo/dom-construct",
	
	"dijit/form/NumberSpinner",
	"dijit/form/Select"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template,
	on, lang, domAttr, domConstr
){
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate], {
		"i18n": strings,
		"templateString": template,
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			on(
				this.selectorNode,
				"change",
				lang.hitch(this, this._handleSelector)
			);
			
			this._handleSelector();
		},
		
		_getValueAttr: function(){
			var selectValue = this.selectorNode.get("value");
			selectValue = selectValue.charAt(0).toUpperCase() + selectValue.slice(1);
			return this["_getAttValue"+selectValue]();
		},
		
		_getAttValueAbove: function(){
			return {
				"type": "above",
				"years": this.fromAgeNode.get("value"),
				"months": this.fromMonthsNode.get("value")
			};
		},
		
		_getAttValueBelow: function(){
			return {
				"type": "below",
				"years": this.toAgeNode.get("value"),
				"months": this.toMonthsNode.get("value")
			};
		},
		
		_getAttValueBetween: function(){
			return {
				"type": "between",
				"years": {
					"from": this.fromAgeNode.get("value"),
					"to": this.toAgeNode.get("value")
				},
				"months": {
					"from": this.fromMonthsNode.get("value"),
					"to": this.toMonthsNode.get("value")
				}
			};
		},
		
		_setValueAttr: function(value){
			if(value.hasOwnProperty("type") && value.hasOwnProperty("years") && value.hasOwnProperty("months")){
				on.once(this.selectorNode, "change", lang.hitch(this, function(){
					if(value.type == "above"){
						this.fromAgeNode.set("value", value.years);
						this.fromMonthsNode.set("value", value.months);
					}else if(value.type == "below"){
						this.toAgeNode.set("value", value.years);
						this.toMonthsNode.set("value", value.months);
					}else if(value.type == "between"){
						this.fromAgeNode.set("value", value.years.from);
						this.fromMonthsNode.set("value", value.months.from);
						this.toAgeNode.set("value", value.years.to);
						this.toMonthsNode.set("value", value.months.to);
					}
				}));
				this.selectorNode.set("value", value.type);
			}
		},
		
		_handleSelector: function(event, var2, var3, var4){
			var selectValue = this.selectorNode.get("value");
			selectValue = selectValue.charAt(0).toUpperCase() + selectValue.slice(1);
			this["_handleSelect"+selectValue]();
		},
		
		_handleSelectAbove: function(){
			domConstr.place(this.secondRow, this.hiddenTable);
			domAttr.set(this.selectorCell, "rowspan", 1);
			
			domAttr.set(this.fromTitleCell, "innerHTML", "Above:");
			domAttr.set(this.toTitleCell, "innerHTML", "&nbsp;");
			
			domConstr.place(this.fromBlock, this.fromCell, "first");
			domConstr.place(this.toBlock, this.hiddenDiv);
			
			this.reset();
		},
		
		_handleSelectBelow: function(){
			domConstr.place(this.secondRow, this.hiddenTable);
			domAttr.set(this.selectorCell, "rowspan", 1);
			
			domAttr.set(this.fromTitleCell, "innerHTML", "Below:");
			domAttr.set(this.toTitleCell, "innerHTML", "&nbsp;");
			
			domConstr.place(this.toBlock, this.fromCell, "first");
			domConstr.place(this.fromBlock, this.hiddenDiv);
			
			this.reset();
		},
		
		_handleSelectBetween: function(){
			domAttr.set(this.selectorCell, "rowspan", 2);
			domConstr.place(this.secondRow, this.ageRangeTable, "last");
			
			domAttr.set(this.fromTitleCell, "innerHTML", "From:");
			domAttr.set(this.toTitleCell, "innerHTML", "To:");
			
			domConstr.place(this.fromBlock, this.fromCell, "first");
			domConstr.place(this.toBlock, this.toCell, "first");
			
			this.reset();
		},
		
		reset: function(){
			this.fromAgeNode.set("value", 0);
			this.fromMonthsNode.set("value", 0);
			this.toAgeNode.set("value", 0);
			this.toMonthsNode.set("value", 0);
		}
	});
	
	return construct;
});