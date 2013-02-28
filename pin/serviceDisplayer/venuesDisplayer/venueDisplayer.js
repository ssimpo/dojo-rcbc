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
	"dojo/i18n!./nls/venueDisplayer",
	"dojo/text!./views/venueDisplayer.html",
	"simpo/typeTest",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/topic"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template,
	typeTest, domConstr, domAttr, lang, array, topic
) {
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"description": "",
		"value": "",
		"data": {},
		"titleLevel": 2,
		
		
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
			if(typeTest.isString(value)){
				this.value = value.toLowerCase();
				this._getData();
			}else{
				this.value = "";
			}
		},
		
		_setDataAttr: function(value){
			if(!typeTest.isBlank(value)){
				if(typeTest.isObject(value)){
					this.data = value;
					this._update();
				}else{
					this.data = new Object();
				}
			}else{
				this.data = new Object();
			}
		},
		
		_setDescriptionAttr: function(value){
			try{
				if(typeTest.isString(value)){
					if(!typeTest.isBlank(value)){
						domAttr.set(this.titleNode, "innerHTML", value + ":");
						this.description = value;
					}else{
						value = this._updateDescription();
						if(!typeTest.isBlank(value)){
							this.set("description", value);
						}else{
							domConstr.empty(this.titleNode);
							this.description = "";
						}
					}
				}else{
					domConstr.empty(this.titleNode);
					this.description = "";
				}
			}catch(e){
				console.info("Could not set the venue description.", e)
			}
		},
		
		_setTitleLevel: function(){
			this.titleNode = domConstr.create(
				"h" + this.titleLevel.toString(), {
					"class": domAttr.get(this.titleNode, "class"),
					"innerHTML": domAttr.get(this.titleNode, "innerHTML")
				},
				this.titleNode,
				"replace"
			)
		},
		
		_venueDataUpdate: function(data){
			if(!typeTest.isBlank(data)){
				if(typeTest.isEqual(data, this.value)){
					this._getData();
				}
			}
		},
		
		_getData: function(){
			if(!typeTest.isBlank(this.value)){
				var data = this.application.store.getVenue(this.value);
				if(!typeTest.isBlank(data)){
					this.set("data", data.data);
				}else{
					this.application.store.updateVenue(this.value);
				}
			}
		},
		
		_update: function(){
			try{
				var description = this._updateDescription();
				if(!typeTest.isBlank(description)){
					this.set("description", description);
				}
				this._updateAddressNode();
			}catch(e){
				console.info("Could not handle venue data.", e);
			}
		},
		
		_updateDescription: function(){
			var description = "";
			
			description = lang.trim(this.description);
			if(typeTest.isBlank(description)){
				if(typeTest.isProperty(this.data, "name")){
					description = lang.trim(this.data.name);
				}
			}
			
			if(typeTest.isBlank(description)){
				if(typeTest.isProperty(this.data, "house_no_name")){
					if(this.data.house_no_name.length >= 8){
						description = lang.trim(this.data.house_no_name);
					}
				}
			}
			
			return description;
		},
		
		_updateAddressNode: function(){
			domConstr.empty(this.addressNode);
			var addressHTML = this._addAddress();
			
			domConstr.create("div", {
				"innerHTML": addressHTML
			}, this.addressNode);
		},
		
		_addAddress: function(){
			var html = "";
			
			try {
				if(!typeTest.isEqual(this.description, this.data.name)){
					html = this._addAddressLine(
						html, this.data.name, {
							"bold": true
						}
					);
				}
			
				if((!typeTest.isBlank(this.data.house_no_name)) && (!typeTest.isEqual(this.data.house_no_name, this.data.name))){
					if(this.data.house_no_name.length < 8){
						html = this._addAddressLine(
							html,
							this.data.house_no_name + " " + this.data.street
						);
					}else{
						if(!typeTest.isEqual(this.description, this.data.house_no_name)){
							html = this._addAddressLine(
								html, this.data.house_no_name, {
									"bold": typeTest.isBlank(this.data.name)
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
			
			if(typeTest.isProperty(options, "bold")){
				if(options.bold){
					lineText = "<b>" + lineText + "</b>";
				}
			}
			
			var punctuation = ",";
			if(typeTest.isProperty(options, "punctuation")){
				punctuation = options.punctuation;
			}
			
			if(!typeTest.isBlank(lineText)){
				html += (lineText + punctuation + "<br />");
			}
			
			return html;
		}
	});
	
	return construct;
});