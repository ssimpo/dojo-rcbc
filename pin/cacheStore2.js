// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
// TODO:
//		SERVICE TOPIC UPDATE
define([
	"dojo/_base/declare",
	"simpo/store/local",
	"./cacheStore/queryCache",
	"simpo/typeTest",
	"simpo/xhrManager",
	"dojo/_base/lang",
	"simpo/array",
	"dojo/_base/array",
	"simpo/interval",
	"dojo/topic",
	"dojo/has",
	"dojo/sniff",
	"dojo/store/Memory"
], function(
	declare, Store, queryCache, typeTest, xhrManager, lang, iArray, array,
	interval, topic, has, sniff, Memory
){
	"use strict";
	
	var construct = declare(null, {
		"id": "rcbcPIN",
		"sessionOnly": false,
		"compress": true,
		"encrypt": false,
		
		"venuesStore": null,
		"servicesStore": null,
		"eventsStore": null,
		"activitiesStore": null,
		"settingsStore": null,
		
		"readyStubs": function(){},
		"ready": function(){},
		
		"_cache": null,
		"_throttle": 200,
		"_serverThrottle": 100,
		"_serviceIdsToUpdate": [],
		"_venueIdsToUpdate": [],
		"_activityIdsToUpdate": [],
		"_eventIdsToUpdate": [],
		"_servicesReady": 0,
		"_servicesData": [],
		
		constructor: function(){
			this._init();
		},
		
		_init: function(){
			this._cache = new queryCache();
			this._initStores();
			this._initIntervals();
			this._callStubsUpdate();
		},
		
		_initStores: function(){
			this._deleteStore("");
			this._deleteStore("type");
			
			this.servicesStore = this._getStore(
				"services", lang.hitch(this, function(data){
					this.ready(data);
					this._servicesReady++;
					//if(this._servicesReady >= 2){
						//this._servicesReady = 0;
						//this._removeOldServices(data);
					//}
				})
			);
			//this.ready({});
			this.venuesStore = this._getStore("venues");
			this.eventsStore = this._getStore("events");
			this.activitiesStore = this._getStore("activities");
			this.settingsStore = this._getStore("settings");
			
			
		},
		
		_deleteStore: function(storeName){
			var store = this._getStore(storeName, function(){
				var items = store.query({});
				array.forEach(items, function(item){
					store.remove(item.id.toLowerCase());
				}, this);
			});
		},
		
		_initIntervals: function(){
			interval.add( 
				lang.hitch(this, this._callServicesUpdate), true, 4
			);
			interval.add(
				lang.hitch(this, this._callVenuesUpdate), true, 4
			);
			interval.add(
				lang.hitch(this, this._callEventUpdate), true, 4
			);
			interval.add(
				lang.hitch(this, this._callActivityUpdate), true, 4
			);
		},
		
		_callEventUpdate: function(){
			var ids = new Array();
			for(var i = 0; ((i < this._serverThrottle) && (i < this._eventIdsToUpdate.length)); i++){
				ids.push(this._eventIdsToUpdate.shift());
			}
			
			if(!typeTest.isBlank(ids)){
				xhrManager.add({
					"url": "/pin.nsf/getEvent?openagent&stub=false&id="+ids.join(",")
				}).then(
					lang.hitch(this, this._updateActivitiesSuccess),
					lang.hitch(this, function(e){
						console.info("Failed to update events - now working from cache", e);
					})
				);
			}
		},
		
		_callActivityUpdate: function(){
			var ids = new Array();
			for(var i = 0; ((i < this._serverThrottle) && (i < this._activityIdsToUpdate.length)); i++){
				ids.push(this._activityIdsToUpdate.shift());
			}
			
			if(!typeTest.isBlank(ids)){
				xhrManager.add({
					"url": "/pin.nsf/getActivity?openagent&stub=false&id="+ids.join(",")
				}).then(
					lang.hitch(this, this._updateActivitiesSuccess),
					lang.hitch(this, function(e){
						console.info("Failed to update activities - now working from cache", e);
					})
				);
			}
		},
		
		_updateActivitiesSuccess: function(data, callback1, callback2){
			callback1 = ((callback1 === undefined) ? function(){} : callback1);
			callback2 = ((callback2 === undefined) ? function(){} : callback2);
			
			if(typeTest.isProperty(data, "activities")){
				iArray.forEach(
					data.activities,
					this._throttle,
					this._updateActivity,
					this
				).then(
					lang.hitch(this, callback1)
				);
			}
			
			if(typeTest.isProperty(data, "events")){
				iArray.forEach(
					data.events,
					this._throttle,
					this._updateEvent,
					this
				).then(
					lang.hitch(this, callback2)
				);
			}
		},
		
		_updateActivity: function(activity){
			try{
				if(typeTest.isProperty(activity, "id")){
					var item = this._convertActivityToDataItem(activity);
					var cItem = this.getActivity(item.id.toLowerCase());
					var callUpdate = false;
				
					if((item.isStub) && (cItem !== null)){
						item = lang.mixin(cItem, item);	
					}
				
					if(item.isStub){
						this._activityIdsToUpdate.push(item.id.toLowerCase());
					}else if(cItem !== null){
						if(this._needsUpdating(cItem, item)){
							this._activityIdsToUpdate.push(item.id.toLowerCase());
						}
					}
				
					var isStub = this._isActivityStub(item);
					item.isStub = isStub;
					item.data.isStub = isStub;
				
					this.activitesStore.put(item);
					topic.publish("/rcbc/pin/updateActivity", item.id.toLowerCase(), item);
					this._checkForServiceVenues(activity);
				}
			}catch(e){
				console.warn(e);
			}
		},
		
		_checkForServiceVenues: function(service){
			if(!typeTest.isProperty(service, "data")){
				service = service.data;
			}
			
			if(typeTest.isProperty(service, "venues")){
				array.forEach(service.venues, function(venueId){
					if(typeTest.isProperty(venueId, "venueId")){
						venueId = venueId.venueId;
					}
					if(typeTest.isString(venueId)){
						if(venueId.length == 32){
							var venue = this.venuesStore.get(venue.id.toLowerCase());
							if(typeTest.isBlank(venue)){
								this._venueIdsToUpdate.push(venueId);
							}
						}
					}
				}, this);
			}
		},
		
		_updateEvent: function(event){
			try{
				if(typeTest.isProperty(event,"id")){
					var item = this._convertEventToDataItem(event);
					var cItem = this.getEvent(item.id.toLowerCase());
					var callUpdate = false;
				
					if((item.isStub) && (cItem !== null)){
						item = lang.mixin(cItem, item);	
					}
				
					if(item.isStub){
						this._eventIdsToUpdate.push(item.id.toLowerCase());
					}else if(cItem !== null){
						if(this._needsUpdating(cItem, item)){
							this._eventIdsToUpdate.push(item.id.toLowerCase());
						}
					}
				
					var isStub = this._isActivityStub(item);
					item.isStub = isStub;
					item.data.isStub = isStub;
				
					this.eventsStore.put(item);
					topic.publish("/rcbc/pin/updateEvent", item.id.toLowerCase(), item);
					this._checkForServiceVenues(event)
				}
			}catch(e){
				console.warn(e);
			}
		},
		
		_convertEventToDataItem: function(event){
			event.id = event.id.toLowerCase();
			event.category1 = this._parseCategory(event, 1);
			event.category1 = this._arrayReplace(event.category1, " & ", " and ");
			event.isStub = ((typeTest.isProperty(event, "isStub")) ? event.isStub : true);
			event.tags = this._parseTags(event);
			
			return {
				"id": event.id,
				"type": "event",
				"data": event,
				"isStub": event.isStub
			}
		},
		
		_isActivityStub: function(obj){
			return (!typeTest.isProperty(obj.data, "description") && !typeTest.isProperty(obj.data, "contacts"));
		},
		
		_isActivityItem: function(item){
			if(typeTest.isProperty(item, "type") && typeTest.isProperty(item, "data")){
				if(typeTest.isEqual(item.type, "activity")){
					return true;
				}
			}
			
			return false;
		},
		
		_isEventItem: function(item){
			if(typeTest.isProperty(item, "type") && typeTest.isProperty(item, "data")){
				if(typeTest.isEqual(item.type, "event")){
					return true;
				}
			}
			
			return false;
		},
		
		_convertActivityToDataItem: function(activity){
			activity.id = activity.id.toLowerCase();
			activity.category1 = this._parseCategory(activity, 1);
			activity.category1 = this._arrayReplace(activity.category1, " & ", " and ");
			activity.isStub = ((typeTest.isProperty(activity, "isStub")) ? activity.isStub : true);
			activity.tags = this._parseTags(activity);
			
			return {
				"id": activity.id,
				"type": "activity",
				"data": activity,
				"isStub": activity.isStub
			}
		},
		
		_callVenuesUpdate: function(){
			var ids = new Array();
			for(var i = 0; ((i < this._serverThrottle) && (i < this._venueIdsToUpdate.length)); i++){
				ids.push(this._venueIdsToUpdate.shift());
			}
			
			if(!typeTest.isBlank(ids)){
				xhrManager.add({
					"url": "/pin.nsf/getVenue?openagent",
					"method": "post",
					"data": {
						"id": ids.join(",")
					}
				}).then(
					lang.hitch(this, this._updateVenueSuccess),
					lang.hitch(this, function(e){
						console.info("Failed to update venues - now working from cache", e);
					})
				)
			}
		},
		
		_updateVenueSuccess: function(data){
			if(typeTest.isProperty(data, "venues")){
				iArray.forEach(
					data.venues,
					this._throttle,
					this._updateVenue,
					function(){},
					this
				);
			}
		},
		
		_updateVenue: function(venue){
			var data = this._convertVenueToDataItem(venue);
			this.venuesStore.put(data);
			topic.publish("/rcbc/pin/updateVenue", data.id.toLowerCase(), data);
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
		
		_callServicesUpdate: function(){
			var ids = new Array();
			
			for(var i = 0; ((i < this._serverThrottle) && (i < this._serviceIdsToUpdate.length)); i++){
				ids.push(this._serviceIdsToUpdate.shift());
			}
			
			this._callServicesUpdate2(ids);
		},
		
		_callServicesUpdate2: function(ids){
			if(!typeTest.isBlank(ids)){
				xhrManager.add({
					"url": "/pin.nsf/getService2?openagent&stub=false",
					"method": "post",
					"data": {
						"id": ids.join(",")
					}
				}).then(
					lang.hitch(this, this._updateServiceSuccess),
					lang.hitch(this, function(e){
						console.info("Failed to update services - now working from cache", e);
					})
				);
			}
		},
		
		_callStubsUpdate: function(){
			this._callServiceStubsUpdate();
			// TODO
			//this._callActivityStubsUpdate();
		},
		
		_callServiceStubsUpdate: function(){
			try{
			xhrManager.add({
				"url": "/servicesStub.json",
			}).then(
				lang.hitch(this, function(data){
					this._servicesData = data;
					this._servicesReady++;
					this.readyStubs(data);
					this._updateServiceSuccess(
						data,
						lang.hitch(this, this.readyStubs)
					);
				}),
				lang.hitch(this, function(e){
					console.info("Failed to refresh service stubs - now working off cache", e);
				})
			);
			}catch(e){
				console.info(e);
			}
		},
		
		_callActivityStubsUpdate: function(){
			xhrManager.add({
				"url": "/activitiesStub.json"
			}).then(
				lang.hitch(this, function(data){
					this._updateActivitiesSuccess(data);
				}),
				lang.hitch(this, function(e){
					console.info("Failed to refresh activity stubs - now working off cache", e);
				})
			);
		},
		
		_updateServiceSuccess: function(data, callback){
			callback = ((callback === undefined) ? function(){} : callback);
			
			if(typeTest.isProperty(data, "services")){
				iArray.forEach(
					data.services,
					this._throttle,
					this._updateService,
					this
				).then(
					lang.hitch(this, function(){
						var callback2 = lang.hitch(this, callback);
						callback2();
					})
				);
			}
		},
		
		_updateService: function(service){
			try{
				var item = this._convertServiceToDataItem(service);
				var cItem = this.getService(item.id.toLowerCase());
				var callUpdate = false;
				
				if((item.isStub) && (cItem !== null)){
					item = lang.mixin(cItem, item);
				}
				
				if(item.isStub){
					this._serviceIdsToUpdate.push(item.id.toLowerCase());
				}else if(this._needsUpdating(cItem, item)){
					this._serviceIdsToUpdate.push(item.id.toLowerCase());
				}
				
				var isStub = this._isServiceStub(item);
				item.isStub = isStub;
				item.data.isStub = isStub;
				
				if(typeTest.isProperty(item.data, "data")){
					delete item.data["data"];
				}
				this.servicesStore.put(item);
				
				if(!item.isStub){
					topic.publish("/rcbc/pin/updateService", item.id.toLowerCase(), item);
					this._checkForServiceVenues(service);
				}
			}catch(e){
				console.info("Failed to update service", e);
			}
		},
		
		_removeOldServices: function(data){
			var lookup = new Object();
			
			array.forEach(data.services, function(item){
				lookup[item.id.toLowerCase()] = true;
			}, this);
			
			var query = this.servicesStore.query({});
			array.forEach(query, function(item){
				if(!typeTest.isProperty(lookup, item.id.toLowerCase())){
					this.servicesStore.remove(item.id.toLowerCase());
				}
			}, this);
		},
		
		_needsUpdating: function(oldItem, newItem){
			return (oldItem.hash !== newItem.hash);
		},
		
		_isServiceStub: function(obj){
			return (!typeTest.isProperty(obj.data, "description") && !typeTest.isProperty(obj.data, "venues") && !typeTest.isProperty(obj.data, "contacts"));
		},
		
		_convertServiceToDataItem: function(service){
			service.id = service.id.toLowerCase();
			service.category1 = this._parseCategory(service, 1);
			service.category1 = this._arrayReplace(service.category1, " & ", " and ");
			service.category2 = this._parseCategory(service, 2);
			service.category2 = this._arrayReplace(service.category2, " & ", " and ");
			service.isStub = ((typeTest.isProperty(service, "isStub")) ? service.isStub : true);
			service.tags = this._parseTags(service);
			
			return {
				"id": service.id,
				"type": "service",
				"data": service,
				"isStub": service.isStub
			}
		},
		
		_arrayReplace: function(ary, from, to){
			array.forEach(ary, function(item, n){
				ary[n] = item.replace(from,to);
			}, this);
			
			return ary;
		},
		
		_parseCategory: function(service, categoryNum){
			var fieldName = "category" + categoryNum.toString();
			if(typeTest.isProperty(service, fieldName)){
				if(!typeTest.isArray(service[fieldName])){
					if(typeTest.isBlank(service[fieldName])){
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
		
		_trimArray: function(ary){
			var newAry = new Array();
			var lookup = new Object();
			
			array.forEach(ary, function(item){
				item = lang.trim(item);
				
				if(!typeTest.isBlank(item) && !typeTest.isProperty(lookup, item)){
					newAry.push(item);
					lookup[item] = true;
				}
			}, this);
			
			return newAry;
		},
		
		_parseTags: function(service){
			if(typeTest.isProperty(service, "tags")){
				if(!typeTest.isArray(service.tags)){
					return this._trimArray(service.tags.split(";"));
				}else{
					return this._trimArray(service.tags);
				}
			}
			
			return new Array();
		},
		
		_getStore: function(type, ready){
			ready = ((ready === undefined) ? function(){} : ready);
			
			return new Store({
				"sessionOnly": this.sessionOnly,
				//"sessionOnly": ((has("ie")) ? true : this.sessionOnly),
				"compress": ((has("ie")) ? false : this.compress),
				"encrypt": this.encrypt,
				"id": this.id.toLowerCase() + type,
				"ready": ready,
				"slicer": 50
			});
		},
		
		getSection: function(section){
			if(this._servicesReady >= 2){
				return this._cache.getCache(
					["getSection", section],
					lang.hitch(this, this._getSection, section)
				);
			}else{
				return this._getSection(section);
			}
		},
		
		_getSection: function(section){
			var fieldName = this._getCategoryFieldName(section);
			var query =  new Array();
			
			if(this._servicesReady >= 2){
				query = this.servicesStore.query(function(obj){
					if(!typeTest.isProperty(obj, "data")){
						obj.data = obj;
					}
					if(typeTest.isProperty(obj.data, fieldName)){
						return !typeTest.isBlank(obj.data[fieldName])
					}
				
					return false;
				});
			}else{
				query = array.filter(this._servicesData.services, function(obj){
					if(!typeTest.isProperty(obj, "data")){
						obj.data = obj;
					}
					if(typeTest.isProperty(obj.data, fieldName)){
						return !typeTest.isBlank(obj.data[fieldName])
					}
					
					return false;
				});
			}
			
			return this._serviceSort(query);
		},
		
		searchServices: function(search, section){
			var query = this._cache.getCache(
				["searchServices", section, search],
				lang.hitch(this, this._searchServices, search, section)
			);
			
			if(!typeTest.isBlank(query)){
				return query;
			}
			return new Array();
		},
		
		_searchServices: function(search, section){
			var query = null;
			if(search.length > 2){
				query = this._cache.getCache([
					"searchServices",
					section,
					search.substring(0, search.length - 1)
				]);
			}
			if(query === null){
				if(!typeTest.isBlank(section)){
					query = this.getSection(section);
				}else{
					query.servicesQuery.query({});
				}
			}
			
			var tests = this._parseSearch(search);
			query = array.filter(query, function(service){
				try{
					if(!typeTest.isProperty(service, "data")){
						service.data = service;
					}
					
					var searcher = JSON.stringify(service.data);
					return this._searchTest(searcher, tests);
				}catch(e){ }
				return false;
			}, this);
			
			return query;
		},
		
		_parseSearch: function(search){
			var words = search.split(" ");
			var tests = new Array();
			array.forEach(words, function(word){
				tests.push(new RegExp("\\W"+word,"i"));
			}, this);
			return tests;
		},
		
		_searchTest: function(query, tests){
			var found = true;
			
			array.every(tests, function(test){
				if(!test.test(query)){
					found = false;
					return false;
				}
				return true;
			}, this);
			
			return found;
		},
		
		getCategory: function(section, category){
			var query = new Array();
			if(/^[A-Fa-f0-9]{32,32}$/.test(category)){
				if(this._servicesReady >= 2){
					query = this._cache.getCache(
						["getCategory", section, category],
						lang.hitch(this, this._getIdCategory, section, category)
					);
				}else{
					query = this._getIdCategory(section, category);
				}
			}else{
				if(this._servicesReady >= 2){
					query = this._cache.getCache(
						["getCategory", section, category],
						lang.hitch(this, this._getCategory, section, category)
					);
				}else{
					query = this._getCategory(section, category);
				}
			}
			
			if(!typeTest.isBlank(query)){
				return query;
			}
			return new Array();
		},
		
		_getCategory: function(section, category){
			var query = this.getSection(section);
			
			query = array.filter(query, function(service){
				return this._itemHasCategory(service, section, category);
			}, this);
			
			return this._serviceSort(query);
		},
		
		_serviceSort: function(query){
			if(query.length > 0){
				if(!typeTest.isProperty(query[0], "data")){
					return query.sort(function(a, b){
						return (((a.serviceName + a.orgName) < (b.serviceName + b.orgName)) ? -1 : 1);
					});
				}
			}
			
			return query.sort(function(a, b){
				return (((a.data.serviceName + a.data.orgName) < (b.data.serviceName + b.data.orgName)) ? -1 : 1);
			});
		},
		
		_getIdCategory: function(section, category){
			if(this.servicesStore.get(category.toLowerCase())){
				var query = this.servicesStore.query(function(obj){
					if(!typeTest.isProperty(obj, "data")){
						obj.data = obj;
					}
					if(typeTest.isProperty(obj.data, "service")){
						return (obj.data.service.toLowerCase() === category.toLowerCase());
					}
					
					return false;
				});
				
				query = query.sort(function(a, b){
					return (((a.data.title) < (b.data.title)) ? -1 : 1);
				});
				
				return query;
			}else{
				return [];
			}
		},
		
		_isServiceItem: function(item){
			if(typeTest.isProperty(item, "type") && typeTest.isProperty(item, "data")){
				if(typeTest.isEqual(item.type, "service")){
					return true;
				}
			}
			
			return false;
		},
		
		_itemHasCategory: function(item, section, category){
			var found = false;
			var fieldName = this._getCategoryFieldName(section);
			if(!typeTest.isProperty(item, "data")){
				item.data = item;
			}
			
			array.every(item.data[fieldName], function(cCat){
				if(typeTest.isEqual(cCat, category)){
					found = true;
					return false;
				}
				return true;
			}, this);
			
			return found;
		},
		
		_getCategoryFieldName: function(section){
			if(!typeTest.isNumber(section)){
				section = (typeTest.isEqual(section,"Family Services")) ? 1 : 2;
			}
			
			return "category" + section.toString();
		},
		
		getCategoryList: function(section){
			if(this._servicesReady >= 2){
				return this._cache.getCache(
					["getCategoryList", section],
					lang.hitch(this, this._getCategoryList, section)
				);
			}else{
				return this._getCategoryList(section);
			}
		},
		
		_getCategoryList: function(section){
			var services = this.getSection(section);
			var categoryList = {};
			var fieldName = this._getCategoryFieldName(section);
			
			array.forEach(services, function(service){
				var categories = this._getCategoryValue(service, fieldName);
				
				array.forEach(categories, function(category){
					if(!typeTest.isBlank(category)){
						if(!typeTest.isProperty(categoryList, category)){
							categoryList[category] = true;
						}
					}
				}, this);
			}, this);
			
			return categoryList;
		},
		
		_getCategoryValue: function(service, fieldName){
			if(typeTest.isObject(service)){
				if(typeTest.isProperty(service, "data")){
					service = service.data;
				}
				
				if(typeTest.isObject(service)){
					if(typeTest.isProperty(service, fieldName)){
						var categories = service[fieldName];
						if(typeTest.isArray(categories)){
							return categories;
						}
					}
				}
			}
			
			return new Array();
		},
		
		getService: function(id){
			var service = this.servicesStore.get(id);
			if(!typeTest.isBlank(service)){
				if(typeTest.isProperty(service, "type")){
					if(service.type == "service"){
						return service;
					}
				}
			}
			
			return null;
		},
		
		getTag: function(section, category, tag){
			if(this._servicesReady >= 2){
				return this._cache.getCache(
					["getTag", section, category, tag],
					lang.hitch(this, this._getTag, section, category, tag)
				);
			}else{
				return this._getTag(section, category, tag);
			}
		},
		
		_getTag: function(section, category, tag){
			var query = this.getCategory(section, category);
			query = array.filter(query, function(service){
				return (this._itemHasTag(service, tag));
			}, this);
			
			return this._serviceSort(query);
		},
		
		_itemHasTag: function(item, tag){
			var found = false;
			if(typeTest.isProperty(service, "data")){
				service = service.data;
			}
			
			array.every(item.data.tags, function(cTag){
				if(typeTest.isEqual(cTag, tag)){
					found = true;
					return false;
				}
				return true;
			}, this);
			
			return found;
		},
		
		getTagsList: function(section, category){
			if(this._servicesReady >= 2){
				return this._cache.getCache(
					["getTagsList", section, category],
					lang.hitch(this, this._getTagsList, section, category)
				);
			}else{
				return this._getTagsList(section, category);
			}
		},
		
		_getTagsList: function(section, category){
			var services = this.getCategory(section, category);
			var tags = {};
			
			array.forEach(services, function(service){
				if(!typeTest.isProperty(service, "data")){
					service.data = service;
				}
				
				if(typeTest.isString(service.data.tags)){
					service.data.tags = service.data.tags.split(";");
				}
				array.forEach(service.data.tags, function(tag){
					if(!typeTest.isBlank(tag)){
						var cTags = tag.split(";");
						array.forEach(cTags, function(cTag){
							cTag = lang.trim(cTag);
							if(!typeTest.isBlank(cTag)){
								if(typeTest.isProperty(tags, cTag)){
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
		
		updateService: function(service){
			if(typeTest.isString(service)){
				if(service.length == 32){
					this._serviceIdsToUpdate.push(service);
					return true;
				}else{
					return false;
				}
			}else if(typeTest.isObject(service)){
				if(typeTest.isProperty(service, "id")){
					this._serviceIdsToUpdate.push(service.id.toLowerCase());
					return true;
				}else{
					return false;
				}
			}
				
			return false;
		},
		
		priorityUpdateService: function(service){
			if(typeTest.isString(service)){
				if(service.length == 32){
					this._callServicesUpdate2([service]);
					return true;
				}else{
					return false;
				}
			}else if(typeTest.isObject(service)){
				if(typeTest.isProperty(service, "id")){
					this._callServicesUpdate2([service.id.toLowerCase()]);
					return true;
				}else{
					return false;
				}
			}
				
			return false;
		},
		
		getActivity: function(id){
			var activity = this.activitiesStore.get(id);
			if(!typeTest.isBlank(activity)){
				if(typeTest.isProperty(activity, "type")){
					if(activity.type == "activity"){
						return activity;
					}
				}
			}
			
			return null;
		},
		
		getEvent: function(id){
			var event = this.eventsStore.get(id);
			if(!typeTest.isBlank(event)){
				if(typeTest.isProperty(event, "type")){
					if(event.type == "event"){
						return event;
					}
				}
			}
			
			return null;
		},
		
		addToShortlist: function(id){
			var shortlist = this.getShortlist();
			
			var found = false;
			array.every(shortlist.services, function(serviceId){
				if(typeTest.isEqual(serviceId, id)){
					found = true;
					return false;
				}
				return true;
			}, this);
			
			if(!found){
				if(typeTest.isProperty(shortlist, "services")){
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
			this.settingsStore.put(shortlist);
			topic.publish("/rcbc/pin/changeShortlist", shortlist);
		},
		
		emptyShortlist: function(){
			var shortlist = this._createBlankShortList();
			this.settingsStore.get(shortlist);
			topic.publish("/rcbc/pin/changeShortlist", shortlist);
			
			return shortlist;
		},
		
		_createBlankShortList: function(){
			return {
				"type": "shortlist",
				"id": "shortlist",
				"services": new Array()
			};
		},
		
		getShortlist: function(){
			var shortlist = this.settingsStore.get("shortlist");
			if(typeTest.isBlank(shortlist)){
				shortlist = this._createBlankShortList();
				this.settingsStore.put(shortlist);
				topic.publish("/rcbc/pin/changeShortlist", shortlist);
			}
			return this._sanitizeShortlist(shortlist);
		},
		
		_sanitizeShortlist: function(shortlist){
			var ids;
			if(typeTest.isProperty(shortlist, "services")){
				if(typeTest.isArray(shortlist.services)){
					ids = shortlist.services;
				}else{
					return this._createBlankShortList();
				}
			}else{
				if(typeTest.isArray(shortlist)){
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
		
		inShortlist: function(id){
			var shortlist = this.getShortlist();
			var found = false;
			
			if(typeTest.isProperty(shortlist, "services")){
				array.every(shortlist.services, function(serviceId){
					if(typeTest.isEqual(serviceId, id)){
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
				if(!typeTest.isEqual(serviceId, id)){
					newList.push(serviceId);
				}
			}, this);
			
			this._updateShortlist(newList);
		},
		
		getVenue: function(id){
			var venue = this.venuesStore.get(id);
			
			if(!typeTest.isBlank(venue)){
				if(typeTest.isProperty(venue, "type")){
					if(venue.type == "venue"){
						return venue;
					}
				}
			}
			
			return null;
		},
		
		updateVenue: function(venue){
			if(typeTest.isString(venue)){
				if(venue.length == 32){
					this._venueIdsToUpdate.push(venue);
					return true;
				}else{
					return false;
				}
			}else if(typeTest.isObject(venue)){
				if(typeTest.isProperty(venue, "id")){
					this._venueIdsToUpdate.push(venue.id.toLowerCase());
					return true;
				}else{
					return false;
				}
			}
				
			return false;
		}
	});
	
	return construct;
});