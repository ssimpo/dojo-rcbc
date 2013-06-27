define([
	"dojo/_base/declare",
	"dijit/form/FilteringSelect",
	"dijit/form/ComboBox",
	"dojo/store/JsonRest",
	"dijit/form/TextBox",
	"dojo/dom-attr",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/aspect",
	"dojo/dom-construct",
	"simpo/typeTest",
	"dojo/when"
], function(
	declare, _select, _combo, jsonRest, textbox, domAttr, lang,
	array, aspect, domConstr, typeTest, when
){
	var construct = declare(null,{
		"autoComplete": false,
		"fieldName": "",
		"store":{},
		"storeFields": [],
		
		"_hiddenFields": [],
		
		constructor: function(){
			this._init(arguments[0]);
		},
		
		_init: function(args){
			this._createStore(args);
			this._trimStoreFields();
			aspect.after(
				this, "postCreate", lang.hitch(this._createHiddenFields)
			);
			this.fieldName = args.name;
		},
		
		_createStore: function(args){
			this.store = new jsonRest({
				"target": args.target
			});
		},
		
		_trimStoreFields: function(){
			array.forEach(this.storeFields, function(item, n){
				this.storeFields[n] = lang.trim(item);
			}, this);
		},
		
		clear: function(){
			this._autoCompleteText("");
		},
		
		_announceOption: function(node){
			if(!node){
				return;
			}
			
			var newValue;
			if(node == this.dropDown.nextButton ||
				node == this.dropDown.previousButton){
				newValue = node.innerHTML;
				this.item = undefined;
				this.value = '';
			}else{
				var item = this.dropDown.items[node.getAttribute("item")];
				
				newValue = (this.store._oldAPI ?	
					this.store.getValue(item, this.labelAttr) :
					item[this.labelAttr]).toString();
				
				this.set('item', item, false, newValue);
			}
			
			this.focusNode.value = this.focusNode.value.substring(0, this._lastInput.length);
			this.focusNode.setAttribute("aria-activedescendant", domAttr.get(node, "id"));
			this._autoCompleteText(newValue);
			this._setHiddenFields(item);
		},
		
		_createHiddenFields: function(item){
			if(this._hiddenFields.length == 0){
				if(this.storeFields.length > 0){
					array.forEach(this.storeFields, function(fieldName){
						var tx = new textbox({
							"type": "hidden",
							"value": "",
							"name": fieldName
						});
						this._hiddenFields.push(tx);
						domConstr.place(
							tx.domNode,
							this.domNode.parentElement
						);
					}, this)
				}
			}
		},
		
		_setHiddenFields: function(item){
			if(this.storeFields.length > 0){
				array.forEach(this.storeFields, function(fieldName, n){
					var value = (this.store._oldAPI ?
						this.store.getValue(item, fieldName) :
						item[fieldName]).toString();
					
					domAttr.set(this._hiddenFields[n].domNode, "value", value);
				}, this);
			}
		}
	});
	
	var construct2 = declare(null,{
		_setValueAttr: function(/*String*/ value, /*Boolean?*/ priorityChange, /*String?*/ displayedValue, /*item?*/ item){
			// summary:
			//		Hook so set('value', value) works.
			// description:
			//		Sets the value of the select.
			//		Also sets the label to the corresponding value by reverse lookup.
			if(!this._onChangeActive){ priorityChange = null; }

			if(item === undefined){
				if(value === null || value === ''){
					value = '';
					if(!lang.isString(displayedValue)){
						this._setDisplayedValueAttr(displayedValue||'', priorityChange);
						return;
					}
				}

				var self = this;
				this._lastQuery = value;
				when(this.store.get(value), function(item){
					if(typeTest.isArray(item)){
						array.every(item, function(cItem){
							if(typeTest.isEqual(cItem.id, value)){
								item = cItem;
								return false;
							}
							return true;
						}, this);
					}
					
					self._callbackSetLabel(item? [item] : [], undefined, undefined, priorityChange);
				});
			}else{
				this.valueNode.value = value;
				this.inherited(arguments);
			}
		}
	});
	
	var combo = declare([_combo, construct],{});
	var select = declare([_select, construct, construct2],{});
	
	return {
		load: function(id, require, callback){
			var constructor = (id == "static") ? select : combo;
			callback(constructor);
		}
	}
});