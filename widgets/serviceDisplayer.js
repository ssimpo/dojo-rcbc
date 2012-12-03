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
	"dojo/i18n!./nls/serviceDisplayer",
	"dojo/text!./views/serviceDisplayer.html",
	"dojo/request",
	"dojo/_base/lang",
	"dojo/dom-construct",
	"dojo/_base/array",
	"./serviceDisplayer/contactsTable",
	"./serviceDisplayer/venueDisplayer"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template,
	request, lang, domConstr, array,
	
	contactsTable, venueDisplayer
) {
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"id": "",
		"data": {},
		
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._loadServiceJson();
		},
		
		_loadServiceJson: function(){
			if(this.id !== ""){
				if(this.id.length == 32){
					request(
						"/test/stephen/pin.nsf/getService?openagent&id="+this.id, {
							"handleAs": "json",
							"preventCache": true
						}
					).then(
						lang.hitch(this, this._jsonLoaded),
						function(err){
							console.error(err);
						}
					);
				}
			}
		},
		
		_jsonLoaded: function(data){
			console.log(data);
			this.data = data;
			this._createContent();
		},
		
		_createContent: function(){
			domConstr.place(this._createTitle(), this.domNode);
			domConstr.place(this._createDescription(), this.domNode);
			domConstr.place(this._createKeyFeatures(), this.domNode);
			domConstr.place(this._createContactsTable(), this.domNode);
			domConstr.place(this._createVenues(), this.domNode);
		},
		
		_getField: function(fieldName){
			var value = ""
			
			if(this.data.hasOwnProperty(fieldName)){
				value = this.data[fieldName];
			}
			
			return lang.trim(value);
		},
		
		_createVenues: function(){
			var div = domConstr.create("div");
			
			if(this.data.hasOwnProperty("venues")){
				array.forEach(this.data.venues, function(venue){
					var venueDom = this._createVenue(venue);
					if(venueDom !== null){
						domConstr.place(venueDom, div);
					}
				},this);
			}
			
			return div;
		},
		
		_createVenue: function(venue){
			var venueDom = null;
			
			if(venue.venueId != ""){
				var venueWidget = new venueDisplayer(venue);
				venueDom = venueWidget.domNode;
			}
			
			return venueDom;
		},
		
		_createContactsTable: function(){
			if(this.data.hasOwnProperty("contacts")){
				var contacts = this.data.contacts;
				if(contacts.length > 0){
					var contactsWidget = new contactsTable({
						"data":contacts
					});
					
					return contactsWidget.domNode;
				}
			}
			
			return domConstr.create("div");
		},
		
		_createKeyFeatures: function(){
			var div = domConstr.create("div");
			var ol = domConstr.create("ol");
			var hasFeatures = false;
			
			array.forEach([1,2,3,4,5,6], function(key){
				var feature = this._getField("keyFeature"+key);
				if(feature !== ""){
					domConstr.create("li", {
						"innerHTML": feature
					}, ol);
					hasFeatures = true;
				}
			}, this);
			
			if(hasFeatures){
				domConstr.create("h2", {
					"innerHTML": "Key Features:"
				}, div);
				domConstr.place(ol, div);
			}
			
			return div;
		},
		
		_createDescription: function(){
			var description = this._getField("description");
			description = description.split("\n\n");
			
			var div = domConstr.create("div");
			array.forEach(description, function(para){
				domConstr.create("p", {
					"innerHTML": para.replace(/\n/g, "<br />")
				}, div);
			}, this);
			
			return div;
		},
		
		_createTitle: function(){
			var title = this._getTitle();
			var titleDom = domConstr.create("h1", {
				"innerHTML": ((title === "") ? "Unknown Service": title)
			});
			return titleDom;
		},
		
		_getTitle: function(){
			var title = "";
			var serviceTitle = this._getField("serviceName");
			var orgTitle = this._getField("orgName");
			
			if((serviceTitle === "") && (orgTitle !== "")) {
				title = orgTitle;
			}else if((serviceTitle !== "") && (orgTitle !== "")) {
				title = serviceTitle + " ("+orgTitle+")";
			}else{
				title = serviceTitle;
			}
			
			return title;
		}
	});
	
	return construct;
});