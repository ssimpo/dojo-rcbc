define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/text!./views/checkWithDetails.html",
	"dojo/dom-attr",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/dom-construct",
	
	"dijit/form/CheckBox",
	"rcbc/dijit/TextBox"
], function(
	declare, _widget, _templated, _wTemplate, template,
	domAttr, on, lang, domStyle, domConstr
){
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate], {
		"templateString": template,
		"label": "",
		"value": "",
		"promptMessage": "",
		"placeHolder": "",
		"shown": false,
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			var ckId = this._randomId('checkboxWithDetails');
			this.checkboxNode.set("id", ckId);
			domAttr.set(this.labelNode, "for", ckId);
			domAttr.set(this.labelNode, "innerHTML", this.label);
			if(this.promptMessage != ""){
				this.moreDetailsNode.set("promptMessage",this.promptMessage);
			}
			if(this.placeHolder != ""){
				this.moreDetailsNode.set("placeHolder",this.placeHolder);
			}
			
			//this._onCheckChange(false);
			on(
				this.checkboxNode,
				"change",
				lang.hitch(this, this._onCheckChange)
			);
		},
		
		_getValueAttr: function(value){
			return (
				(this.checkboxNode.get("checked")
			) ? this.moreDetailsNode.get("value") : false);
		},
		
		_setValueAttr: function(value){
			if((value !== false) && (value !== "false")){
				this.checkboxNode.set("value", "on");
				this.moreDetailsNode.set("value", value);
			}else{
				this.value = ""
			}
		},
		
		_onCheckChange: function(value){
			if(this.shown){
				domConstr.place(this.moreDetailsNode.domNode, this.hiddenDiv);
				this.shown = !this.shown;
				this.set("value", false);
			}else{
				domConstr.place(this.moreDetailsNode.domNode, this.visibleDiv);
				this.shown = !this.shown;
			}
			
			this.moreDetailsNode.set("required",value);
		},
		
		_randomId: function(prefix){
			var no = Math.floor((Math.random()*1000000000000)+1);
			return prefix + "_" + no.toString();
		},
		
		_getWidgets: function(){
			var widgets = registry.findWidgets(this.domNode);
			if(widgets.length == 1){
				if(widgets[0].domNode.tagName.toLowerCase() == "form"){
					widgets = registry.findWidgets(widgets[0].domNode);
				}
			}
			
			return widgets;
		},
		
		reset: function(){
			var widgets = this._getWidgets();
			if(widgets.length > 0){
				for(var i = 0; i < widgets.length; i++){
					widgets[i].reset();
				}
			}
		}
	});
	
	return construct;
});