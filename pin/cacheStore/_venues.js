// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/request",
	"dojo/topic"
], function(
	declare, array, lang, request, topic
) {
	"use strict";
	
	var construct = declare(null, {
		constructor: function(){
			this.addIntervalCheck(function(){
				if(!this._isBlank(this._venueIdsToUpdate)){
					this.addIntervalCommand(
						lang.hitch(this, this._callVenuesUpdate)
					);
				}
				if(!this._isBlank(this._venueCache)){
					this.addIntervalCommand(
						lang.hitch(this, this._updateFromVenueCache)
					);
				}
			});
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
			
			try{
				if(!this._isBlank(ids)){
					request(
						this._updateUrls.venueUpdate+"&id="+ids.join(","), {
							"handleAs": "json",
							"preventCache": true,
							"timeout": this.xhrTimeout
						}
					).then(
						lang.hitch(this, this._updateVenueSuccess),
						lang.hitch(this, this._xhrError, this._updateUrls.venueUpdate)
					);
				}
			}catch(e){
				console.info("Failed to update venues - now working from cache");
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