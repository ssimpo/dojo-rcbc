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
	"simpo/maps/google/canvas",
	"simpo/interval"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template,
	typeTest, domConstr, lang, array, topic, venueDisplayer, on, canvas, interval
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
		"mapWidget": null,
		"value": null,
		"_venueIds": {},
		
		"show": {
			"map": true
		},
		
		constructor: function(){
			this._initTopicSubscriptions();
		},
		
		postCreate: function(){
			this._initMapWidget();
		},
		
		_initTopicSubscriptions: function(){
			topic.subscribe(
				"/rcbc/pin/updateVenue",
				lang.hitch(this, this._venueDataUpdate)
			);
		},
		
		_initMapWidget: function(){
			var mapWidget = new canvas({
				"class": "rcbcWidgetsVenueDisplayerMap",
				"callback": lang.hitch(this, function(){
					this.mapWidget = mapWidget
					this._hideMap();
				})
			});
		},
		
		_setValueAttr: function(value){
			try{
				this.clear();
				this._hideMap(); // ???? Hide each time?
				
				if(!typeTest.isEmpty(value)){
					value = this._parseVenueData(value);
					this._addVenues(value);
				}else{
					value = new Array();
				}
				
				this.value = value;
			}catch(e){
				console.info("Could not set the venues displayer value.", e, value);
			}
		},
		
		_parseVenueData: function(venues){
			var newVenues = new Array();
			
			try{
				if(typeTest.isArray(venues)){
					newVenues = this._parseVenuesArray(venues);
				}else if(typeTest.isObject(venues)){
					if(this._isValueVenueObject(venues)){
						newVenues.push(venues);
					}
				}
			}catch(e){
				console.info("Could not parse venues data: ", venues, e);
			}
			
			return newVenues;
		},
		
		_parseVenuesArray: function(venues){
			var newVenues = new Array();
			
			try{
				array.forEach(venues, function(venue, n){
					if(typeTest.isString(venue)){
						newVenues.push({"description": "", "venueId": venue});
					}else if(this._isValueVenueObject(venue)){
						newVenues.push(venue);
					}
				}, this);
			}catch(e){
				console.info("Could not parse venues array: ", venues, e);
			}
			
			return newVenues;
		},
		
		_isValueVenueObject: function(venue){
			if(typeTest.isProperty(venue, ["venueId", "description"])){
				return !typeTest.isBlank(venue.venueId);
			}
			
			return false;
		},
		
		_addVenues: function(venues){
			array.forEach(venues, function(venue){
				var venueId = venue.venueId.toLowerCase();
				
				if(!typeTest.isProperty(this._venueIds, venueId)){
					try{
						var venueWidget = this._createVenueWidget(venue);
						this._showNode(venueWidget, this.venuesNode);
						this._showNode(this.venuesNode, this.domNode);
						
						if(this.show.map){
							this._plotOnMap(venueId);
						}
					}catch(e){
						console.info("Could not place venue widget.", e);
					}
				}
			}, this);
		},
		
		_createVenueWidget: function(venue){
			var venueId = venue.venueId.toLowerCase();
			var venueWidget = null;
			
			try{
				venueWidget = venueDisplayer({
					"application": this.application,
					"value": venueId,
					"description": venue.description,
					"titleLevel": this.titleLevel
				});
			
				if(!typeTest.isProperty(venueId)){
					this._venueIds[venueId] = {
						"widget": venueWidget, "mapMarker": null
					};
				}
			}catch(e){
				console.info("Could not create venue widget");
			}
			
			return venueWidget;
		},
		
		_plotOnMap: function(venueId){
			try{
				if(!typeTest.isBlank(venueId)){
					venueId = venueId.toLowerCase();
					var data = this.application.store.getVenue(venueId);
					
					if(!typeTest.isBlank(data)){
						var postcode = this._getPostcodeFromVenueData(data);
						
						if(!typeTest.isBlank(postcode)){
							this._plotOnMap2(venueId, postcode);
						}
					}else{
						this.application.store.updateVenue(venueId);
					}
				}
			}catch(e){
				console.info("Could not lookup postcode and plot on map.");
			}
		},
		
		_plotOnMap2: function(venueId, postcode){
			if(this.mapWidget === null){
				interval.add(lang.hitch(this, this._plotOnMap2, venueId, postcode));
			}else{
				try{
					this.mapWidget.addOnload(
						lang.hitch(this, this._plotOnMap3, venueId, postcode)
					);
				}catch(e){
					console.info(e);
				}
			}
		},
		
		_plotOnMap3: function(venueId, postcode){
			venueId = venueId.toLowerCase();
			
			this.mapWidget.plot(postcode, lang.hitch(this, function(marker){
				this._venueIds[venueId].mapMarker = marker;
				marker.setIcon("/images/PINsml.png");
				this._showMap();
				this.mapWidget.centre(
					marker.position.lat(), marker.position.lng()
				);
			}));
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
		
		clear: function(){
			try{
				this._venueIds = new Object();
				domConstr.empty(this.venuesNode);
				if((this.show.map) && (this.mapWidget !== null)){
					this.mapWidget.clear();
				}
			}catch(e){
				console.info("Could not clear the map.", e);
			}
		},
		
		_hideMap: function(){
			try{
				if(this.mapWidget !== null){
					this._hideNode(this.mapWidget);
				}
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
				this.mapWidget.domNode,
				this.application.serviceDisplayer.domNode,
				"last"
			);
			if(google){
				google.maps.event.trigger(this.mapWidget.map, "resize");
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
					domConstr.place(node, refNode, position);
				}
			}catch(e){
				console.info("Could not show venue node item.", e);
			}
		},
		
		_venueDataUpdate: function(data){
			if(!typeTest.isBlank(data)){
				array.forEach(this.value, function(venue){
					if(typeTest.isEqual(venue.venueId.toLowerCase(), data)){
						this._plotOnMap(data);
					}
				}, this);
			}
		}
	});
	
	return construct;
});