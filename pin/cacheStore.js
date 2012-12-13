// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"./_variableTestMixin",
	"simpo/store/local",
	"dojo/aspect",
	"dojo/_base/lang",
	"dojo/has",
	"dojo/on",
	"dojo/_base/array",
	"dojo/request",
	"dojo/topic",
	"simpo/webworker",
	"dojo/json"
], function(
	declare, _variableTestMixin, store, aspect, lang, has, on, array,
	request, topic, webworker, JSON
){
	"use strict";
	
	var construct = declare([_variableTestMixin, store], {
		"id": "rcbcPIN",
		"sessionOnly": false,
		"compress": true,
		"encrypt": false,
		
		"_menuUpdateUrl": "/test/stephen/pin.nsf/getMenu?openagent",
		"_serviceUpdateUrl": "/test/stephen/pin.nsf/getService?openagent",
		"_worker":{},
		
		constructor: function(args){
			this._initWorker();
			
			this._worker.postMessage({
				"type": "command",
				"command": "updateStubs"
			});
		},
		
		_initWorker: function(){
			this._worker = new webworker({
				"src":"/scripts/rcbc/pin/workers/getData"
			});
			
			on(
				this._worker,
				"message",
				lang.hitch(this, this._handleWorkerMessage)
			);
		},
		
		getShortlist: function(){
			var shortlist = this.get("shortlist");
			if(this._isBlank(shortlist)){
				shortlist = {
					"type": "shortlist",
					"id": "shortlist",
					"services": new Array()
				};
				this.put(shortlist);
				topic.publish("/rcbc/pin/changeShortlist", shortlist);
			}
			
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
				if(shortlist.hasOwnProperty("services")){
					shortlist.services.push(id);
				}else{
					shortlist.services = new Array(id);
				}
				this._updateShortlist(shortlist.services);
			}
		},
		
		removeFromShortlist: function(id){
			var shortlist = this.getShortlist();
			
			var newList = new Array();
			array.forEach(shortlist.services, function(service){
				if(!this.isEqual(service.id, id)){
					newList.push(service.id);
				}
			}, this);
			
			this._updateShortlist(newList);
		},
		
		_updateShortlist: function(ary){
			var shortlist = this.getShortlist();
			shortlist.services = ary;
			this.put(shortlist);
			topic.publish("/rcbc/pin/changeShortlist", shortlist);
		},
		
		getService: function(id){
			var service = this.query({"id":id});
			if(!this._isBlank(service)){
				service = service[0];
				if(service.hasOwnProperty("type")){
					if(service.type == "service"){
						return service;
					}
				}
			}
			
			return null;
		},
		
		getTag: function(section, category, tag){
			var self = this;
			
			return this.query(function(object){
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
		},
		
		getTagsList: function(section, category){
			var services = this.getCategory(section, category);
			var tags = {};
			array.forEach(services, function(service){
				array.forEach(service.data.tags, function(tag){
					if(!this._isBlank(tag)){
						if(tags.hasOwnProperty(tag)){
							tags[tag]++;
						}else{
							tags[tag] = 1; 
						}
					}
				}, this);
			}, this);
			
			return tags;
		},
		
		getCategory: function(section, category){
			var self = this;
			
			return this.query(function(object){
				if(self._isServiceItem(object)){
					return self._itemHasCategory(object, section, category);
				}else{
					return false;
				}
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
						if(!categoryList.hasOwnProperty(category)){
							categoryList[category] = true;
						}
					}
				}, this);
			}, this);
			
			return categoryList;
		},
		
		updateVenue: function(venueId){
			this._worker.postMessage({
				"type": "command",
				"command": "updateVenueCache",
				"data": [venueId]
			});
		},
		
		updateService: function(serviceId){
			this._worker.postMessage({
				"type": "command",
				"command": "updateCache",
				"data": [serviceId]
			});
		},
		
		_getCategoryValue: function(service, fieldName){
			if(this._isObject(service)){
				if(service.hasOwnProperty("data")){
					service = service.data;
				}
				
				if(this._isObject(service)){
					if(service.hasOwnProperty(fieldName)){
						var categories = service[fieldName];
						if(this._isArray(categories)){
							return categories;
						}
					}
				}
			}
			
			return new Array();
		},
		
		_handleWorkerMessage: function(e){
			var message = e.message.message;
			var type = e.message.type;
			
			if(this._isEqual(type, "updateStubs")){
				this._updateStubsSuccess(message);
			}else if(this._isEqual(type, "updateCache")){
				try{
					var data = JSON.parse(message);
					this._updateCacheSuccess(data);
				}catch(e){
					//console.error(e, message);
				}
			}else if(this._isEqual(type, "updateVenueCache")){
				try{
					var data = JSON.parse(message);
					this._updateVenueCacheSuccess(data);
				}catch(e){
					//console.error(e, message);
				}
			}
		},
		
		_updateServiceById: function(service){
			var data = this._convertServiceToDataItem(service);
			this.put(data);
			topic.publish("/rcbc/pin/updateService", data.id, data);
		},
		
		_updateVenueById: function(venue){
			var data = this._convertVenueToDataItem(venue);
			this.put(data);
			topic.publish("/rcbc/pin/updateVenue", data.id, data);
		},
		
		_updateCacheSuccess: function(data){
			console.log("UPDATING CACHE", data);
			array.forEach(data.services, function(service){
				this._updateServiceById(service);
			}, this);
			
			var venueLookup = this._getUpdateVenueCacheArray(data);
			if(!this._isBlank(venueLookup)){
				this._worker.postMessage({
					"type": "command",
					"command": "updateVenueCache",
					"data": venueLookup
				});
			}
		},
		
		_updateVenueCacheSuccess: function(data){
			console.log("UPDATING VENUE CACHE", data);
			array.forEach(data.venues, function(venue){
				this._updateVenueById(venue);
			}, this);
		},
		
		_getUpdateVenueCacheArray: function(data){
			var venues = new Array();
			array.forEach(data.services, function(service){
				if(service.hasOwnProperty("venues")){
					if(this._isArray(service.venues)){
						array.forEach(service.venues, function(venue){
							if(venue.hasOwnProperty("venueId")){
								venues.push(venue.venueId);
							}
						}, this);
					}
				}
			}, this);
			
			var lookup = new Array();
			array.forEach(venues, function(venueId){
				var venueItem = this.get(venueId);
				if(!this._isBlank(venueItem)){
					if(venueItem.hasOwnProperty("isStub")){
						if(venueItem.isStub){
							lookup.push(venueId);
						}
					}
				}else{
					lookup.push(venueId);
				}
			}, this);
			
			return lookup;
		},
		
		_updateStubsSuccess: function(data){
			var servicesToCache = new Array();
			
			array.forEach(data.services, function(service, n){
				if(service.hasOwnProperty("id")){
					var lookup = this.getService(service.id.toLowerCase());
					if(!this._isBlank(lookup)){
						if(lookup.isStub){
							this._updateServiceById(service);
							servicesToCache.push(service.id);
						}
					}else{
						this._updateServiceById(service);
						servicesToCache.push(service.id);
					}
				}
			}, this);
			
			if(!this._isBlank(servicesToCache)){
				this._worker.postMessage({
					"type": "command",
					"command": "updateCache",
					"data": servicesToCache
				});
			}
		},
		
		_convertServiceToDataItem: function(service){
			service.id = service.id.toLowerCase();
			service.category1 = this._parseCategory(service, 1);
			service.category2 = this._parseCategory(service, 2);
			service.isStub = ((service.hasOwnProperty("isStub")) ? service.isStub : true);
			service.tags = this._parseTags(service);
			
			return {
				"id": service.id,
				"type": "service",
				"data": service,
				"isStub": service.isStub
			}
		},
		
		_convertVenueToDataItem: function(venue){
			venue.id = venue.id.toLowerCase();
			
			return {
				"id": venue.id,
				"type": "venue",
				"data": venue,
				"isStub": venue.isStub
			}
		},
		
		_isServiceItem: function(item){
			if(item.hasOwnProperty("type") && item.hasOwnProperty("data")){
				if(this._isEqual(item.type, "service")){
					return true;
				}
			}
			
			return false;
		},
		
		_itemHasCategory: function(item, section, category){
			var found = false;
			var fieldName = "category" + section.toString();
			
			array.every(item.data[fieldName], function(cCat){
				if(this._isEqual(cCat, category)){
					found = true;
					return false;
				}
				return true;
			}, this);
			
			return found;
		},
		
		_itemHasTag: function(item, tag){
			var found = false;
			
			array.every(item.data.tags, function(cTag){
				if(this._isEqual(cTag, tag)){
					found = true;
					return false;
				}
				return true;
			}, this);
			
			return found;
		},
		
		_parseCategory: function(service, categoryNum){
			var fieldName = "category" + categoryNum.toString();
			if(service.hasOwnProperty(fieldName)){
				if(!this._isArray(service[fieldName])){
					if(this._isBlank(service[fieldName])){
						return new Array();
					}else{
						return this._trimArray(new Array(service[fieldName]));
					}
				}else{
					return this._trimArray(service[fieldName]);
				}
			}
			
			return new Array();
		},
		
		_parseTags: function(service){
			if(service.hasOwnProperty("tags")){
				if(!this._isArray(service.tags)){
					return this._trimArray(service.tags.split(";"));
				}else{
					tags = this._trimArray(service.tags);
				}
			}
			
			return new Array();
		},
		
		_trimArray: function(ary){
			var newAry = new Array();
			
			array.forEach(ary, function(item){
				item = lang.trim(item);
				if(!this._isBlank(item)){
					newAry.push(item);
				}
			}, this);
			
			return newAry;
		}
	});
	
	return construct;
});