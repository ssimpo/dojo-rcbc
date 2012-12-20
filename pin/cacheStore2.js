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
	"dojo/_base/lang",
	"dojo/json",
	"dojo/topic",
	"dojo/_base/array",
	"dojo/request"
], function(
	declare, _variableTestMixin, store, lang, JSON, topic, array, request
){
	"use strict";
	
	var construct = declare([_variableTestMixin, store], {
		"id": "rcbcPIN",
		"sessionOnly": false,
		"compress": false,
		"encrypt": false,
		
		"_updateUrls": {
			"stubs": "/servicesStub.json",
			"serviceUpdate": "/pin.nsf/getService2?openagent&stub=false"
		},
		"_updateAttempts": {
			"stubs": 5
		},
		"xhrTimeout": 8*1000,
		"_intervalCommands": [],
		"_interval": null,
		"_intervalPeriod": 100,
		"_serviceCache": [],
		"_throttle": 100,
		"_serverThrottle": 50,
		"_serviceIdsToUpdate": [],
		
		constructor: function(args){
			this._callStubsUpdate();
			
			setInterval(lang.hitch(this, function(){
				this._initInterval();
			}), this._intervalPeriod * 5);
		},
		
		_initInterval: function(){
			try{
				if(this._interval === null){
					this._interval = setTimeout(
						lang.hitch(this, this._checkCommands),
						this._intervalPeriod
					);
				}
			}catch(e){
				console.info("Failed to create interval.");
			}
		},
		
		_checkCommands: function(){
			if(!this._isBlank(this._intervalCommands)){
				try{
					this._interval = null;
					var func = this._intervalCommands.shift();
					
					
					
					func();
				}catch(e){
					console.info("Failed to run interval command.");
				}
			}
		},
		
		_addIntervalCommand: function(func){
			var found = false;
			array.forEach(this._intervalCommands, function(cFunc){
				if(cFunc === func){
					found = true;
				}
			}, this);
			if(!found){
				this._intervalCommands.push(func);
			}
		},
		
		_callStubsUpdate: function(){
			try{
				request(
					this._updateUrls.stubs, {
						"handleAs": "json",
						"preventCache": true,
						"timeout": this.xhrTimeout
					}
				).then(
					lang.hitch(this, this._updateServiceSuccess),
					lang.hitch(this, this._xhrError, this._updateUrls.stubs)
				);
			}catch(e){
				console.info("Failed to refresh service stubs - now working off cache");
			}
		},
		
		_callServicesUpdate: function(){
			var ids = new Array();
			for(var i = 0; ((i < this._serverThrottle) && (i < this._serviceIdsToUpdate.length)); i++){
				ids.push(this._serviceIdsToUpdate.shift());
			}
			
			try{
				if(!this._isBlank(ids)){
					request(
						this._updateUrls.serviceUpdate+"&id="+ids.join(","), {
							"handleAs": "json",
							"preventCache": true,
							"timeout": this.xhrTimeout
						}
					).then(
						lang.hitch(this, this._updateServiceSuccess),
						lang.hitch(this, this._xhrError, this._updateUrls.serviceUpdate)
					);
				}
				
				if(!this._isBlank(this._serviceIdsToUpdate)){
					this._addIntervalCommand(
						lang.hitch(this, this._callServicesUpdate)
					);
				}
			}catch(e){
				console.info("Failed to update services - now working from cache");
			}
			
			this._initInterval();
		},
		
		_xhrError: function(url, e){
			if(url === this._updateUrls.stubs){
				this._updateAttempts.stubs--;
				if(this._updateAttempts.stubs > 0){
					this._addIntervalCommand(
						lang.hitch(this, this._updateStubs)
					);
					this._initInterval();
				}
			}
			
			console.info("Failed to load: " + url);
		},
		
		_updateServiceSuccess: function(data){
			if(this._hasProperty(data, "services")){
				this._serviceCache = this._serviceCache.concat(data.services);
				this._addIntervalCommand(
					lang.hitch(this, this._updateFromServiceCache)
				);
			}
			this._initInterval();
		},
		
		_updateFromServiceCache: function(){
			if(!this._isBlank(this._serviceCache)){
				var services = new Array();
				for(var i = 0; ((i < this._throttle) && (i < this._serviceCache.length)); i++){
					services.push(this._serviceCache.shift());
				}
				this._updateServicesFromArray(services);
			}
			
			if(!this._isBlank(this._serviceCache)){
				this._addIntervalCommand(
					lang.hitch(this, this._updateFromServiceCache)
				);
			}
			this._initInterval();
		},
		
		_updateServicesFromArray: function(services){
			if(!this._isBlank(services)){
				array.forEach(services, this._updateService, this);
				if(!this._isBlank(this._serviceIdsToUpdate)){
					this._addIntervalCommand(
						lang.hitch(this, this._callServicesUpdate)
					);
				}
			}
			this._initInterval();
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
					var isStub = cItem.isStub;
					item = lang.mixin(cItem, item, {"isStub": isStub});
					this.put(item);
					topic.publish("/rcbc/pin/updateService", item.id, item);
				}else{
					if(item.isStub){
						this._serviceIdsToUpdate.push(item.id);
					}
					this.put(item);
					topic.publish("/rcbc/pin/updateService", item.id, item);
				}
			}catch(e){}
		},
		
		
		
		_needsUpdating: function(oldItem, newItem){
			return (oldItem.hash !== newItem.hash);
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
		
		_convertServiceToDataItem: function(service){
			service.id = service.id.toLowerCase();
			service.category1 = this._parseCategory(service, 1);
			service.category2 = this._parseCategory(service, 2);
			service.isStub = ((this._hasProperty(service, "isStub")) ? service.isStub : true);
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
		
		_parseCategory: function(service, categoryNum){
			var fieldName = "category" + categoryNum.toString();
			if(this._hasProperty(service, fieldName)){
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
			if(this._hasProperty(service, "tags")){
				if(!this._isArray(service.tags)){
					return this._trimArray(service.tags.split(";"));
				}else{
					return this._trimArray(service.tags);
				}
			}
			
			return new Array();
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
		
		_isServiceItem: function(item){
			if(this._hasProperty(item, "type") && this._hasProperty(item, "data")){
				if(this._isEqual(item.type, "service")){
					return true;
				}
			}
			
			return false;
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