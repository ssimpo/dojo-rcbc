define([
	"dojo/_base/declare",
	"../subdocumentSelect",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/dom-attr",
	
	"../combo!static",
	"dijit/form/TextBox",
	"../dialogOkButton",
	"../TextBox"
], function(
	declare, _subDocumentSelect, on, lang, domAttr
){
	"use strict";
	
	var construct = declare([_subDocumentSelect], {
		"dialogTemplate": "/scripts/rcbc/dijit/views/contactSelectDialog.html",
		
		__init: function(dia){
			var typeWidget = dia.getWidget2("type");
			
			on(
				typeWidget,
				"change",
				lang.hitch(this, this._typeChange, typeWidget, dia)
			);
		},
		
		_typeChange: function(widget, dia){
			var valueLabel = dia.getWidget2("valueLabel");
			domAttr.set(valueLabel, "innerHTML", widget.item.label);
			
			var valueWidget = dia.getWidget2("value");
			valueWidget.set("validationType", widget.item.type);
		}
	});
	
	return construct;
});