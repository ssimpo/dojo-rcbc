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
	"./_variableTestMixin",
	"dojo/i18n",
	"dojo/i18n!./nls/serviceDisplayer",
	"dojo/text!./views/serviceDisplayer.html",
	"dojo/request",
	"dojo/_base/lang",
	"dojo/dom-construct",
	"dojo/_base/array",
	"./serviceDisplayer/contactsTable",
	"./serviceDisplayer/venueDisplayer",
	"./serviceDisplayer/costTable",
	"./serviceDisplayer/accessTable",
	"./serviceDisplayer/serviceHoursTable"
], function(
	declare,
	_widget, _templated, _wTemplate, _variableTestMixin,
	i18n, strings, template,
	request, lang, domConstr, array,
	
	contactsTable, venueDisplayer, costTable, accessTable, serviceHoursTable
){
	"use strict";
	
	var construct = declare([
		_widget, _templated, _wTemplate, _variableTestMixin
	],{
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"id": "",
		"data": {},
		
		"_accessTesters": [
			["appointmentOnly", "appointmentOnlyDetails"],
			["dropIn", "dropInDetails"],
			["genderTarget", "genderTargetType"],
			["geographicRestriction", "geographicCoverage"],
			["referralOnly", "referralOnlyDetails"]
		],
		
		
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
			domConstr.place(this._createCostTable(), this.domNode);
			domConstr.place(this._createAccessTable(), this.domNode);
			domConstr.place(this._createServiceHoursTable(), this.domNode);
		},
		
		_getField: function(fieldName){
			var value = ""
			
			if(this.data.hasOwnProperty(fieldName)){
				value = this.data[fieldName];
			}
			
			return lang.trim(value);
		},
		
		_createServiceHoursTable: function(){
			return this._getTableWidgetDom({
				"constructor": serviceHoursTable,
				"field": "servicePeriods",
				"title": strings.serviceHours
			});
		},
		
		_createAccessTable: function(){
			if(this._hasAccessDetails()){
				return this._getTableWidgetDom({
					"constructor": accessTable,
					"title": strings.accessDetails
				});
			}
			
			return domConstr.create("div");
		},
		
		_createCostTable: function(){
			return this._getTableWidgetDom({
				"constructor": costTable,
				"field": "costs",
				"title": strings.costDetails
			});
		},
		
		_createContactsTable: function(){
			return this._getTableWidgetDom({
				"constructor": contactsTable,
				"field": "contacts",
				"title": strings.contactsTitle
			});
		},
		
		_getTableWidgetDom: function(args){
			args = this._getTableWidgetSetDataArgument(args);
			
			if(args.hasOwnProperty("data")){
				var widget = new args.constructor({
					"data": args.data,
					"title": args.title
				});
				
				return widget.domNode;
			}
			
			return domConstr.create("div");
		},
		
		_getTableWidget: function(args){
			return new args.constructor({
				"data": args.data,
				"title": args.title
			});
		},
		
		_getTableWidgetSetDataArgument: function(args){
			if(args.hasOwnProperty("field")){
				if(!this._isBlank(this.data[args.field])){
					args.data = this.data[args.field];
				}
			}else{
				args.data = this.data;	
			}
			
			return args;
		},
		
		_hasAccessCheck: function(enableField, contentField){
			if(this._isTrue(this.data[enableField])){
				if(this._isBlank(this.data[contentField])){
					return true;
				}
			}
			
			return false;
		},
		
		_hasAccessCheckAge: function(){
			if(this._isTrue(this.data.ageTarget)){
				if((this._isBlank(this.data.age1)) || (this._isBlank(this.data.age2))){
					return true;
				}
				if((this._isBlank(this.data.age1Months)) || (this._isBlank(this.data.age2Months))){
					return true;
				}
			}
			
			return false;
		},
		
		_hasAccessDetails: function(){
			for(var i = 0; i < this._accessTesters.length; i++){
				if(this._hasAccessCheck(
					this._accessTesters[i][0],
					this._accessTesters[i][1]
				)){
					return true;
				}
			}
			
			if(this._hasAccessCheckAge()){
				return true;
			}
			
			if(this._isBlank(this.data.accessDetails)){
				return true;
			}
			return false;
		},
		
		_createVenues: function(){
			var div = domConstr.create("div");
			
			if(!this._isBlank(this.data.venues)){
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
			
			if((serviceTitle === "") && (orgTitle !== "")){
				title = orgTitle;
			}else if((serviceTitle !== "") && (orgTitle !== "")){
				title = serviceTitle + " ("+orgTitle+")";
			}else{
				title = serviceTitle;
			}
			
			return title;
		}
	});
	
	return construct;
});