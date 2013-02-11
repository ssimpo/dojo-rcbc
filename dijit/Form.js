define([
	"dojo/_base/declare",
	"dojo/i18n",
	"dojo/i18n!./nls/Form",
	"dijit/form/Form",
	"dijit/registry",
	"dojo/on",
	"dojo/ready",
	"dojo/_base/lang",
	"simpo/store/local",
	"lib/md5"
], function(
	declare, i18n, strings, Form, registry, on, ready, lang, memory, md5
){
	"use strict";
	
	var construct = declare([Form], {
		"i18n": strings,
		"store": false,
		"compress": true,
		"encrypt": true,
		"sessionOnly": true,
		"useStore": false,
		
		constructor: function(args){
			this._init(args);
			
			if(this._hasProperty(args, "id")){
				args.id = this._getStoreId(args);
				if(this.useStore){
					this.store = new memory({
						"compress": this.compress,
						"encrypt": this.encrypt,
						"sessionOnly": this.sessionOnly
					});
					//this.store.clear(true);
				}
			}
		},
		
		_init: function(args){
			if(this._isObject(args)){
				for(var key in args){
					this[key] = args[key];
				}
			}
		},
		
		_isObject: function(obj){
			return (Object.prototype.toString.call(obj) === '[object Object]');
		},
		
		_getStoreId: function(args){
			var id = location.pathname + location.search + '#' + args.id;
			return md5(id);
		},
		
		postCreate: function(){
			if(this.store){
				ready(lang.hitch(this, function(){
					var qry = this.store.query({"id":"formData"});
					if(qry.length > 0){
						this.set("value", qry[0].formData);
					}
					
					//console.log("FORM POSTCREATE: ",qry[0].formData);
					if(this.useStore){
						registry.findWidgets(this.domNode).forEach(function(widget){
							on(widget, "focusout", lang.hitch(this, this._widgetUpdate));
						}, this);
					}
				}));
			}
		},
		
		_hasProperty: function(obj, propName){
			return Object.prototype.hasOwnProperty.call(obj, propName);
		},
		
		_widgetUpdate: function(event){
			if(this.store){
				//console.log("BLUR: ",this.get("value"));
				if(this.useStore){
					this.store.put({"id":"formData", "formData":this.get("value")});
				}
			}
		}
	});
	
	return construct;
});