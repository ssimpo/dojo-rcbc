define([
	"dojo/_base/declare",
	"./checkWithDetails",
	"./ageRange",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dijit/form/TextBox",
	"dijit/form/NumberSpinner",
	"dijit/form/Select"
], function(
	declare, _checkWithDetails, ageRange, domConstr, domStyle, TextBox
){
	"use strict";
	
	var construct = declare([_checkWithDetails], {
		"_ageRange": {},
		"_aboveYearsField":{},
		"_aboveMonthsField":{},
		"_belowYearsField":{},
		"_belowMonthsField":{},
		
		postCreate: function(){
			this._init();
			
			this._ageRange = new ageRange();
			domConstr.place(
				this._ageRange.domNode,
				this.moreDetailsNode.domNode,
				"replace"
			);
			this.moreDetailsNode = this._ageRange;
			this._fromYearsField = this._createHiddenField("from","years","fromAgeNode");
			this._fromMonthsField = this._createHiddenField("from","months","fromMonthsNode");
			this._fromYearsField = this._createHiddenField("to","years","toAgeNode");
			this._fromMonthsField = this._createHiddenField("to","months","toMonthsNode");
		},
		
		_createHiddenField: function(type, fieldname, nodeName){
			var self = this;
			
			var tx = new TextBox({
				"type": "hidden",
				"name": this.name+"["+type+"]["+fieldname+"]",
				"_getValueAttr": function(){
					return self.moreDetailsNode[nodeName].get("value");
				},
				"_setValueAttr": function(value){
					self.moreDetailsNode[nodeName].set("value",value);
					this.value = value;
				}
			});
			domConstr.place(tx.domNode, this.checkboxCell);
			return tx;
		}
	});
	
	return construct;
});