// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/i18n",
	"dojo/i18n!./nls/venuesDisplayer",
	"dojo/text!./views/venuesDisplayer.html",
	"simpo/typeTest",
	"dojo/dom-construct",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/topic",
	"./venuesDisplayer/venueDisplayer",
	"dojo/on",
	
	"simpo/maps/google/canvas"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template,
	typeTest, domConstr, lang, array, topic, venueDisplayer, on
){
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"description": null,
		"venueId": "",
		"data": null,
		
		"application": {},
		"titleLevel": 2,
		"hiddenNode": null,
		"value": null,
		"_venueIds": {},
		
		"show": {
			"map": true
		},
		
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._initTopicSubscriptions();
		},
		
		_initTopicSubscriptions: function(){
			topic.subscribe(
				"/rcbc/pin/updateVenue",
				lang.hitch(this, this._venueDataUpdate)
			);
		},
		
		_setValueAttr: function(value){
			try{
				this.clear();
				this._hideMap();
				if(!typeTest.isEmpty(value)){
					value = this._parseVenuesArray(value);
					this.value = value;
					this._addVenues(value);
				}else{
					this.value = new Array();
				}
			}catch(e){
				console.info("Could not set the venues displayer value.", e, value);
			}
		},
		
		_parseVenuesArray: function(venues){
			var newVenues = new Array();
			
			try{
				if(typeTest.isArray(venues)){
					array.forEach(venues, function(venue, n){
						if(typeTest.isString(venue)){
							newVenues.push({
								"description": "",
								"venueId": venue
							});
						}else if(this._isValueVenueObject(venue)){
							newVenues.push(venue);
						}
					}, this);
				}else if(typeTest.isObject(venues)){
					if(this._isValueVenueObject(venues)){
						newVenues.push(venues);
					}
				}
			}catch(e){
				console.info("Could not parse venues array: ", venues);
			}
			
			return newVenues;
		},
		
		_isValueVenueObject: function(venue){
			if(typeTest.isProperty(venue, ["venueId", "description"])){
				return !typeTest.isBlank(venue.venueId);
			}
			
			return false;
		},
		
		clear: function(){
			try{
				this._venueIds = new Object();
				domConstr.empty(this.venuesNode);
				if(this.show.map){
					this.mapNode.clear();
				}
			}catch(e){
				console.info("Could not clear the map.");
			}
		},
		
		_addVenues: function(venues){
			array.forEach(venues, function(venue){
				if(!typeTest.isProperty(this._venueIds, venue.venueId)){
					try{
						var venueWidget = new venueDisplayer({
							"application": this.application,
							"value": venue.venueId,
							"description": venue.description,
							"titleLevel": this.titleLevel
						});
						domConstr.place(
							venueWidget.domNode,
							this.venuesNode
						);
						domConstr.place(
							this.venuesNode,
							this.domNode
						);
					}catch(e){
						console.info("Could not place venue widget.");
					}
					
					if(this.show.map){
						try{
							this._venueIds[venue.venueId.toLowerCase()] = {
								"widget": venueWidget,
								"mapMarker": null
							};
							this._plotOnMap(venue.venueId);
						}catch(e){
							console.info("Could not plot venue: ", venue);
						}
					}
				}
			}, this);
		},
		
		_plotOnMap: function(venueId){
			if(!typeTest.isBlank(venueId)){
				venueId = venueId.toLowerCase();
				var data = this.application.store.getVenue(venueId);
				
				if(!typeTest.isBlank(data)){
					var postcode = this._getPostcodeFromVenueData(data);
					
					if(!typeTest.isBlank(postcode)){
						this.mapNode.plot(postcode, lang.hitch(this, function(marker){
							this._venueIds[venueId].mapMarker = marker;
							marker.setIcon("/images/PINsml.png");
							this._showMap();
							this.mapNode.centre(
								marker.position.lat(),
								marker.position.lng()
							);
						}));
					}
				}else{
					this.application.store.updateVenue(venueId);
				}
			}
		},
		
		_getPostcodeFromVenueData: function(data){
			if(!typeTest.isBlank(data)){
				if(typeTest.isProperty(data, "data")){
					if(typeTest.isProperty(data.data, "postcode")){
						return data.data.postcode;
					}
				}
			}
			
			return "";
		},
		
		_hideMap: function(){
			try{
				this._hideNode(this.mapNode);
			}catch(e){
				console.info("Could not hide the map");
			}
		},
		
		_hideNode: function(node){
			try{
				if(typeTest.isWidget(node)){
					node = node.domNode
				}
				if(typeTest.isElement(node)){
					if(this.hiddenNode !== null){
						domConstr.place(node, this.hiddenNode);
					}
				}
			}catch(e){
				console.info("Could not hide venue node item.", e);
			}
		},
		
		_showMap: function(){
			this._showNode(
				this.mapNode,
				this.application.serviceDisplayer.domNode
			);
			if(google){
				google.maps.event.trigger(this.mapNode.map, "resize");
			}
		},
		
		_showNode: function(node, refNode, position){
			try {
				refNode = ((refNode === undefined) ? this.domNode : refNode);
				position = ((position === undefined) ? "last" : position);
			
				if(typeTest.isWidget(node)){
					node = node.domNode
				}
				if(typeTest.isElement(node)){
					if(this.hiddenNode !== null){
						domConstr.place(node, refNode, position);
					}
				}
			}catch(e){
				console.info("Could not show venue node item.", e);
			}
		},
		
		_venueDataUpdate: function(data){
			if(!typeTest.isBlank(data)){
				array.forEach(this.value, function(venue){
					if(typeTest.isEqual(venue.venueId, data)){
						this._plotOnMap(data);
					}
				}, this);
			}
		}
	});
	
	return construct;
});