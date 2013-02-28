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
	"../_variableTestMixin",
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
	declare, _widget, _templated, _wTemplate, _variableTestMixin,
	i18n, strings, template,
	typeTest, domConstr, lang, array, topic, venueDisplayer, on
){
	"use strict";
	
	var construct = declare([
		_widget, _templated, _wTemplate, _variableTestMixin
	], {
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
		
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			var self = this;
			var loadDone = false;
			
			on(this.mapNode, "idle", function(){
				if(!loadDone){
					require(["dojo/query"], function($){
						$(".gmnoprint").forEach(function(area){
							console.log("HELLO-3");
							console.log(area);
						}, self);
					});
					loadDone = true;
				}
			});
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
				console.info("Could not set the venues displayer value.", e);
			}
		},
		
		_parseVenuesArray: function(venues){
			var newVenues = new Array();
			
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
			
			return newVenues;
		},
		
		_isValueVenueObject: function(venue){
			if(typeTest.isProperty(venue, ["venueId", "description"])){
				return !typeTest.isBlank(venue.venueId);
			}
			
			return false;
		},
		
		clear: function(){
			this._venueIds = new Object();
			domConstr.empty(this.venuesNode);
			this.mapNode.clear();
		},
		
		_addVenues: function(venues){
			console.log(venues);
			array.forEach(venues, function(venue){
				if(!typeTest.isProperty(this._venueIds, venue.venueId)){
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
					this._venueIds[venue.venueId.toLowerCase()] = {
						"widget": venueWidget,
						"mapMarker": null
					};
					this._plotOnMap(venue.venueId);
				}
			}, this);
		},
		
		_plotOnMap: function(venueId){
			if(!typeTest.isBlank(venueId)){
				venueId = venueId.toLowerCase();
				var data = this.application.store.getVenue(venueId);
				
				if(!typeTest.isBlank(data)){
					var postcode = this._getPostcodeFromVenueData(data);
					console.log(2, postcode);
					//this.mapNode.centre(postcode);
				
					if(!typeTest.isBlank(postcode)){
						this.mapNode.plot(postcode, lang.hitch(this, function(marker){
							this._venueIds[venueId].mapMarker = marker;
							marker.setIcon("/images/PINsml.png");
							this._showMap();
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
			this._hideNode(this.mapNode);
		},
		
		_hideNode: function(node){
			try{
				if(this._isWidget(node)){
					node = node.domNode
				}
				if(this._isElement(node)){
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
			
				if(this._isWidget(node)){
					node = node.domNode
				}
				if(this._isElement(node)){
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