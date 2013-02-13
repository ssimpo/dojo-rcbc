// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"simpo/interval",
	"simpo/xhrManager",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/topic",
	"simpo/array"
], function(
	declare, interval, xhrManager, array, lang, topic, iarray
) {
	"use strict";
	
	var construct = declare(null, {
		"_serviceIdsToUpdate": [],
		"_serviceCache": [],
		
		constructor: function(){
			interval.add(
				lang.hitch(this, this._callServicesUpdate), true, 2
			);
			//interval.add(
				//lang.hitch(this, this._updateFromServiceCache), true, 2
			//);
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
			
			if(/^[A-Fa-f0-9]{32,32}$/.test(category)){
				if(this.get(category.toLowerCase())){
					var query = this.query(function(obj){
						if(self._hasProperty(obj, "data")){
							if(self._hasProperty(obj.data, "service")){
								return (obj.data.service.toLowerCase() === category.toLowerCase());
							}
						}
						return false;
					});
					
					return query.sort(function(a, b){
						return (((a.data.title) < (b.data.title)) ? -1 : 1);
					});
				}else{
					return [];
				}
			}else{
				var query = this.query(function(obj){
					if(self._isServiceItem(obj)){
						return self._itemHasCategory(obj, section, category);
					}else{
						return false;
					}
				});
				
				return query.sort(function(a, b){
					return (((a.data.serviceName + a.data.orgName) < (b.data.serviceName + b.data.orgName)) ? -1 : 1);
				});
			}
		},
		
		_itemHasService: function(obj, service){
			if(this._hasProperty(obj, "type")){
				if((obj.type = "event") || (obj.type == "activity")){
					if(this._hasProperty(obj, "service")){
						return (obj.service.toLowerCase() == service.toLowerCase());
					}
				}
			}
			
			return false;
		},
		
		_getCategoryFieldName: function(section){
			if(!this._isNumber(section)){
				section = (this._isEqual(section,"Family Services")) ? 1 : 2;
			}
			
			return "category" + section.toString();
		},
		
		getCategoryList: function(section){
			var services = this.query({"type":"service"});
			var categoryList = {};
			var fieldName = this._getCategoryFieldName(section);
			
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
						var cTags = tag.split(";");
						array.forEach(cTags, function(cTag){
							if(!this._isBlank(cTag)){
								if(this._hasProperty(tags, cTag)){
									tags[cTag]++;
								}else{
									tags[cTag] = 1; 
								}
							}
						},this);
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
				xhrManager.add({
					"url": "/pin.nsf/getService2?openagent&stub=false&id="+ids.join(","),
					"success": this._updateServiceSuccess,
					"errorMsg": "Failed to update services - now working from cache",
					"hitch": this
				});
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
		
		_updateServiceSuccess: function(data, callback){
			callback = ((callback === undefined) ? function(){} : callback);
			if(this._hasProperty(data, "services")){
				iarray.forEach(
					data.services,
					this._throttle,
					this._updateService,
					this
				).then(
					lang.hitch(this, callback)
				);
			}
		},
		
		_removeOldServices: function(data){
			var lookup = new Object();
			
			array.forEach(data.services, function(item){
				lookup[item.id.toLowerCase()] = true;
			}, this);
			
			var query = this.query({"type":"service"});
			array.forEach(query, function(item){
				if(!this._hasProperty(lookup, item.id.toLowerCase())){
					this.remove(item.id);
				}
			}, this);
		},
		
		_counter: 0,
		_updateService: function(service){
			try{
				var item = this._convertServiceToDataItem(service);
				var cItem = this.getService(item.id);
				var callUpdate = false;
				
				if((item.isStub) && (cItem !== null)){
					item = lang.mixin(cItem, item);
				}
				
				if(item.isStub){
					this._serviceIdsToUpdate.push(item.id);
				}else if(this._needsUpdating(cItem, item)){
					this._serviceIdsToUpdate.push(item.id);
				}
				
				var isStub = this._isServiceStub(item);
				item.isStub = isStub;
				item.data.isStub = isStub;
				this.put(item);
				this._checkForServiceVenues(service);
			}catch(e){}
		}
	});
	
	return construct;
});