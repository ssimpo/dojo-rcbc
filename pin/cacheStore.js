// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"./_variableTestMixin",
	"simpo/interval",
	"./cacheStore/_shortlist",
	"./cacheStore/_services",
	"./cacheStore/_venues",
	"./cacheStore/_activities",
	"simpo/store/local",
	"simpo/xhrManager",
	"dojo/_base/lang",
	"dojo/json",
	"dojo/topic",
	"dojo/_base/array",
	"lib/md5"
], function(
	declare,
	_variableTestMixin, interval,
	_shortlist, _services, _venues, _activities, store,
	xhrManager, lang, JSON, topic, array, md5
){
	"use strict";
	
	var construct = declare([
		_variableTestMixin, store, _shortlist, _services, _venues, _activities
	], {
		"id": "rcbcPIN",
		"sessionOnly": false,
		"compress": true,
		"encrypt": false,
		"_throttle": 100,
		"_serverThrottle": 50,
		"readyStubs": function(){},
		
		
		constructor: function(args){
			this._callStubsUpdate();
		},
		
		_callStubsUpdate: function(){
			xhrManager.add({
				"url": "/servicesStub.json",
				"success": function(data){
					this._removeOldServices(data);
					this._updateServiceSuccess(
						data,
						lang.hitch(this, this.readyStubs)
					);
				},
				"errorMsg": "Failed to refresh service stubs - now working off cache",
				"hitch": this
			});
			
			xhrManager.add({
				"url": "/activitiesStub.json",
				"success": function(data){
					//this._removeOldServices(data);
					this._updateActivitiesSuccess(data);
				},
				"errorMsg": "Failed to refresh service stubs - now working off cache",
				"hitch": this
			});
		},
		
		_checkForServiceVenues: function(service){
			if(this._hasOwnProperty(service, "data")){
				service = service.data;
			}
			
			if(this._hasOwnProperty(service,"venues")){
				array.forEach(service.venues, function(venueId){
					if(this._hasOwnProperty(venueId, "venueId")){
						venueId = venueId.venueId;
					}
					if(this._isString(venueId)){
						if(venueId.length == 32){
							var venue = this.get(venueId.toLowerCase());
							if(this._isBlank(venue)){
								this._venueIdsToUpdate.push(venueId);
							}
						}
					}
				}, this);
			}
		},
		
		_needsUpdating: function(oldItem, newItem){
			return (oldItem.hash !== newItem.hash);
		},
		
		_convertServiceToDataItem: function(service){
			service.id = service.id.toLowerCase();
			service.category1 = this._parseCategory(service, 1);
			service.category2 = this._parseCategory(service, 2);
			service.isStub = ((this._hasProperty(service, "isStub")) ? service.isStub : true);
			service.tags = this._parseTags(service);
			//console.log(service.tags);
			
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
		
		_getCategoryFieldName: function(section){
			if(!this._isNumber(section)){
				section = (this._isEqual(section,"Family Services")) ? 1 : 2;
			}
			
			return "category" + section.toString();
		},
		
		_itemHasCategory: function(item, section, category){
			var found = false;
			var fieldName = this._getCategoryFieldName(section);
			
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
		
		_trimArray: function(ary){
			var newAry = new Array();
			var lookup = new Object();
			
			array.forEach(ary, function(item){
				item = lang.trim(item);
				
				if(!this._isBlank(item) && !this._hasProperty(lookup, item)){
					newAry.push(item);
					lookup[item] = true;
				}
			}, this);
			
			return newAry;
		}
	});
	
	return construct;
});