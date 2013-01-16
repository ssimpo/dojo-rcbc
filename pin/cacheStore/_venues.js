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
	"dojo/topic"
], function(
	declare, interval, xhrManager, array, lang, topic
) {
	"use strict";
	
	var construct = declare(null, {
		"_venueIdsToUpdate": [],
		"_venueCache": [],
		
		constructor: function(){
			interval.add(
				lang.hitch(this, this._callVenuesUpdate), true, 2
			);
			interval.add(
				lang.hitch(this, this._updateFromVenueCache), true, 2
			);
		},
		
		getVenue: function(id){
			var venue = this.get(id);
			if(!this._isBlank(venue)){
				if(this._hasProperty(venue, "type")){
					if(venue.type == "venue"){
						return venue;
					}
				}
			}
			
			return null;
		},
		
		updateVenue: function(venue){
			if(this._isString(venue)){
				if(venue.length == 32){
					this._venueIdsToUpdate.push(venue);
					return true;
				}else{
					return false;
				}
			}else if(this._isObject(venue)){
				if(this._hasOwnProperty(venue, "id")){
					this._venueIdsToUpdate.push(venue.id);
					return true;
				}else{
					return false;
				}
			}
				
			return false;
		},
		
		_callVenuesUpdate: function(){
			var ids = new Array();
			for(var i = 0; ((i < this._serverThrottle) && (i < this._venueIdsToUpdate.length)); i++){
				ids.push(this._venueIdsToUpdate.shift());
			}
			
			if(!this._isBlank(ids)){
				xhrManager.add({
					"url": "/pin.nsf/getVenue?openagent&id="+ids.join(","),
					"success": this._updateVenueSuccess,
					"errorMsg": "Failed to update venues - now working from cache",
					"hitch": this
				});
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
		
		_updateVenuesFromArray: function(venues){
			if(!this._isBlank(venues)){
				array.forEach(venues, this._updateVenue, this);
			}
		},
		
		_updateVenue: function(venue){
			var data = this._convertVenueToDataItem(venue);
			this.put(data);
			topic.publish("/rcbc/pin/updateVenue", data.id, data);
		},
		
		_updateVenueSuccess: function(data){
			if(this._hasProperty(data, "venues")){
				this._venueCache = this._venueCache.concat(data.venues);
			}
		},
		
		_updateFromVenueCache: function(){
			if(!this._isBlank(this._venueCache)){
				var venues = new Array();
				for(var i = 0; ((i < this._throttle) && (i < this._venueCache.length)); i++){
					venues.push(this._venueCache.shift());
				}
				this._updateVenuesFromArray(venues);
			}
		}
	});
	
	return construct;
});