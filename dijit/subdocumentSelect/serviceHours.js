define([
	"dojo/_base/declare",
	"../subdocumentSelect",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/dom-attr",
	
	"../combo!static",
	"dijit/form/TextBox",
	"../dialogOkButton",
	"../checkboxGrid",
	"../TextBox",
	"dijit/form/TimeTextBox"
], function(
	declare, _subDocumentSelect, on, lang, domAttr
){
	"use strict";
	
	var construct = declare([_subDocumentSelect], {
		"dialogTemplate": "/scripts/rcbc/dijit/views/contactSelectDialog.html",
		
		__init: function(dia){
			var fromWidget = dia.getWidget2("from");
			var toWidget = dia.getWidget2("to");
			
			on(
				fromWidget, "change",
				lang.hitch(this, this._timeChange, fromWidget, toWidget, dia)
			);
			on(
				toWidget, "change",
				lang.hitch(this, this._timeChange, fromWidget, toWidget, dia)
			);
		},
		
		_timeChange: function(fromWidget, toWidget, dia){
			var valueLabelWidget = dia.getWidget2("valueLabel");
			valueLabelWidget.set(
				"value",
				this._getHoursMinutesText(fromWidget.get("value"))
					+ " - " +
					this._getHoursMinutesText(toWidget.get("value"))
			);
		},
		
		_getHoursMinutesText: function(dateObj){
			if(dateObj == null){
				return "";
			}
			
			var hours = this._addTrailingZero(dateObj.getHours());
			var minutes = this._addTrailingZero(dateObj.getMinutes());
			
			return hours+":"+minutes;
		},
		
		_addTrailingZero: function(num){
			if(num < 10){
				return "0" + num.toString();
			}else{
				return num.toString();
			}
		},
		
		clear: function(){
			var form = this._getDialogForm();
			if(form != null){
				form.reset();
			}
		}
	});
	
	return construct;
});