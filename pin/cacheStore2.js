// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"./_variableTestMixin",
	"./cacheStore/_shortlist",
	"./cacheStore/_services",
	"./cacheStore/_venues",
	"simpo/store/local",
	"dojo/_base/lang",
	"dojo/json",
	"dojo/topic",
	"dojo/_base/array",
	"dojo/request"
], function(
	declare, _variableTestMixin, store, _shortlist, _services, _venues,
	lang, JSON, topic, array, request
){
	"use strict";
	
	var construct = declare([
		_variableTestMixin, store, _shortlist, _services, _venues
	], {
		"id": "rcbcPIN",
		"sessionOnly": false,
		"compress": false,
		"encrypt": false,
		
		"_updateUrls": {
			"stubs": "/servicesStub.json",
			"venueUpdate": "/pin.nsf/getVenue?openagent",
			"serviceUpdate": "/pin.nsf/getService2?openagent&stub=false",
			"infoUpdate": "/pin.nsf/getInfo?openagent",
			"factsheetUpdate": "/pin.nsf/getFactsheets?openagent"
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
		"_venueIdsToUpdate": [],
		"_venueCache": [],
		"_infoCache": [],
		"_factsheetCache": [],
		"_intervalChecks": [],
		
		constructor: function(args){
			this._initInterval();
			this._callStubsUpdate();
			this._addChecks();
		},
		
		_initInterval: function(){
			try{
				if(this._interval === null){
					this._interval = setInterval(
						lang.hitch(this, this._checkCommands),
						this._intervalPeriod
					);
				}
			}catch(e){
				console.info("Failed to create interval.");
			}
		},
		
		_addChecks: function(){
			this.addIntervalCheck(function(){
				if(!this._isBlank(this._infoCache)){
					this.addIntervalCommand(
						lang.hitch(this, this._updateFromInfoCache)
					);
				}
				if(!this._isBlank(this._factsheetCache)){
					this.addIntervalCommand(
						lang.hitch(this, this._updateFromFactsheetCache)
					);
				}
			});
		},
		
		addIntervalCheck: function(func){
			// summary:
			//		Add a new fallback function to run when no function are
			//		waiting in the interval queue.
			// description:
			//		Add a function to the interval queue to perform when no
			//		functions are waiting in the interval queue.  Any functions
			//		in the interval queue are ran first when this is empty
			//		this._intervalChecks is cycled-through.  Functions added
			//		here are normally a check followed by a command if the check
			//		is true.
			//
			//		Thses are regular commands ran everytime the interval is ran
			//		and no functions are in the queue.  It is different to the
			//		commands in this._intervalCommands, which are only run once.
			// func: function
			//		Function to run (function will be ran within scope of
			//		this class).
			
			var found = false;
			array.forEach(this._intervalChecks, function(cFunc){
				if(cFunc === func){
					found = true;
				}
			}, this);
			if(!found){
				this._intervalChecks.push(lang.hitch(this, func));
			}
		},
		
		addIntervalCommand: function(func){
			// summary:
			//		Add a command to the queue.
			// description:
			//		Add a function to be run during the next interval.
			//		Commands are only run once.
			// func: function
			//		Function to run (fuction will be ran in's own scope).
			
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
		
		_checkCommands: function(){
			// summary:
			//		Run command(s) in current queue.
			// description:
			//		Run any the next command in this._intervalCommands.  If
			//		non are found then run each command in this._intervalChecks.
			
			if(!this._isBlank(this._intervalCommands)){
				try{
					var func = this._intervalCommands.shift();
					func();
				}catch(e){
					console.info("Failed to run interval command.");
				}
			}else{
				array.forEach(this._intervalChecks, function(func){
					func();
				}, this);
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
					lang.hitch(this, function(data){
						this._intervalPeriod *= 5;
						this._updateServiceSuccess(data);
					}),
					lang.hitch(this, this._xhrError, this._updateUrls.stubs)
				);
			}catch(e){
				console.info("Failed to refresh service stubs - now working off cache");
			}
		},
		
		_xhrError: function(url, e){
			if(url === this._updateUrls.stubs){
				this._updateAttempts.stubs--;
				if(this._updateAttempts.stubs > 0){
					this.addIntervalCommand(
						lang.hitch(this, this._updateStubs)
					);
				}
			}
			
			console.info("Failed to load: " + url);
		},
		
		_updateFromInfoCache: function(){
		},
		
		_updateFromFactsheetCache: function(){
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