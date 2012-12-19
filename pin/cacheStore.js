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
		"compress": false,
		"encrypt": false,
		
		"updateUrl": "/pin.nsf/getService2?openagent",
		"_worker":{},
		"_stubCacheInterval": null,
		"_updateCacheInterval": null,
		"_venueCacheInterval": null,
		"_stubCache": [],
		"_trottle": 100,
		"_slicer": 75,
		"_servicesToCache": [],
		"_venuesToCache": [],
		
		constructor: function(args){
			if(has("webworker")){
				this._initWorker();
				
				this._worker.postMessage({
					"type": "command",
					"command": "updateStubs"
				});
			}else{
				this._updateStubs();
			}
			
			//if(sniff("chrome") || sniff("safari") || sniff("ff")){
				//this._slicer = 350;
			//}
		},
		
		_updateStubs: function(){
			request(
				"/servicesStub.json", {
					"handleAs": "json",
					"preventCache": true
				}
			).then(
				lang.hitch(this, this._updateStubsSuccess),
				function(e){
					console.info("Could not update Stubs");
				}
			);
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
				shortlist = this._createBlankShortList();
				this.put(shortlist);
				topic.publish("/rcbc/pin/changeShortlist", shortlist);
			}
			
			return this._sanitizeShortlist(shortlist);
		},
		
		_sanitizeShortlist: function(shortlist){
			var ids;
			if(shortlist.hasOwnProperty("services")){
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
			array.forEach(shortlist.services, function(serviceId){
				if(!this._isEqual(serviceId, id)){
					newList.push(serviceId);
				}
			}, this);
			
			this._updateShortlist(newList);
		},
		
		inShortlist: function(id){
			var shortlist = this.getShortlist();
			var found = false;
			
			if(shortlist.hasOwnProperty("services")){
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
					console.error(e);
				}
			}else if(this._isEqual(type, "updateVenueCache")){
				try{
					var data = JSON.parse(message);
					this._updateVenueCacheSuccess(data, e.message.orginalLookup);
				}catch(e){
					console.error(e);
				}
			}
		},
		
		_updateServiceById: function(service){
			var hash = this._getHash(service);
			var modified = this._getModified(service);
			
			if(service.hasOwnProperty("id")){
				hash = ((hash === false) ? this._getHash(service.id) : hash);
				modified = ((modified === false) ? this._getModified(service.id) : modified);
				if(service.isStub){
					var lookup = this.getService(service.id.toLowerCase());
					if(!this._isBlank(service)){
						service = lang.mixin(lookup, service);
					}
				}else{
					if(hash !== false){
						service.hash = hash;
					}
					if(modified !== false){
						service.modified = modified;
					}
				}
			
				var data = this._convertServiceToDataItem(service);
				this.put(data);
				topic.publish("/rcbc/pin/updateService", data.id, data);
			}
		},
		
		_updateVenueById: function(venue){
			var data = this._convertVenueToDataItem(venue);
			this.put(data);
			topic.publish("/rcbc/pin/updateVenue", data.id, data);
		},
		
		_updateCacheSuccess: function(data){
			if(this._isString(data)){
				data = JSON.parse(data);
			}
			console.log("UPDATING: ", data.services.length);
			
			array.forEach(data.services, function(service){
				this._updateServiceById(service);
			}, this);
			
			if(this._updateCacheInterval === null){
				this._updateCacheInterval = setTimeout(
					lang.hitch(this, this._updateCache), this._trottle
				);
			}
			
			this._venuesToCache = this._venuesToCache.concat(
				this._getUpdateVenueCacheArray(data)
			);
			if((this._venueCacheInterval === null) && (this._venuesToCache.length > 0)){
				this._venueCacheInterval = setInterval(
					lang.hitch(this, this._updateVenueCache), this._trottle
				);
			}
		},
		
		_updateVenueCache: function(){
			if(!this._isBlank(this._venuesToCache)){
				var venues = new Array();
				for(var i = 0; ((i < this._venuesToCache.length) && (i < this._slicer)); i++){
					venues.push(this._venuesToCache.shift());
				}
			
				this._updateVenueCache2(venues);
			}else{
				clearInterval(this._venueCacheInterval);
				this._venueCacheInterval = null;
			}
		},
		
		_updateVenueCache2: function(ids){
			console.log("TO WEBWORKER VENUES: ", ids.length);
			/*if(!this._isBlank(ids)){
				if(has("webworker")){
					this._worker.postMessage({
						"type": "command",
						"command": "updateVenueCache",
						"data": ids
					});
				}
			}*/
		},
		
		_updateVenueCacheSuccess: function(data,orginal){
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
		
		_updateServices: function(){
			if(!this._isBlank(this._stubCache)){
				var services = new Array();
				for(var i = 0; ((i < this._stubCache.length) && (i < this._slicer)); i++){
					services.push(this._stubCache.shift());
				}
			
				this._updateServices2(services);
			}else{
				clearInterval(this._stubCacheInterval);
				this._stubCacheInterval = null;
			}
		},
		
		_updateServices2: function(services){
			array.forEach(services, function(service, n){
				if(service.hasOwnProperty("id")){
					var lookup = this.getService(service.id.toLowerCase());
					if(!this._isBlank(lookup)){
						if(lookup.isStub){
							this._servicesToCache.push(service.id);
						}else{
							if(!this._hashIsEqual(service, lookup)){
								this._servicesToCache.push(service.id);
							}
						}
					}else{
						this._servicesToCache.push(service.id);
					}
					this._updateServiceById(service);
				}
			}, this);
			
			if((this._updateCacheInterval === null) && (!this._isBlank(this._servicesToCache))){
				this._updateCacheInterval = setTimeout(
					lang.hitch(this, this._updateCache), this._trottle
				);
			}
			
		},
		

		_updateStubsSuccess: function(data){
			this._stubCache = this._stubCache.concat(data.services);
			if(this._stubCacheInterval !== null){
				clearInterval(this._stubCacheInterval);
			}
			this._stubCacheInterval = setInterval(
				lang.hitch(this, this._updateServices), this._trottle
			);
		},
		
		_updateCache: function(){
			if(this._updateCacheInterval !== null){
				clearTimeout(this._updateCacheInterval);
				this._updateCacheInterval = null;
			}
			
			if(!this._isBlank(this._servicesToCache)){
				var ids = new Array();
				for(var i = 0; ((i < this._servicesToCache.length) && (i < this._slicer)); i++){
					ids.push(this._servicesToCache.shift());
				}
			
				this._updateCache2(ids);
			}
		},
		
		_updateCache2: function(ids){
			//console.log("Making request: "+this.updateUrl+"&id="+ids.join(","));
			if(!this._isBlank(ids)){
				if(has("webworker")){
					this._worker.postMessage({
						"type": "command",
						"command": "updateCache",
						"data": ids
					});
				}else{
					request(
						this.updateUrl+"&id="+ids.join(","), {
							"handleAs": "text",
							"preventCache": true
						}
					).then(
						lang.hitch(this, this._updateCacheSuccess),
						function(e){
							console.error(e);
						}
					);
				}
			}
		},
		
		_hashIsEqual: function(service1, service2){
			var hash1 = this._getHash(service1);
			var hash2 = this._getHash(service1);
			
			return (((hash1 !== false) && (hash2 !== false)) ? (hash1 == hash2) : false);
		},
		
		_getHash: function(service){
			if(this._isObject(service)){
				if(service.hasOwnProperty("hash")){
					return lang.trim(service.hash.toLowerCase());
				}else{
					return false;
				}
			}else if(this._isString(service)){
				var lookup = this.getService(service);
				if(!this._isBlank(lookup)){
					if(this._isObject(lookup)){
						return this._getHash(service);
					}
				}
			}
			
			return false;
		},
		
		_getModified: function(service){
			if(this._isObject(service)){
				if(service.hasOwnProperty("modified")){
					return service.modified
				}else{
					return false;
				}
			}else if(this._isString(service)){
				var lookup = this.getService(service);
				if(!this._isBlank(lookup)){
					if(this._isObject(lookup)){
						return this._getHash(modified);
					}
				}
			}
			
			return false;
		},
		
		_convertServiceToDataItem: function(service){
			service.id = service.id.toLowerCase();
			service.category1 = this._parseCategory(service, 1);
			service.category2 = this._parseCategory(service, 2);
			service.isStub = ((service.hasOwnProperty("isStub")) ? service.isStub : true);
			service.tags = this._parseTags(service);
			
			array.forEach(service.category1, function(category, n){
				service.category1[n] = category.replace(" & "," and ");
			}, this);
			array.forEach(service.category2, function(category, n){
				service.category2[n] = category.replace(" & "," and ");
			}, this);
			
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
					return this._trimArray(service.tags);
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