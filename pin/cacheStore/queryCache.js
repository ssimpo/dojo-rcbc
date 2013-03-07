// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"simpo/store/local",
	"lib/md5",
	"dojo/json",
	"dojo/_base/lang",
	"simpo/typeTest",
	"simpo/interval"
], function(
	declare, Store, MD5, JSON, lang, typeTest, interval
) {
	"use strict";
	
	var construct = declare(null, {
		"store": null,
		"ready": false,
		
		constructor: function(){
			this.store = Store({
				"sessionOnly": true,
				"compress": false,
				"encrypt": false,
				"slicer": 50,
				"id": "rcbcPINqueryCache",
				"ready": lang.hitch(this, function(){
					this.ready = true;
				})
			});
		},
		
		getCache: function(lookup, action, timeout){
			timeout = (typeTest.isNumber(action) ? action : timeout);
			action = (typeTest.isNumber(action) ? undefined : action);
			timeout = ((timeout === undefined) ? (1.5 * 60 * 1000) : (timeout * 1000));
			
			if(this.ready){
				var obj = this._getObj(lookup);
				if(obj !== undefined){
					var cTimestamp = new Date().getTime();
					var timestamp = obj.timestamp;
					var data = obj.data;
					
					if(action !== undefined){
						if(cTimestamp < (timestamp + timeout)){
							var self = this;
							interval.add(function(){
								self._setAndReturnCache(lookup, action, self);
							});
						}
					}
					
					return data;
				}
			}
			
			return this._setAndReturnCache(lookup, action, this);
		},
		
		setCache: function(lookup, obj){
			if(this.ready){
				this.store.put({
					"data": obj,
					"timestamp": new Date().getTime()
				}, {
					"overwrite": true,
					"id": this._getId(lookup)
				});
			}
		},
		
		_getId: function(lookup){
			var txt = JSON.stringify(lookup);
			return MD5(txt.toLowerCase());
		},
		
		_getObj: function(lookup){
			var id = this._getId(lookup);
			var obj = this.store.get(id);
			
			return obj;
		},
		
		_setAndReturnCache: function(lookup, action, thisObj){
			if(action !== undefined){
				var obj = action(lookup);
				thisObj.setCache(lookup, obj);
				return obj;
			}
			
			return null;
		}
	});
	
	return construct;
});