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
	"dojo/i18n!./nls/venueDisplayer",
	"dojo/text!./views/venueDisplayer.html",
	"dojo/dom-construct",
	"dojo/_base/lang",
	"dojo/topic",
	
	"simpo/maps/google/canvas"
], function(
	declare, _widget, _templated, _wTemplate, _variableTestMixin,
	i18n, strings, template,
	domConstr, lang, topic
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
		
		"description": "",
		"venueId": "",
		"data": null,
		
		"application": {},
		"titleLevel": 2,
		"hiddenNode": null,
		
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._initTopicSubscriptions();
			this._getData(lang.hitch(this, this._gotVenueData));
		},
		
		_initTopicSubscriptions: function(){
			topic.subscribe(
				"/rcbc/pin/updateVenue",
				lang.hitch(this, this._venueDataUpdate)
			);
		},
		
		_setVenueIdAttr: function(value){
			this.venueId = value;
			this._getData(lang.hitch(this, this._gotVenueData));
		},
		
		_venueDataUpdate: function(id, data){
			if(this._isEqual(id, this.venueId)){
				this.data = data.data;
				this._gotVenueData();
			}
		},
		
		_gotVenueData: function(){
			this._addDescription();
			this._updateAddressNode();
			this._hideNode(this.mapNode);
		},
		
		_addDescription: function(){
			this.description = lang.trim(this.description);
			if(this.description == ""){
				this.description = lang.trim(this.data.name);
			}
			if(this.description == ""){
				if(this.data.house_no_name.length >= 8){
					this.description = lang.trim(this.data.house_no_name);
				}
			}
		},
		
		_getData: function(callback){
			if(this.venueId !== ""){
				var data = this.application.store.get(this.venueId.toLowerCase());
				if(!this._isBlank(data)){
					this.data = data.data;
					callback();
				}else{
					this.application.store.updateVenue(this.venueId);
				}
			}
		},
		
		_updateAddressNode: function(){
			domConstr.empty(this.addressNode);
			var addressContentNode = this._addTitle();
			var addressHTML = this._addAddress(addressContentNode);
			
			domConstr.create("div", {
				"innerHTML": addressHTML
			}, addressContentNode);
		},
		
		_addTitle: function(){
			if(this.description != ""){
				var subTitleLevel = this.titleLevel + 1;
				var h3 = domConstr.create("h"+subTitleLevel.toString(), {
					"innerHTML": this.description
				}, this.addressNode);
				var indent = domConstr.create("div", {
					"class": "indent"
				}, this.addressNode);
				
				return indent;
			}
			
			return this.addressNode;
		},
		
		_addAddress: function(addressContentNode){
			var html = "";
			
			try {
				if(!this._isEqual(this.description, this.data.name)){
					html = this._addAddressLine(
						html, this.data.name, {
							"bold": true
						}
					);
				}
			
				if((!this._isBlank(this.data.house_no_name)) && (!this._isEqual(this.data.house_no_name, this.data.name))){
					if(this.data.house_no_name.length < 8){
						html = this._addAddressLine(
							html,
							this.data.house_no_name + " " + this.data.street
						);
					}else{
						if(!this._isEqual(this.description, this.data.house_no_name)){
							html = this._addAddressLine(
								html, this.data.house_no_name, {
									"bold": this._isBlank(this.data.name)
								}
							);
						}
						html = this._addAddressLine(html, this.data.street);
					}
				}else{
					html = this._addAddressLine(html, this.data.street);
				}
			
				html = this._addAddressLine(
					html, this.data.area
				);
				html = this._addAddressLine(
					html, this.data.town, {
						"punctuation": "."
					}
				);
				html = this._addAddressLine(
					html, this.data.postcode, {
						"punctuation": ""
					}
				);
			}catch(e){
				console.info("Could not add addrsss to venue displayer", e);
			}
			
			return html;
		},
		
		_addAddressLine: function(html, lineText, options){
			options = ((options === undefined) ? {} : options);
			lineText = lang.trim(lineText);
			
			if(this._hasProperty(options, "bold")){
				if(options.bold){
					lineText = "<b>" + lineText + "</b>";
				}
			}
			
			var punctuation = ",";
			if(this._hasProperty(options, "punctuation")){
				punctuation = options.punctuation;
			}
			
			if(!this._isBlank(lineText)){
				html += (lineText + punctuation + "<br />");
			}
			
			return html;
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
				console.info("Could not hide venue node item", e);
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
				console.info("Could not show venue node item", e);
			}
		},
		
		_showMap: function(){
			this._showNode(this.mapNode);
		}
	});
	
	return construct;
});