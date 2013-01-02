// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/topic"
], function(
	declare, array, lang, request, topic
) {
	"use strict";
	
	var construct = declare(null, {
		constructor: function(){
			this.addIntervalCheck(function(){
				if(!this._isBlank(this._serviceIdsToUpdate)){
					this.addIntervalCommand(
						lang.hitch(this, this._callServicesUpdate)
					);
				}
				if(!this._isBlank(this._serviceCache)){
					this.addIntervalCommand(
						lang.hitch(this, this._updateFromServiceCache)
					);
				}
			});
		},
		
		getService: function(id){
			var service = this.get(id);
			if(!this._isBlank(service)){
				if(this._hasProperty(service, "type")){
					if(service.type == "service"){
						return service;
					}
				}
			}
			
			return null;
		},
		
		updateService: function(service){
			if(this._isString(service)){
				if(service.length == 32){
					this._serviceIdsToUpdate.push(service);
					return true;
				}else{
					return false;
				}
			}else if(this._isObject(service)){
				if(this._hasOwnProperty(service, "id")){
					this._serviceIdsToUpdate.push(service.id);
					return true;
				}else{
					return false;
				}
			}
				
			return false;
		},
		
		_callServicesUpdate: function(){
			var ids = new Array();
			for(var i = 0; ((i < this._serverThrottle) && (i < this._serviceIdsToUpdate.length)); i++){
				ids.push(this._serviceIdsToUpdate.shift());
			}
			
			if(!this._isBlank(ids)){
				this._xhrCall(
					this._updateUrls.serviceUpdate+"&id="+ids.join(","),
					lang.hitch(this, this._updateServiceSuccess),
					"Failed to update services - now working from cache"
				);
			}
		},
		
		_isServiceItem: function(item){
			if(this._hasProperty(item, "type") && this._hasProperty(item, "data")){
				if(this._isEqual(item.type, "service")){
					return true;
				}
			}
			
			return false;
		},
		
		_isServiceStub: function(obj){
			return (!this._hasOwnProperty(obj.data, "description") && !this._hasOwnProperty(obj.data, "venues") && !this._hasOwnProperty(obj.data, "contacts"));
		},
		
		_updateServiceSuccess: function(data){
			if(this._hasProperty(data, "services")){
				this._serviceCache = this._serviceCache.concat(data.services);
			}
		},
		
		_updateFromServiceCache: function(){
			if(!this._isBlank(this._serviceCache)){
				var services = new Array();
				for(var i = 0; ((i < this._throttle) && (i < this._serviceCache.length)); i++){
					services.push(this._serviceCache.shift());
				}
				this._updateServicesFromArray(services);
			}
		},
		
		_updateServicesFromArray: function(services){
			if(!this._isBlank(services)){
				array.forEach(services, this._updateService, this);
			}
		},
		
		_updateService: function(service){
			try{
				var item = this._convertServiceToDataItem(service);
				var cItem = this.getService(item.id);
				var callUpdate = false;
				
				if((item.isStub) && (cItem !== null)){
					if(this._needsUpdating(cItem, item)){
						this._serviceIdsToUpdate.push(item.id);
					}
					
					item = lang.mixin(cItem, item);
					var isStub = this._isServiceStub(item);
					item.isStub = isStub;
					item.data.isStub = isStub;
					
					this.put(item);
					topic.publish("/rcbc/pin/updateService", item.id, item);
					if(item.isStub){
						this._serviceIdsToUpdate.push(item.id);
					}
					this._checkForServiceVenues(service);
				}else{
					var isStub = this._isServiceStub(item);
					item.isStub = isStub;
					item.data.isStub = isStub;
					
					if(item.isStub){
						this._serviceIdsToUpdate.push(item.id);
					}
					this.put(item);
					topic.publish("/rcbc/pin/updateService", item.id, item);
					this._checkForServiceVenues(service);
				}
			}catch(e){}
		}
	});
	
	return construct;
});