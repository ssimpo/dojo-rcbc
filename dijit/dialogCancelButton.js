define([
	"dojo/_base/declare",
	"dojo/i18n",
	"dojo/i18n!dijit/nls/common",
	"dijit/form/Button",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/dom-attr",
	"dijit/registry"
], function(
	declare, i18n, strings, Button, on, lang, domAttr, registry
){
	"use strict";
	
	var construct = declare([Button],{
		postCreate: function(){
			this.set("label",strings.buttonCancel);
			on(
				this.domNode,
				"click",
				lang.hitch(this,this._clicked)
			);
		},
		
		_clicked: function(evt){
			var node = evt.target;
			var role = domAttr.get(node,"role");
			while((role != "dialog") && (node.tagName.toLowerCase() != "body")){
				node = node.parentNode;
				role = domAttr.get(node,"role");
			}
			
			if(role == "dialog"){
				var widget = registry.byNode(node);
				widget.okButton = false;
				widget.cancelButton = true;
				widget.hide();
			}
		}
	});
	
	return construct;
});