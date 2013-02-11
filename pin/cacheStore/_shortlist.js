// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"simpo/interval",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/topic"
], function(
	declare, interval, array, lang, topic
) {
	"use strict";
	
	var construct = declare(null, {
		getShortlist: function(){
			var shortlist = this.get("shortlist");
			if(this._isBlank(shortlist)){
				shortlist = this._createBlankShortList();
				this.put(shortlist);
				topic.publish("/rcbc/pin/changeShortlist", shortlist);
			}
			return this._sanitizeShortlist(shortlist);
		},
		
		inShortlist: function(id){
			var shortlist = this.getShortlist();
			var found = false;
			
			if(this._hasProperty(shortlist, "services")){
				array.every(shortlist.services, function(serviceId){
					if(this._isEqual(serviceId, id)){
						found = true;
						return false;
					}
					return true;
				}, this);
			}
			
			return found;
		},
		
		removeFromShortlist: function(id){
			var shortlist = this.getShortlist();
			
			var newList = new Array();
			array.forEach(shortlist.services, function(serviceId){
				if(!this._isEqual(serviceId, id)){
					newList.push(serviceId);
				}
			}, this);
			
			this._updateShortlist(newList);
		},
		
		emptyShortlist: function(){
			var shortlist = this._createBlankShortList();
			this.put(shortlist);
			topic.publish("/rcbc/pin/changeShortlist", shortlist);
			
			return shortlist;
		},
		
		addToShortlist: function(id){
			var shortlist = this.getShortlist();
			
			var found = false;
			array.every(shortlist.services, function(serviceId){
				if(this._isEqual(serviceId, id)){
					found = true;
					return false;
				}
				return true;
			}, this);
			
			if(!found){
				if(this._hasProperty(shortlist, "services")){
					shortlist.services.push(id);
				}else{
					shortlist.services = new Array(id);
				}
				this._updateShortlist(shortlist.services);
			}
		},
		
		_updateShortlist: function(ary){
			var shortlist = this.getShortlist();
			shortlist.services = ary;
			this.put(shortlist);
			topic.publish("/rcbc/pin/changeShortlist", shortlist);
		},
		
		_sanitizeShortlist: function(shortlist){
			var ids;
			if(this._hasProperty(shortlist, "services")){
				if(this._isArray(shortlist.services)){
					ids = shortlist.services;
				}else{
					return this._createBlankShortList();
				}
			}else{
				if(this._isArray(shortlist)){
					ids = shortlist;
				}else{
					return this._createBlankShortList();
				}
			}
			
			var lookup = new Object();
			array.forEach(ids, function(id){
				if(/[A-Za-z0-9]{32,32}/.test(id)){
					lookup[id.toLowerCase()] = true;
				}
			}, this);
			
			var ids = new Array();
			for(var id in lookup){
				ids.push(id);
			}
			
			return {
				"type": "shortlist",
				"id": "shortlist",
				"services": ids
			};
		},
		
		_createBlankShortList: function(){
			return {
				"type": "shortlist",
				"id": "shortlist",
				"services": new Array()
			};
		}
	});
	
	return construct;
});