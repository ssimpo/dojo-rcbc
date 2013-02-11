define([
	"dojo/_base/declare",
	"dojo/i18n!./nls/addNewVenuButton",
	"dijit/form/Button",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/dom-attr",
	"dijit/registry",
	"rcbc/dijit/dialog"
], function(
	declare, strings, Button, on, lang, domAttr, registry, _dialog
){
	"use strict";
	
	
	var construct = declare([Button],{
		"_dialog": {},
		"_orginalDialog": {},
		"href": "",
		"_firstClicked": true,
		
		postCreate: function(){
			this._dialog = new _dialog({
				"href": this.href,
				"title": strings.newVenueTitle
			});
			this._setOrginalDialog();
			
			on(this.domNode, "click", lang.hitch(this, this._clicked));
			on(this._dialog, "hide", lang.hitch(this, this._hidden));
		},
		
		_setOrginalDialog: function(){
			var node = this.domNode;
			var role = domAttr.get(node,"role");
			while((role != "dialog") && (node.tagName.toLowerCase() != "body")){
				node = node.parentNode;
				role = domAttr.get(node,"role");
			}
			
			if(role == "dialog"){
				this._orginalDialog = registry.byNode(node);
			}
		},
		
		_getDialogWidgets: function(dialogWidget){
			var widgets = registry.findWidgets(dialogWidget.domNode);
			if(widgets.length == 1){
				if(widgets[0].domNode.tagName.toLowerCase() == "form"){
					widgets = registry.findWidgets(widgets[0].domNode);
				}
			}
			
			return widgets;
		},
		
		_getWidgetById: function(id, dialog){
			var widgets = this._getDialogWidgets(dialog);
			var widget;
			
			for(var i = 0; i < widgets.length; i++){
				var widgetId = widgets[i]["data-dojo-create-id"];
				if(widgetId != undefined){
					if(widgetId.toLowerCase() == id.toLowerCase()){
						widget = widgets[i];
					}
				}
			}
			
			return widget;
		},
		
		_clicked: function(evt){
			if(this._firstClicked){
				var itemList = this._getWidgetById("itemList", this._orginalDialog);
				
				on(
					itemList.domNode,
					"additem",
					lang.hitch(this,this._addItem)
				);
				
				on(
					itemList.domNode,
					"empty",
					lang.hitch(this,this._emptyList)
				);
				
				on(
					itemList.domNode,
					"edit",
					lang.hitch(this,this._editNewVenue)
				);
				
				this._firstClicked = false;
			}
			
			this._dialog.clear();
			this._dialog.show();
		},
		
		_hidden: function(){
			var itemList = this._getWidgetById("itemList", this._orginalDialog);
			if(this._dialog.okButton){
				itemList.add(this._dialog.value);
			}
		},
		
		_addItem: function(){
			var nameWidget = this._getWidgetById("name", this._orginalDialog);
			nameWidget.set("disabled", true);
			var addNewButton = this._getWidgetById("addNewButton", this._orginalDialog);
			addNewButton.set("disabled", true);
		},
		
		_emptyList: function(){
			var nameWidget = this._getWidgetById("name", this._orginalDialog);
			nameWidget.set("disabled", false);
			var addNewButton = this._getWidgetById("addNewButton", this._orginalDialog);
			addNewButton.set("disabled", false);
		},
		
		_editNewVenue: function(event){
			var item = registry.byNode(event.target);
			this._dialog.clear();
			this._dialog.show();
			
			for(var fieldName in item.data){
				this._dialog.update(fieldName, item.data[fieldName]);
			}
			
			item["delete"]();
		}
	});
	
	return construct;
});