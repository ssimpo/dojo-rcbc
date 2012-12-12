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
		
		"value": {},
		
		"titleNode": null,
		"keyFeaturesNode": null,
		"descriptionNode": null,
		"contactsWidget": null,
		"costsWidget": null,
		"accessWidget": null,
		"serviceHoursWidget": null,
		"venuesNode": null,
		
		"_accessTesters": [
			["appointmentOnly", "appointmentOnlyDetails"],
			["dropIn", "dropInDetails"],
			["genderTarget", "genderTargetType"],
			["geographicRestriction", "geographicCoverage"],
			["referralOnly", "referralOnlyDetails"]
		],
		
		_setValueAttr: function(value){
			this.value = value;
			if(this._isBlank(this.value)){
				this._clear();
			}else{
				this._createContent(value);
			}
		},
		
		clear: function(){
			this.set("value",{});
		},
		
		_clear: function(){
			this._ifHasClear("titleNode", true);
			this._ifHasClear("descriptionNode");
			this._ifHasClear("keyFeaturesNode");
			this._ifHasClear("contactsWidget");
			this._ifHasClear("costsWidget");
			this._ifHasClear("accessWidget");
			this._ifHasClear("serviceHoursWidget");
			this._ifHasClear("venuesNode");
		},
		
		_ifHasClear: function(nodeName, destroy){
			destroy = ((destroy === undefined) ? false: destroy);
			if(this._isElement(this[nodeName]) || this._isWidget(this[nodeName])){
				if(destroy){
					domConstr.destroy(this[nodeName]);
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
			this._createTitle(value);
			this._createDescription(value);
			this._createKeyFeatures(value);
			this._createContactsTable(value);
			this._createVenues(value);
			this._createCostTable(value);
			this._createAccessTable(value);
			this._createServiceHoursTable(value);
		},
		
		_createTitle: function(value){
			this._createAttachPoint("titleNode", "h1");
			domConstr.place(this.titleNode, this.domNode, "first");
			domConstr.empty(this.titleNode);
			
			var title = this._getTitle(value);
			title = ((title === "") ? "&nbsp;": title);
			domAttr.set(this.titleNode, "innerHTML", title);
			
			return this.titleNode;
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
			
			var ol = this._createFeaturesOl(value);
			if(!this._isBlank(ol)){
				domConstr.create("h2", {
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
				"title": strings.contactsTitle
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
				"title": strings.costDetails
			});
			return this.costsWidget.domNode;
		},
		
		_createAccessTable: function(value){
			if(this._hasAccessDetails()){
				this._getTableWidgetDom(value, {
					"propertyNode": "accessWidget",
					"constructor": accessTable,
					"title": strings.accessDetails
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
				"title": strings.serviceHours
			});
			return this.serviceHoursWidget.domNode;
		},
		
		_getTitle: function(value){
			var title = "";
			var serviceTitle = this._getField(value, "serviceName");
			var orgTitle = this._getField(value, "orgName");
			
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
		
		_getField: function(data, fieldName){
			if(fieldName == undefined){
				fieldName = data;
				data = this.value;
			}
			
			var value = ""
			
			if(data.hasOwnProperty(fieldName)){
				value = data[fieldName];
			}
			
			return lang.trim(value);
		},
		
		_getTableWidgetDom: function(value, args){
			args = this._getTableWidgetSetDataArgument(value, args);
			
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
		
		_getTableWidgetSetDataArgument: function(value, args){
			if(args.hasOwnProperty("field")){
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