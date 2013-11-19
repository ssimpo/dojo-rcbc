define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dojo/i18n",
	"dojo/i18n!./nls/radioGrid",
	"dojo/text!./views/radioGrid.html",
	"dojo/dom-construct",
	"dojo/_base/array",
	"dijit/form/RadioButton",
	"dojo/on",
	"dojo/_base/lang"
], function(
	declare, _widget, _templated, i18n, strings, template, domConstr, array,
	Radio, on, lang
){
	"use strict";
	
	var construct = declare([_widget, _templated],{
		"i18n": strings,
		"templateString": template,
		"cols": 0,
		"values": [],
		"value": "",
		"name": "",
		"valueObj":{},
		"defaultValue": "",
		
		"_radios": [],
		
		postCreate: function(){
			if(this.cols < 0){
				this.cols = this.values.length;
			}
			if(this.defaultValue == "" && this.values.length > 0){
				this.defaultValue = this.values[0];
			}
			this._createRadios();
			this.checkDefault();
		},
		
		_createRadios: function(){
			var tr = this._createNewRow();
			array.forEach(this.values, function(value, n){
				var rd = this._createRadioUnit(value);
				if((n % this.cols) == 0){
					tr = this._createNewRow();
				}
				
				domConstr.place(rd, tr);
				this.valueObj[value] = false;
			}, this);
			
			for(var i = 0; i <= (this.values.length % this.cols); i++){
				domConstr.create("td", {"innerHTML":"&nbsp;"} , tr);
			}
		},
		
		checkDefault: function(){
			var _defaultSet = false;
			array.forEach(this.values, function(value, n){
				if(this.defaultValue == value && !_defaultSet){
					this._radios[n].set("checked", true);
					_defaultSet = true;
				}
			}, this);
			
			if(!_defaultSet){
				this._radios[0].set("checked", true);
				this.defaultValue = this.values[0];
			}
		},
		
		_createNewRow: function(){
			return domConstr.create("tr",{},this.containerNode);
		},
		
		_createRadioUnit: function(value){
			var td = domConstr.create("td");
			var radio = this._createRadio(value);
			var label = this._createLabel(value, radio.id);
			
			domConstr.place(radio.domNode, td);
			domConstr.place(label, td);
			
			this._radios.push(radio);
			return td;
		},
		
		_createRadio: function(value){
			var id = this._randomId("radioGrid");
			
			var rd = new Radio({
				"name": this.name,
				"id": id,
				"value": value
			});
			
			on(rd, "change", lang.hitch(this, this._onChange, value));
			
			return rd;
		},
		
		_createLabel: function(label, idFor){
			var lb = domConstr.create("label", {
				"for": idFor,
				"innerHTML": label
			});
			
			return lb;
		},
		
		_onChange: function(label, value){
			this._setValueObj(label, value);
			this._setValue();
			
			on.emit(this, "change", {bubbles: true, cancelable: true});
			on.emit(this.domNode, "change", {bubbles: true, cancelable: true});
		},
		
		_setValueObj: function(label, value){
			if(value){
				this.valueObj[label] = true;
			}else{
				this.valueObj[label] = false;
			}
		},
		
		_setValue: function(){
			var values = new Array();
			for(var label in this.valueObj){
				if(this.valueObj[label]){
					this.set("value", label);
				}
			}
		},
		
		_randomId: function(prefix){
			var no = Math.floor((Math.random()*1000000000000)+1);
			return prefix + "_" + no.toString();
		},
		
		validate: function(){
			return true;
		}
	});
	
	return construct;
});