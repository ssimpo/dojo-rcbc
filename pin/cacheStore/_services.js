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
		"_serviceIdsToUpdate": [],
		"_serviceCache": [],
		
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
		
		getCategory: function(section, category){
			var self = this;
			
			var query = this.query(function(object){
				if(self._isServiceItem(object)){
					return self._itemHasCategory(object, section, category);
				}else{
					return false;
				}
			});
			
			return query.sort(function(a, b){
				return (((a.data.serviceName + a.data.orgName) < (b.data.serviceName + b.data.orgName)) ? -1 : 1);
			});
		},
		
		getCategoryList: function(section){
			var services = this.query({"type":"service"});
			var categoryList = {};
			
			if(!this._isNumber(section)){
				section = (this._isEqual(section,"Family Services")) ? 1 : 2;
			}
			var fieldName = "category" + section.toString();
			
			array.forEach(services, function(service){
				var categories = this._getCategoryValue(service, fieldName);
				
				array.forEach(categories, function(category){
					if(!this._isBlank(category)){
						if(!this._hasProperty(categoryList, category)){
							categoryList[category] = true;
						}
					}
				}, this);
			}, this);
			
			return categoryList;
		},
		
		getTag: function(section, category, tag){
			var self = this;
			
			var query = this.query(function(object){
				if(self._isServiceItem(object)){
					if(self._itemHasCategory(object, section, category)){
						return (self._itemHasTag(object, tag));
					}else{
						return false;
					}
				}else{
					return false;
				}
			});
			
			return query.sort(function(a, b){
				return (((a.data.serviceName + a.data.orgName) < (b.data.serviceName + b.data.orgName)) ? -1 : 1);
			});
		},
		
		getTagsList: function(section, category){
			var services = this.getCategory(section, category);
			var tags = {};
			array.forEach(services, function(service){
				array.forEach(service.data.tags, function(tag){
					if(!this._isBlank(tag)){
						if(this._hasProperty(tags, tag)){
							tags[tag]++;
						}else{
							tags[tag] = 1; 
						}
					}
				}, this);
			}, this);
			
			return tags;
		},
		
		_getCategoryValue: function(service, fieldName){
			if(this._isObject(service)){
				if(this._hasProperty(service, "data")){
					service = service.data;
				}
				
				if(this._isObject(service)){
					if(this._hasProperty(service, fieldName)){
						var categories = service[fieldName];
						if(this._isArray(categories)){
							return categories;
						}
					}
				}
			}
			
			return new Array();
		},
		
		_callServicesUpdate: function(){
			var ids = new Array();
			for(var i = 0; ((i < this._serverThrottle) && (i < this._serviceIdsToUpdate.length)); i++){
				ids.push(this._serviceIdsToUpdate.shift());
			}
			
			if(!this._isBlank(ids)){
				this._xhrCall(
					"/pin.nsf/getService2?openagent&stub=false&id="+ids.join(","),
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
		
		_removeOldServices: function(data){
			var lookup = new Object();
			
			array.forEach(data, function(item){
				lookup[item.id.toLowerCase()] = true;
			}, this);
			
			var query = this.query({"type":"service"});
			array.forEach(query, function(item){
				if(!this._hasProperty(item.id.toLowerCase())){
					this.remove(item.id);
				}
			}, this);
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