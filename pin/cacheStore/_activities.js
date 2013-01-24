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
		"_activityIdsToUpdate": [],
		"_eventIdsToUpdate": [],
		
		constructor: function(){
			interval.add(
				lang.hitch(this, this._callEventUpdate), true, 3
			);
			interval.add(
				lang.hitch(this, this._callActivityUpdate), true, 3
			);
		},
		
		getActivity: function(id){
			var activity = this.get(id);
			if(!this._isBlank(activity)){
				if(this._hasProperty(activity, "type")){
					if(activity.type == "activity"){
						return activity;
					}
				}
			}
			
			return null;
		},
		
		getEvent: function(id){
			var event = this.get(id);
			if(!this._isBlank(event)){
				if(this._hasProperty(event, "type")){
					if(event.type == "event"){
						return event;
					}
				}
			}
			
			return null;
		},
		
		_isActivityItem: function(item){
			if(this._hasProperty(item, "type") && this._hasProperty(item, "data")){
				if(this._isEqual(item.type, "activity")){
					return true;
				}
			}
			
			return false;
		},
		
		_isEventItem: function(item){
			if(this._hasProperty(item, "type") && this._hasProperty(item, "data")){
				if(this._isEqual(item.type, "event")){
					return true;
				}
			}
			
			return false;
		},
		
		_updateActivitiesSuccess: function(data, callback1, callback2){
			callback1 = ((callback1 === undefined) ? function(){} : callback1);
			callback2 = ((callback2 === undefined) ? function(){} : callback2);
			
			if(this._isString(data)){
				data = this._retryJsonParse(data);
			}
			
			if(this._hasProperty(data, "activities")){
				iarray.forEach(
					data.activities,
					this._throttle,
					this._updateActivity,
					callback1,
					this
				);
			}
			
			if(this._hasProperty(data, "events")){
				iarray.forEach(
					data.events,
					this._throttle,
					this._updateEvent,
					callback2,
					this
				);
			}
		},
		
		_retryJsonParse: function(txt){
			//console.log("JSON", txt);
		},
		
		_updateActivity: function(activity){
			try{
				var item = this._convertActivityToDataItem(activity);
				var cItem = this.getActivity(item.id);
				var callUpdate = false;
				
				if((item.isStub) && (cItem !== null)){
					item = lang.mixin(cItem, item);	
				}
				
				if(item.isStub){
					this._activityIdsToUpdate.push(item.id);
				}else if(cItem !== null){
					if(this._needsUpdating(cItem, item)){
						this._activityIdsToUpdate.push(item.id);
					}
				}
				
				var isStub = this._isActivityStub(item);
				item.isStub = isStub;
				item.data.isStub = isStub;
				
				this.put(item);
				topic.publish("/rcbc/pin/updateActivity", item.id, item);
				this._checkForServiceVenues(activity);
				
				//console.log("ACTIVITY", item);
			}catch(e){
				console.warn(e);
			}
		},
		
		_updateEvent: function(event){
			try{
				var item = this._convertEventToDataItem(event);
				var cItem = this.getEvent(item.id);
				var callUpdate = false;
				
				if((item.isStub) && (cItem !== null)){
					item = lang.mixin(cItem, item);	
				}
				
				if(item.isStub){
					this._activityIdsToUpdate.push(item.id);
				}else if(cItem !== null){
					if(this._needsUpdating(cItem, item)){
						this._activityIdsToUpdate.push(item.id);
					}
				}
				
				var isStub = this._isActivityStub(item);
				item.isStub = isStub;
				item.data.isStub = isStub;
				
				this.put(item);
				topic.publish("/rcbc/pin/updateEvent", item.id, item);
				this._checkForServiceVenues(event);
				
				//console.log("EVENT", item);
			}catch(e){
				console.warn(e);
			}
		},
		
		_callEventUpdate: function(){
			var ids = new Array();
			for(var i = 0; ((i < this._serverThrottle) && (i < this._eventIdsToUpdate.length)); i++){
				ids.push(this._eventIdsToUpdate.shift());
			}
			
			if(!this._isBlank(ids)){
				xhrManager.add({
					"url": "/pin.nsf/getEvent?openagent&stub=false&id="+ids.join(","),
					"success": this._updateActivitiesSuccess,
					"errorMsg": "Failed to update events - now working from cache",
					"hitch": this
				});
			}
		},
		
		_callActivityUpdate: function(){
			var ids = new Array();
			for(var i = 0; ((i < this._serverThrottle) && (i < this._activityIdsToUpdate.length)); i++){
				ids.push(this._activityIdsToUpdate.shift());
			}
			
			if(!this._isBlank(ids)){
				xhrManager.add({
					"url": "/pin.nsf/getActivity?openagent&stub=false&id="+ids.join(","),
					"success": this._updateActivitiesSuccess,
					"errorMsg": "Failed to update activities - now working from cache",
					"hitch": this
				});
			}
		},
		
		_isActivityStub: function(obj){
			return (!this._hasOwnProperty(obj.data, "description") && !this._hasOwnProperty(obj.data, "contacts"));
			//return (!this._hasOwnProperty(obj.data, "description") && !this._hasOwnProperty(obj.data, "venues") && !this._hasOwnProperty(obj.data, "contacts"));
		},
		
		_convertActivityToDataItem: function(activity){
			activity.id = activity.id.toLowerCase();
			activity.category1 = this._parseCategory(activity, 1);
			activity.isStub = ((this._hasProperty(activity, "isStub")) ? activity.isStub : true);
			activity.tags = this._parseTags(activity);
			
			array.forEach(activity.category1, function(category, n){
				activity.category1[n] = category.replace(" & "," and ");
			}, this);
			
			return {
				"id": activity.id,
				"type": "activity",
				"data": activity,
				"isStub": activity.isStub
			}
		},
		
		_convertEventToDataItem: function(event){
			event.id = event.id.toLowerCase();
			event.category1 = this._parseCategory(event, 1);
			event.isStub = ((this._hasProperty(event, "isStub")) ? event.isStub : true);
			event.tags = this._parseTags(event);
			
			array.forEach(event.category1, function(category, n){
				event.category1[n] = category.replace(" & "," and ");
			}, this);
			
			return {
				"id": event.id,
				"type": "event",
				"data": event,
				"isStub": event.isStub
			}
		}
	});
	
	return construct;
});