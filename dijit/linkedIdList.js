define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dojo/text!./linkedIdList/views/linkedIdList.html",
	"./linkedIdList/models/listItem",
	"dojo/store/Memory",
	"dojo/dom-attr",
	"dojo/dom-construct",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/_base/array",
	"dijit/registry",
	"simpo/typeTest"
], function(
	declare, _widget, _templated, template, listItem, memory,
	domAttr, domConstr, on, lang, domStyle, array, registry, typeTest
){
	"use strict";
	
	var construct = declare([_widget, _templated],{
		"templateString": template,
		"_data": {},
		"linkedId": "",
		"labelField": "type",
		"notesField": "notes",
		"value": {},
		"tooltipLabels": {},
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			domAttr.set(this.placeHolder, "innerHTML", this.defaultText);
			this._data = new memory({});
		},
		
		_getValueAttr: function(){
			var items = this._data.query({});
			var values = {};
			
			array.forEach(items, function(item){
				values[item.id] = item.item.get("value");
			}, this);
			
			return values;
		},
		
		_setDefaultTextAttr: function(value){
			this.defaultText = value;
			domAttr.set(this.placeHolder, "innerHTML", this.defaultText);
		},
		
		_setValueAttr: function(value){
			for(var id in value){
				this.add(value[id]);
			}
		},
		
		_makeArray: function(value){
			return ((typeTest.isArray(value)) ? value : new Array(value));
		},
		
		_testBlankData: function(data, fields){
			var hasValue = false;
			
			array.every(this._makeArray(fields), function(fieldName){
				var testValue = data[fieldName];
				if((testValue != "") && (testValue !== undefined) && (testValue !== null)){
					hasValue = true;
					return false;
				}
				return true;
			}, this);
			
			return hasValue;
		},
		
		add: function(data, tooltipLabels, dialogRef){
			if(this._testBlankData(data, this.valueField)){
				this._showHidePlaceHolder();
				
				tooltipLabels = ((tooltipLabels === undefined) ?
					this.tooltipLabels : tooltipLabels
				);
				data.id = this._getIdFromData(data);
				
				if(!this._updateItem(data)){
					var item = this._addItemToWidget(
						data, tooltipLabels, dialogRef
					);
					this._addItem(data, item);
				}
			
				this._showHidePlaceHolder();
				this._updateValue();
			}
		},
		
		_addItemToWidget: function(data, tooltipLabels, dialogRef){
			var item = this._createNewItem(data, tooltipLabels, dialogRef);
			domConstr.place(item.domNode, this.container);
			var br = domConstr.create("br",{
				"style":{"clear":"both"}
			}, this.container);
			this._addItemEvents(item, br);
			
			return item;
		},
		
		_addItem: function(data, item){
			this._data.put({ "id": data.id, "item": item });
		},
		
		_updateItem: function(data){
			var qry = this._getItemById(data.id);
			
			if(qry.length > 0){
				qry[0].item.update(data);
				return true;
			}else{
				return false;
			}
		},
		
		_getItemById: function(id){
			return this._data.query({"id":id});
		},
		
		_addItemEvents: function(item, br){
			on(
				item.domNode,
				"delete",
				lang.hitch(this, this._itemDeleted, br),
				br
			);
			
			on.emit(
				this.domNode,
				"additem", {
					"bubbles": false, "cancelable": false
				}
			);
		},
		
		_getIdFromData: function(data){
			var id;
			
			if(!this._hasProperty(data, "id")){
				id = this._createUnid();
			}else if(data.id == ""){
				id = this._createUnid();
			}else{
				id = data.id;
			}
			
			return id;
		},
		
		_createNewItem: function(data, tooltipLabels, dialogRef){
			var item = new listItem({
				"data": data,
				"linkedId": this.linkedId,
				"labelField": this.labelField,
				"notesField": this.notesField,
				"valueField": this.valueField,
				"tooltipLabels": tooltipLabels,
				"dialogRef": dialogRef
			});
			
			return item;
		},
		
		_createUnid: function(){
			var unid = "";
			for(var i = 1; i <= 32; i++){
				var no = Math.floor(Math.random()*15);
				unid += no.toString(15);
			}
			return unid.toUpperCase();
		},
		
		_showHidePlaceHolder: function(){
			var qry = this._getAllItems();
			if(qry.length == 0){
				domStyle.set(this.placeHolder, "display", "block");
			}else{
				domStyle.set(this.placeHolder, "display", "none");
			}
		},
		
		_getAllItems: function(){
			var qry;
			try{
				qry = this._data.query({});
			}catch(e){
				qry = new Array();
			}
			return qry;
		},
		
		_itemDeleted: function(br, event){
			domConstr.destroy(br);
			var widget = registry.byNode(event.target);
			this._data.remove(widget.data.id);
			
			this._showHidePlaceHolder();
			this._updateValue();
		},
		
		_updateValue: function(){
			var value = "";
			var query = this._data.query({});
			query.forEach(function(item){
				if(value != ""){
					value += ","
				}
				value += item.id;
			},this);
			
			if(query.length == 0){
				on.emit(this.domNode, "empty", { bubbles: false, cancelable: false });
			}
		},
		
		_itemEdit: function(br, event){
			var item = registry.byNode(event.target);
			var data = item.data;
			
			on.emit(this.domNode, "editItem", {
				"bubbles": false, "cancelable": false, "target": data, "item": item
			}, data, item);
		},
		
		reset: function(){
			var items = this._data.query({});
			array.forEach(items, function(item){
				item.item["delete"]();
			}, this);
		},
		
		_hasProperty: function(obj, propName){
			return Object.prototype.hasOwnProperty.call(obj, propName);
		},
	});
	
	return construct;
});