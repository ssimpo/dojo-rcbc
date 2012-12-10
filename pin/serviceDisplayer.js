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
	"dojo/_base/lang",
	"dojo/dom-construct",
	"dojo/dom-attr",
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
	lang, domConstr, domAttr, array,
	
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
		
		"titleNode": null,
		"keyFeaturesNode": null,
		"descriptionNode": null,
		"contactsWidget": null,
		"costsWidget": null,
		"accessWidget": null,
		"serviceHoursWidget": null,
		"venuesNode": null,
		"serviceListNode": null,
		
		"_accessTesters": [
			["appointmentOnly", "appointmentOnlyDetails"],
			["dropIn", "dropInDetails"],
			["genderTarget", "genderTargetType"],
			["geographicRestriction", "geographicCoverage"],
			["referralOnly", "referralOnlyDetails"]
		],
		
		_setDataAttr: function(data){
			this.data = data;
			this._createContent();
		},
		
		_createAttachPoint: function(propName, tagName, constructor){
			constructor = ((constructor == undefined) ? {} : constructor);
			
			if(!this._isElement(this[propName]) && !this._isWidget(this[propName])){
				if(Object.prototype.toString.call(tagName) === '[object String]'){
					this[propName] = domConstr.create(
						tagName, constructor, this.domNode
					);
				}else{
					this[propName] = new tagName(constructor);
					if(this._isWidget(this[propName])){
						domConstr.place(this[propName].domNode, this.domNode);
					}
				}
			}else if((this._isWidget(this[propName])) && (Object.prototype.toString.call(tagName) !== '[object String]')){
				try{
					for(var key in constructor){
						this[propName].set(key, constructor[key]);
					}
				}catch(e){}
			}
		},
		
		_createContent: function(){
			this._createTitle();
			this._createServiceList();
			this._createDescription();
			this._createKeyFeatures();
			this._createContactsTable();
			this._createVenues();
			this._createCostTable();
			this._createAccessTable();
			this._createServiceHoursTable();
		},
		
		_createServiceList: function(){
			this._createAttachPoint("serviceListNode", "ul");
			domConstr.empty(this.serviceListNode);
			
			if(!this._isBlank(this.data.services)){
				array.forEach(this.data.services, function(service){
					var li = domConstr.create("li", {}, this.serviceListNode);
					domConstr.create("a", {
						"innerHTML": service.title,
						"href": service.href
					}, li);
				}, this);
			}
		},
		
		_createTitle: function(){
			this._createAttachPoint("titleNode", "h1");
			domConstr.empty(this.titleNode);
			
			var title = this._getTitle();
			title = ((title === "") ? "Unknown Service": title);
			domAttr.set(this.titleNode, "innerHTML", title);
			
			return this.titleNode;
		},
		
		_createKeyFeatures: function(){
			this._createAttachPoint("keyFeaturesNode", "div");
			domConstr.empty(this.keyFeaturesNode);
			
			var ol = this._createFeaturesOl();
			if(!this._isBlank(ol)){
				domConstr.create("h2", {
					"innerHTML": "Key Features:"
				}, this.keyFeaturesNode);
				domConstr.place(ol, this.keyFeaturesNode);
			}
			
			return this.keyFeaturesNode;
		},
		
		_createFeaturesOl: function(){
			var ol = domConstr.create("ol");
			
			array.forEach([1,2,3,4,5,6], function(key){
				var feature = this._getField("keyFeature"+key);
				if(!this._isBlank(feature)){
					domConstr.create("li", {
						"innerHTML": feature
					}, ol);
				}
			}, this);
			
			return ol;
		},
		
		_createDescription: function(){
			this._createAttachPoint("descriptionNode", "div");
			domConstr.empty(this.descriptionNode);
			
			var description = this._getField("description");
			this._createParagraphNodesFromText(
				this.descriptionNode, description
			);
			
			return this.descriptionNode;
		},
		
		_createParagraphNodesFromText: function(parentNode, text){
			var paras = text.split("\n\n");
			array.forEach(paras, function(para){
				domConstr.create("p", {
					"innerHTML": para.replace(/\n/g, "<br />")
				}, parentNode);
			}, this);
			
			return parentNode;
		},
		
		_getField: function(fieldName){
			var value = ""
			
			if(this.data.hasOwnProperty(fieldName)){
				value = this.data[fieldName];
			}
			
			return lang.trim(value);
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
			
			if(this._isBlank(title)){
				title = this._getField("title");
			}
			
			return title;
		},
		
		_createServiceHoursTable: function(){
			this._getTableWidgetDom({
				"propertyNode": "serviceHoursWidget",
				"constructor": serviceHoursTable,
				"field": "servicePeriods",
				"title": strings.serviceHours
			});
			return this.serviceHoursWidget.domNode;
		},
		
		_createAccessTable: function(){
			if(this._hasAccessDetails()){
				this._getTableWidgetDom({
					"propertyNode": "accessWidget",
					"constructor": accessTable,
					"title": strings.accessDetails
				});
				return this.accessWidget.domNode;
			}
			
			return domConstr.create("div");
		},
		
		_createCostTable: function(){
			this._getTableWidgetDom({
				"propertyNode": "costsWidget",
				"constructor": costTable,
				"field": "costs",
				"title": strings.costDetails
			});
			return this.costsWidget.domNode;
		},
		
		_createContactsTable: function(){
			this._getTableWidgetDom({
				"propertyNode": "contactsWidget",
				"constructor": contactsTable,
				"field": "contacts",
				"title": strings.contactsTitle
			});
			return this.contactsWidget.domNode;
		},
		
		_getTableWidgetDom: function(args){
			args = this._getTableWidgetSetDataArgument(args);
			
			var node;
			if(args.hasOwnProperty("data")){
				if(args.hasOwnProperty("propertyNode")){
					this._createAttachPoint(
						args.propertyNode,
						args.constructor, {
							"data": args.data,
							"title": args.title
						}
					);
					node = this[args.propertyNode].domNode;
				}else{
					var widget = new args.constructor({
						"data": args.data,
						"title": args.title
					});
					node = widget.domNode;
				}
			}
			
			if(node === undefined){
				if(args.hasOwnProperty("propertyNode")){
					this._createAttachPoint(args.propertyNode, "div");
					node = this.contactsWidget;
				}else{
					node = domConstr.create("div");
				}
			}
			
			return node;
		},
		
		_getTableWidget: function(args){
			return new args.constructor({
				"data": args.data,
				"title": args.title
			});
		},
		
		_getTableWidgetSetDataArgument: function(args){
			if(args.hasOwnProperty("field")){
				args.data = this.data[args.field];
			}else{
				args.data = this.data;	
			}
			
			return args;
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
		
		_createVenues: function(){
			this._createAttachPoint("venuesNode", "div");
			domConstr.empty(this.venuesNode);
			
			if(!this._isBlank(this.data.venues)){
				array.forEach(this.data.venues, function(venue){
					var venueDom = this._createVenue(venue);
					if(venueDom !== null){
						domConstr.place(venueDom, this.venuesNode);
					}
				},this);
			}
			
			return this.venuesNode;
		},
		
		_createVenue: function(venue){
			var venueDom = null;
			
			if(venue.venueId != ""){
				var venueWidget = new venueDisplayer(venue);
				venueDom = venueWidget.domNode;
			}
			
			return venueDom;
		}
	});
	
	return construct;
});