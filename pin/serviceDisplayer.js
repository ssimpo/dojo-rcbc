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
	"dijit/form/Button",
	"dojo/topic",
	"./serviceDisplayer/contactsTable",
	"./serviceDisplayer/venueDisplayer",
	"./serviceDisplayer/costTable",
	"./serviceDisplayer/accessTable",
	"./serviceDisplayer/serviceHoursTable",
	"simpo/maps/google/canvas"
], function(
	declare,
	_widget, _templated, _wTemplate, _variableTestMixin,
	i18n, strings, template,
	lang, domConstr, domAttr, array, Button, topic,
	
	contactsTable, venueDisplayer, costTable, accessTable, serviceHoursTable,
	googleMap
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
		
		"value": {},
		
		"keyFeaturesNode": null,
		"descriptionNode": null,
		"contactsWidget": null,
		"costsWidget": null,
		"accessWidget": null,
		"serviceHoursWidget": null,
		"venuesNode": null,
		"mapNode": null,
		
		"application": null,
		"parentNode": null,
		"hiddenNode": null,
		"parentPosPlace": "last",
		
		"titleNotify": false,
		
		"titleLevel": 1,
		
		"show": {
			"title": false,
			"titleLink": false,
			"description": true,
			"keyFeatures": true,
			"contacts": true,
			"costs": true,
			"venues": true,
			"serviceHours": true,
			"accessDetails": true,
			"map": true
		},
		
		"_accessTesters": [
			["appointmentOnly", "appointmentOnlyDetails"],
			["dropIn", "dropInDetails"],
			["genderTarget", "genderTargetType"],
			["geographicRestriction", "geographicCoverage"],
			["referralOnly", "referralOnlyDetails"]
		],
		
		_initNodes: function(){
			if(this.application !== null){
				if(this.parentNode === null){
					this.parentNode = this.application.articleContentNode;
				}
				if(this.hiddenNode === null){
					this.hiddenNode = this.application.hiddenDiv;
				}
			}
		},
		
		_hideWidget: function(){
			if(this.hiddenNode !== null){
				domConstr.place(this.domNode, this.hiddenNode);
			}
		},
		
		_showWidget: function(){
			if(this.parentNode !== null){
				domConstr.place(
					this.domNode, this.parentNode, this.parentPosPlace
				);
			}
		},
		
		_setValueAttr: function(value){
			this._initNodes();
			this.value = value;
			
			if(this._isBlank(this.value)){
				this._hideWidget();
			}else{
				this._showWidget();
				this._createContent(value);
			}
		},
		
		clear: function(){
			this.set("value",{});
		},
		
		_clear: function(){
			this._ifHasClear("titleNode", !this.show.title);
			this._ifHasClear("descriptionNode");
			this._ifHasClear("keyFeaturesNode");
			this._ifHasClear("contactsWidget");
			this._ifHasClear("costsWidget");
			this._ifHasClear("accessWidget");
			this._ifHasClear("serviceHoursWidget");
			this._ifHasClear("venuesNode");
			//this._ifHasClear("mapNode");
		},
		
		_ifHasClear: function(nodeName, destroy){
			destroy = ((destroy === undefined) ? false: destroy);
			if(this._isElement(this[nodeName]) || this._isWidget(this[nodeName])){
				if(destroy){
					if(this._isElement(this[nodeName])){
						domConstr.destroy(this[nodeName]);
					}else{
						this[nodeName].destroy();
					}
					this[nodeName] = null;
				}else{
					if(this._isElement(this[nodeName])){
						domConstr.empty(this[nodeName]);
					}else{
						domConstr.empty(this[nodeName].domNode);
					}
				}
			}
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
		
		_createContent: function(value){
			if(this.titleNotify || this.show.title){
				this._createTitle(value);
			}
			
			this._createSection(this.show.description, "_createDescription", value);
			this._createSection(this.show.keyFeatures, "_createKeyFeatures", value);
			this._createSection(this.show.contacts, "_createContactsTable", value);
			this._createSection(this.show.venues, "_createVenues", value);
			this._createSection(this.show.costs, "_createCostTable", value);
			this._createSection(this.show.accessDetails, "_createAccessTable", value);
			this._createSection(this.show.serviceHours, "_createServiceHoursTable", value);
			//this._createSection(this.show.map, "_createMap", value);
		},
		
		_createSection: function(tester, method, value){
			if(tester){
				this[method](value);
			}
		},
		
		_createTitle: function(value){
			if(this.show.title){
				this._createAttachPoint(
					"titleNode", "h" + this.titleLevel.toString()
				);
				domConstr.empty(this.titleNode);
			}
			
			var title = this._getTitleText(value);
			if(this.show.titleLink){
				var id = this._getField(value, "id");
				if(!this._isBlank(id)){
					title = "<a href=\"#id="+id+"\">"+title+"</a>";
				}
			}
			
			if(this.show.title && !this._isBlank(title)){
				domAttr.set(this.titleNode, "innerHTML", title);
			}
			
			if(this.titleNotify){
				topic.publish("/rcbc/pin/titleChange", title);
			}
			
			return title;
		},
		
		_getTitleText: function(value){
			var title = this._getField(value, "title");
			
			if(this._isBlank(title)){
				var serviceTitle = this._getField(value, "serviceName");
				var orgTitle = this._getField(value, "orgName");
				
				if((serviceTitle === "") && (orgTitle !== "")){
					title = orgTitle;
				}else if((serviceTitle !== "") && (orgTitle !== "")){
					title = serviceTitle + " ("+orgTitle+")";
				}else if(serviceTitle !== ""){
					title = serviceTitle;
				}
			}
			
			return title;
		},
		
		_createDescription: function(value){
			this._createAttachPoint("descriptionNode", "div");
			domConstr.empty(this.descriptionNode);
			
			var description = this._getField(value, "description");
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
		
		_createKeyFeatures: function(value){
			this._createAttachPoint("keyFeaturesNode", "div");
			domConstr.empty(this.keyFeaturesNode);
			
			var subTitleLevel = this.titleLevel + 1;
			var ol = this._createFeaturesOl(value);
			if(!this._isBlank(ol)){
				domConstr.create("h"+subTitleLevel.toString(), {
					"innerHTML": "Key Features:"
				}, this.keyFeaturesNode);
				domConstr.place(ol, this.keyFeaturesNode);
			}
			
			return this.keyFeaturesNode;
		},
		
		_createFeaturesOl: function(value){
			var ol = domConstr.create("ol");
			
			array.forEach([1,2,3,4,5,6], function(key){
				var feature = this._getField(value,"keyFeature"+key);
				if(!this._isBlank(feature)){
					domConstr.create("li", {
						"innerHTML": feature
					}, ol);
				}
			}, this);
			
			return ol;
		},
		
		_createContactsTable: function(value){
			this._getTableWidgetDom(value, {
				"propertyNode": "contactsWidget",
				"constructor": contactsTable,
				"field": "contacts",
				"title": strings.contactsTitle,
				"titleLevel": this.titleLevel+1
			});
			return this.contactsWidget.domNode;
		},
		
		_createVenues: function(value){
			this._createAttachPoint("venuesNode", "div");
			domConstr.empty(this.venuesNode);
			
			if(!this._isBlank(value.venues)){
				array.forEach(value.venues, function(venue){
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
				venue.application = this.application;
				venue.titleLevel = this.titleLevel+1;
				var venueWidget = new venueDisplayer(venue);
				venueDom = venueWidget.domNode;
			}
			
			return venueDom;
		},
		
		_createCostTable: function(value){
			this._getTableWidgetDom(value, {
				"propertyNode": "costsWidget",
				"constructor": costTable,
				"field": "costs",
				"title": strings.costDetails,
				"titleLevel": this.titleLevel+1
			});
			return this.costsWidget.domNode;
		},
		
		_createAccessTable: function(value){
			if(this._hasAccessDetails()){
				this._getTableWidgetDom(value, {
					"propertyNode": "accessWidget",
					"constructor": accessTable,
					"title": strings.accessDetails,
					"titleLevel": this.titleLevel+1
				});
				return this.accessWidget.domNode;
			}
			
			return domConstr.create("div");
		},
		
		_createServiceHoursTable: function(value){
			this._getTableWidgetDom(value, {
				"propertyNode": "serviceHoursWidget",
				"constructor": serviceHoursTable,
				"field": "servicePeriods",
				"title": strings.serviceHours,
				"titleLevel": this.titleLevel+1
			});
			return this.serviceHoursWidget.domNode;
		},
		
		_getPostcodes: function(venues){
			var postcodes = new Array();
			
			array.forEach(venues, function(venue){
				var postcode = this._getPostcode(venue.venueId);
				if(!this._isBlank(postcode)){
					postcodes.push(postcode);
				}
				//console.log(postcode, venue.venueId);
			}, this);
			
			return postcodes;
		},
		
		_createMap: function(value){
			var postcodes = this._getPostcodes(value.venues);
			
			if(!this._isBlank(postcodes)){
				if(!this._isWidget(this.mapNode)){
					this._createAttachPoint(
						"mapNode",
						googleMap, {
							"callback": lang.hitch(
								this,
								this._plotOnMap,
								postcodes
							)
						}
					);
				}else{
					this._plotOnMap(postcodes);
				}
			}else{
				if(this._isWidget(this.mapNode)){
					domConstr.place(this.mapNode.domNode, this.hiddenNode);
				}
			}
		},
		
		_plotOnMap: function(postcodes){
			this.mapNode.clear();
			domConstr.place(this.mapNode.domNode, this.domNode, "last");
			array.forEach(postcodes, function(postcode){
				this.mapNode.plot(postcode);
			}, this);
			this.mapNode.centre(postcodes[0]);
		},
		
		_getPostcode: function(venueId){
			var lookup = this.application.store.get(venueId.toLowerCase());
			if(lookup !== undefined){
				var postcode = lookup.data.postcode;
				if(!this._isBlank(postcode)){
					return postcode;
				}
			}
			
			return null;
		},
		
		_getField: function(data, fieldName){
			if(fieldName == undefined){
				fieldName = data;
				data = this.value;
			}
			
			var value = ""
			if(this._hasProperty(data, fieldName)){
				value = data[fieldName];
			}
			
			return lang.trim(value);
		},
		
		_getTableWidgetDom: function(value, args){
			args = this._getTableWidgetSetDataArgument(value, args);
			
			var node;
			if(this._hasProperty(args, "data")){
				var obj = {
					"data": args.data,
					"title": args.title
				};
				if(this._hasProperty(args, "titleLevel")){
					obj.titleLevel = args.titleLevel;
				}
				
				if(this._hasProperty(args, "propertyNode")){
					this._createAttachPoint(
						args.propertyNode,
						args.constructor, obj
					);
					node = this[args.propertyNode].domNode;
				}else{
					var widget = new args.constructor(obj);
					node = widget.domNode;
				}
			}
			
			if(node === undefined){
				if(this._hasProperty(args, "propertyNode")){
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
		
		_getTableWidgetSetDataArgument: function(value, args){
			if(this._hasProperty(args, "field")){
				args.data = value[args.field];
			}else{
				args.data = value;	
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
			
			if(this._isBlank(this.value.accessDetails)){
				return true;
			}
			return false;
		},
		
		_hasAccessCheck: function(enableField, contentField){
			if(this._isTrue(this.value[enableField])){
				if(this._isBlank(this.value[contentField])){
					return true;
				}
			}
			
			return false;
		},
		
		_hasAccessCheckAge: function(){
			if(this._isTrue(this.value.ageTarget)){
				if((this._isBlank(this.value.age1)) || (this._isBlank(this.value.age2))){
					return true;
				}
				if((this._isBlank(this.value.age1Months)) || (this._isBlank(this.value.age2Months))){
					return true;
				}
			}
			
			return false;
		}
	});
	
	return construct;
});