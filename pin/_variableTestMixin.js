// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-attr",
	"dijit/registry"
], function(
	declare, lang, domAttr, registry
){
	"use strict";
	
	var construct = declare(null, {
		"_trueValues": ["yes", "true", "on", "checked", "ticked", "1"],
		"_falseValues": ["no", "false", "off", "unchecked", "unticked", "0"],
		
		_isTrue: function(value){
			if(value === true){
				return true;
			}
			if(value === 1){
				return true;
			}
			
			try{
				var stringValue = value.toString();
				for(var i = 0; i < this._trueValues.length; i++){
					if(this._isEqual(stringValue, this._trueValues[i])){
						return true;
					}
				}
			}catch(e){
				return false;
			}
			
			return false;
		},
		
		_isFalse: function(value){
			if(value === false){
				return true;
			}
			if(value === 0){
				return true;
			}
			if(this._isBlank(value)){
				return true;
			}
			try{
				var stringValue = value.toString();
				for(var i = 0; i < this._falseValues.length; i++){
					if(this._isEqual(stringValue, this._falseValues[i])){
						return true;
					}
				}
			}catch(e){
				return false;
			}
			
			return false;
		},
		
		_isEqual: function(value1, value2){
			if(value1 === value2){
				return true;
			}else if((Object.prototype.toString.call(value1) === '[object String]') && (Object.prototype.toString.call(value2) === '[object String]')){
				return (lang.trim(value1.toLowerCase()) == lang.trim(value2.toLowerCase()));
			}else if(this._isBlank(value1) && this._isBlank(value2)){
				return true;
			}
			
			return false;
		},
		
		_isBlank: function(value){
			if((value === null) || (value === undefined) || (value === "") || (value === false)){
				return true;
			}
			
			if(this._isString(value)){
				return (lang.trim(value.replace(/\&nbsp\;/g," ")) === "");
			}else if(this._isArray(value)){
				if(value.length == 0){
					return true;
				}else{
					return this._isBlankArray(value);
				}
			}else if(this._isNumber(value)){
				return (value === 0);
			}else if(this._isObject(value)){
				if(this._isElement(value)){
					return this._isBlank(domAttr.get(value, "innerHTML"));
				}else{
					return (this._isEmptyObject(value) || this._isBlankObject(value));	
				}
			}
			
			return false;
		},
		
		_isObject: function(value){
			return ((Object.prototype.toString.call(value) === '[object Object]') || (typeof value === "object"));
		},
		
		_isArray: function(value){
			return (Object.prototype.toString.call(value) === '[object Array]');
		},
		
		_isNumber: function(value){
			return (Object.prototype.toString.call(value) === '[object Number]');
		},
		
		_isString: function(value){
			return (Object.prototype.toString.call(value) === '[object String]');
		},
		
		_isBlankArray: function(ary){
			for(var i = 0; i < ary.length; i++){
				if(!this._isBlank(ary[i])){
					return false;
				}
			}
			
			return true;
		},
		
		_isEmptyObject: function(obj){
			for(var key in obj){
				if(obj.hasOwnProperty(key)){
					return false;
				}
			}
			return true;
		},
		
		_isBlankObject: function(obj){
			for(var key in obj){
				if(!this._isBlank(obj[key])){
					return false
				}
			}
			
			return true;
		},
		
		_isElement: function(o){
			return (
				(typeof HTMLElement === "object") ?
					(o instanceof HTMLElement) :
					(o && typeof o === "object" && o.nodeType === 1 && typeof o.nodeName === "string")
			);
		},
		
		_isWidget: function(obj){
			try{
				if((typeof obj === "object") && (obj !== undefined) && (obj !== null)){
					if(Object.prototype.hasOwnProperty.call(obj, "domNode")){
						try{
							var widget = registry.byNode(obj.domNode);
							return (widget !== undefined);
						}catch(e){}
					}
				}
			}catch(e){
				console.info("Failed to do isWidget test");
			}
			
			return false;
		}
	});
	
	return construct;
});