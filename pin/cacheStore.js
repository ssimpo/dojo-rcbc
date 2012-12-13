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
			//this._updateStubs();
			
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
					
				}
			}
		},
		
		updateService: function(id){
			if(!this._isBlank(id)){
				if(id.length == 32){
					request(
						this._serviceUpdateUrl + "&id=" + id, {
							"handleAs": "json",
							"preventCache": true
						}
					).then(
						lang.hitch(this, this._updateServiceSuccess),
						function(err){
							console.error(err);
						}
					);
				}
			}
		},
		
		_updateServiceSuccess: function(data){
			if(this._isObject(data)){
				if(data.hasOwnProperty("services")){
					if(this._isArray(data.services)){
						array.forEach(data.services, function(service){
							this._updateServiceById(service);
						}, this);
					}
				}
			}	
		},
		
		_updateCacheSuccess: function(data){
			console.log("UPDATING CACHE", data);
			array.forEach(data.services, function(service){
				this._updateServiceById(service);
			}, this);
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
			
			this._worker.postMessage({
				"type": "command",
				"command": "updateCache",
				"data": servicesToCache
			});
		},
		
		_updateServiceById: function(service){
			var data = this._convertServiceToDataItem(service);
			this.put(data);
			topic.publish("/rcbc/pin/updateService", data.id);
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
		
		_isServiceItem: function(item){
			if(item.hasOwnProperty("type") && item.hasOwnProperty("data")){
				if(this._isEqual(item.type, "service")){
					return true;
				}
			}
			
			return false;
		},
		
		getTag: function(section, category, tag){
			var self = this;
			//var fieldName = "category" + section.toString();
			
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
		
		_parseCategory: function(service, categoryNum){
			var fieldName = "category" + categoryNum.toString();
			if(service.hasOwnProperty(fieldName)){
				if(!this._isArray(service[fieldName])){
					if(this._isBlank(service[fieldName])){
						return new Array();
					}else{
						return new Array(service[fieldName]);
					}
				}else{
					return service[fieldName];
				}
			}
			
			return new Array();
		},
		
		_parseTags: function(service){
			if(service.hasOwnProperty("tags")){
				if(!this._isArray(service.tags)){
					var tags = service.tags.split(";");
					array.forEach(tags, function(tag, n){
						tags[n] = lang.trim(tags[n]);
					});
					return tags;
				}else{
					return service.tags;
				}
			}
			
			return new Array();
		}
	});
	
	return construct;
});