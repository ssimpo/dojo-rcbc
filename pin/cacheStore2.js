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
	"dojo/request",
	"lib/md5"
], function(
	declare,
	_variableTestMixin, store, _shortlist, _services, _venues,
	lang, JSON, topic, array, request, md5
){
	"use strict";
	
	var construct = declare([
		_variableTestMixin, store, _shortlist, _services, _venues
	], {
		"id": "rcbcPIN",
		"sessionOnly": false,
		"compress": false,
		"encrypt": false,
		"xhrAttempts": 3,
		"xhrTimeout": 8*1000,
		
		"_xhrAttempts": {},
		"_intervalCommands": [],
		"_intervalChecks": [],
		"_interval": null,
		"_intervalPeriod": 100,
		"_throttle": 100,
		"_serverThrottle": 50,
		
		
		constructor: function(args){
			this._initInterval();
			this._callStubsUpdate();
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
			
			this._addCommandToArray(
				this, "_intervalChecks", lang.hitch(this, func)
			);
		},
		
		addIntervalCommand: function(func){
			// summary:
			//		Add a command to the queue.
			// description:
			//		Add a function to be run during the next interval.
			//		Commands are only run once.
			// func: function
			//		Function to run (fuction will be ran in's own scope).
			
			this._addCommandToArray(
				this, "_intervalCommands", func
			);
		},
		
		_addCommandToArray: function(obj, propName, func){
			if (!this._isString(propName)){
				func = propName;
				propName = "prop";
				obj = { "prop": obj };
			}
			
			var found = false;
			array.forEach(obj[propName], function(cFunc){
				if(cFunc === func){
					found = true;
				}
			}, this);
			if(!found){
				obj[propName].push(func);
			}
		},
		
		_runningInterval: false,
		_checkCommands: function(){
			// summary:
			//		Run command(s) in current queue.
			// description:
			//		Run any the next command in this._intervalCommands.  If
			//		non are found then run each command in this._intervalChecks.
			
			if(!this._isBlank(this._intervalCommands)){
				try{
					if(!this._runningInterval){
						this._runningInterval = true;
						var func = this._intervalCommands.shift();
						func();
						this._runningInterval = false;
					}
				}catch(e){
					console.info("Failed to run interval command.");
				}
			}else{
				if(!this._runningInterval){
					this._runningInterval = true;
					array.forEach(this._intervalChecks, function(func){
						func();
					}, this);
					this._runningInterval = false;
				}
			}
		},
		
		_callStubsUpdate: function(){
			this._xhrCall(
				"/servicesStub.json",
				lang.hitch(this, function(data){
					this._intervalPeriod *= 5;
					this._removeOldServices(data);
					this._updateServiceSuccess(data);
				}),
				"Failed to refresh service stubs - now working off cache"
			);
		},
		
		_xhrCall: function(url, success, errorMsg){
			try{
				request(
					url, {
						"handleAs": "json",
						"preventCache": true,
						"timeout": this.xhrTimeout
					}
				).then(
					success,
					lang.hitch(this, this._xhrError, url, success, errorMsg)
				);
			}catch(e){
				console.info(errorMsg);
			}
		},
		
		_xhrError: function(url, success, errorMsg, e){
			// summary:
			//		Fallback when XHR request fails.
			// description:
			//		Fallback for XHR on failure, will retry a few
			//		times before a total fail.
			
			var hash = md5(url);
			if(!this._hasProperty(this._xhrAttempts, hash)){
				this._xhrAttempts[hash] = this.xhrAttempts;
			}
			
			if(this._xhrAttempts[hash] > 0){
				this._xhrAttempts[hash]--;
				this.addIntervalCommand(lang.hitch(this, function(){
					this._xhrCall(url, success, errorMsg);
				}));
			}else{
				console.info("Failed to load: " + url);
				console.info(errorMsg);
			}
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