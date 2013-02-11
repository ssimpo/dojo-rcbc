define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dojo/text!../views/listItem.html",
	"dojo/dom-construct",
	"dojo/dom-class",
	"dijit/form/Button",
	"dojo/_base/lang",
	"dojo/on",
	"dijit/Tooltip",
	"dijit/form/TextBox",
	"dojo/_base/array",
	"dojo/query"
], function(
	declare, _widget, _templated, template, domConstr, domClass,
	Button, lang, on, Tooltip, TextBox, array, $
){
	"use strict";
	
	var construct = declare([_widget, _templated],{
		"templateString": template,
		"linkedId": "",
		"labelField": "type",
		"notesField": "notes",
		"valueField": "value",
		"data": {},
		"tooltipLabels": {},
		"dialogRef": {},
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._addHiddenInputs();
			this._addValue();
			this._addLabel();
			this._addButton();
			this._addTooltip();
		},
		
		_getValueAttr: function(){
			return this.data;
		},
		
		_getField: function(fieldName){
			var value = null;
			
			if(fieldName != "" && fieldName !== null){
				value = lang.getObject("data."+fieldName, false, this);
			}
			
			return value;
		},
		
		_getValueFromFieldArray: function(fieldArray){
			var value;
			if(fieldArray.constructor === Array){
				array.every(fieldArray, function(fieldName){
					value = this._getField(fieldName);
					return (
						(value == "" || value == undefined || value == null)
						? true : false
					);
				}, this);
			}else{
				value = this._getField(fieldArray);
			}
			
			return value;
		},
		
		_addHiddenInputs: function(){
			for(var prop in this.data){
				var tx = new TextBox({
					"type": "hidden",
					"name": this.linkedId+"["+prop+"]["+this.data.id+"]",
					"value": this.data[prop]
				})
				
				domConstr.place(tx.domNode,this.domNode);
			}
		},
		
		_addValue: function(){
			var span = domConstr.create("span", {
				"innerHTML": this._getValueFromFieldArray(this.valueField)
			}, this.contentNode, "first");
			
			on(span, "click", lang.hitch(this, this._editItem));
		},
		
		_addLabel: function(){
			var label = this._getValueFromFieldArray(this.labelField);
			if(label !== null){
				var span = domConstr.create("span", {
					"innerHTML": "<b>"+label+":</b>&nbsp;"
				}, this.contentNode, "first");
				
				on(span, "click", lang.hitch(this, this._editItem));
			}
		},
		
		_addTooltip: function(){
			var html = "";
			for(var labelName in this.tooltipLabels){
				var value = this._getValueFromFieldArray(labelName);
				
				if((value !== null) && (value !== undefined) && (value != "")){
					html += "<tr>";
					html += "<th class=\"label r b\">"+this.tooltipLabels[labelName]+":</th>";
					html += "<td class=\"b\">"+this.data[labelName]+"</td>";
					html += "</tr>";
				}
			}
			
			if(html != ""){
				html = "<div class=\"dojoDijitInfoTooltip\"><table>"+html+"<tr><th class=\"r\">&nbsp;</th><td>&nbsp;</td></table></div>";
				var tooltip = new Tooltip({
					"connectId": this.contentNode,
					"label": html
				});
			}
		},
		
		_addButton: function(){
			var btn = new Button({"label": "X"});
			on(
				btn.domNode,
				"click",
				lang.hitch(this, this._deleteButtonOnClick)
			);
			domConstr.place(btn.domNode, this.container, "first");
			
			$(".dijitButtonNode", btn.domNode).every(function(span){
				domClass.remove(span, "dijitButtonNode");
				domClass.add(span, "dijitButtonNodeLinkedIdList");
			},this)
		},
		
		_editItem: function(){
			on.emit(
				this.domNode,
				"edit",
				{ "bubbles": true, "cancelable": false }
			);
		},
		
		update: function(data){
			
		},
		
		"delete": function(){
			this._deleteButtonOnClick();
		},
		
		_deleteButtonOnClick: function(event){
			on.emit(this.domNode, "delete", {
				bubbles: false,
				cancelable: false
			});
			this.destroy();
		}
	});
	
	return construct;
});