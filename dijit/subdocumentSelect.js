define([
	"dojo/_base/declare",
	"dojo/i18n",
	"dojo/i18n!./nls/subDocumentSelect",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/text!./views/subDocumentSelect.html",
	"dojo/on",
	"dojo/_base/lang",
	"./dialog",
	"dijit/registry",
	
	"dijit/form/Button",
	"rcbc/dijit/linkedIdList",
	"rcbc/dijit/TextBox",
	"rcbc/dijit/combo!static",
	"rcbc/dijit/dialogOkButton",
	"dijit/form/Textarea"
], function(
	declare, i18n, strings, _widget, _templated, _wTemplate, template,
	on, lang, Dialog, registry
){
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate], {
		"i18n": strings,
		"templateString": template,
		"buttonLabel": "",
		"emptyText": "Nothing has been selected",
		"popupTemplate": "",
		"popupTitle": "",
		"labelField": "type",
		"notesField": "notes",
		"valueField": "value",
		"value": {},
		
		"_dialog": {},
		"_dialogs": [],
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._addLabels();
			this._addEvents();
		},
		
		__init: function(){
			
		},
		
		_addLabels: function(){
			if(this.buttonLabel != ""){
				this.addItem.set("label", this.buttonLabel);
			}
			this.itemList.set("linkedId", this.name);
			this.itemList.set("defaultText", this.emptyText);
			this.itemList.set("labelField", this.labelField);
			this.itemList.set("valueField", this.valueField);
		},
		
		_getValueAttr: function(){
			return this.itemList.get("value");
		},
		
		_setValueAttr: function(value){
			var dia = new Dialog({
				"title": this.popupTitle,
				"href": this.dialogTemplate
			});
			
			for(var id in value){
				var itemObj = value[id];
				this.itemList.add(
					value[id],
					dia.getTooltips(),
					dia
				);
				on(dia, "hide", lang.hitch(this, this._dialogHide));
			}
		},
		
		_addEvents: function(){
			on(
				this.addItem,
				"click",
				lang.hitch(this, this._addItemOnClick)
			);
			
			on(
				this.itemList,
				"edit",
				lang.hitch(this, this._editItem)
			);
		},
		
		_addItemOnClick: function(){
			var dia = this._addDialog();
			dia.clear();
			dia.show();
			
			on(dia, "hide", lang.hitch(this, this._dialogHide));
		},
		
		_editItem: function(event){
			var item = registry.byNode(event.target);
			var dia = item.dialogRef;
			dia.clear();
			dia._initialFields = lang.clone(item.data);
			this._dialogs.push(dia);
			dia.show();
			
			for(var fieldName in item.data){
				dia.update(fieldName, item.data[fieldName]);
			}
			item["delete"]();
		},
		
		_addDialog: function(){
			var dia = new Dialog({
				"title": this.popupTitle,
				"href": this.dialogTemplate
			});
			on(dia, "load", lang.hitch(this, this.__init, dia));
			this._dialogs.push(dia);
			return dia;
		},
		
		_dialogHide: function(event){
			var dia = this._dialogs.pop();
			if(dia.okButton){
				this.itemList.add(
					dia.get("value"),
					dia.getTooltips(),
					dia
				);
				this.set("value", this.itemList.get("value"));
			}else{
				if(dia._initialFields !== {}){
					this.itemList.add(
						dia._initialFields,
						dia.getTooltips(),
						dia
					);
					this.set("value", this.itemList.get("value"));
				}
			}
		}
	});
	
	return construct;
});