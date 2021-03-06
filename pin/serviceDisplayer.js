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
	"dojo/_base/lang",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dojo/_base/array",
	"dijit/form/Button",
	"dojo/topic",
	"simpo/typeTest",
	"./serviceDisplayer/contactsTable",
	"./serviceDisplayer/venuesDisplayer",
	"./serviceDisplayer/costTable",
	"./serviceDisplayer/accessTable",
	"./serviceDisplayer/serviceHoursTable",
	"./serviceDisplayer/activityTimesTable",
	"./serviceDisplayer/kiteMarks",
	"./serviceDisplayer/downloads",
	"simpo/maps/google/canvas"
], function(
	declare,
	_widget, _templated, _wTemplate,
	i18n, strings, template,
	lang, domConstr, domAttr, array, Button, topic, typeTest,
	
	contactsTable, venuesDisplayer, costTable, accessTable, serviceHoursTable,
	activityTimesTable, kiteMarks, Downloads, googleMap
){
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate],{
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
		"kiteMarksNode": null,
		"downloadsNode": null,
		"mapNode": null,
		"accessTableWidget": null,
		
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
			"kiteMarks": true,
			"downloads": true,
			"contacts": true,
			"costs": true,
			"venues": true,
			"serviceHours": true,
			"accessDetails": true,
			"map": true,
			"activityTimes": true
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
			
			if(typeTest.isBlank(this.value)){
				this._hideWidget();
			}else{
				this._clear();
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
			this._ifHasClear("kiteMarksNode");
			this._ifHasClear("downloadsNode");
			this._ifHasClear("accessTableWidget");
			this._ifHasClear("contactsWidget");
			this._ifHasClear("costsWidget");
			this._ifHasClear("accessWidget");
			this._ifHasClear("serviceHoursWidget");
			this._ifHasClear("venuesNode");
			//this._ifHasClear("mapNode");
		},
		
		_ifHasClear: function(nodeName, destroy){
			destroy = ((destroy === undefined) ? false: destroy);
			if(typeTest.isElement(this[nodeName]) || typeTest.isWidget(this[nodeName])){
				if(destroy){
					if(typeTest.isElement(this[nodeName])){
						domConstr.destroy(this[nodeName]);
					}else{
						this[nodeName].destroy();
					}
					this[nodeName] = null;
				}else{
					if(typeTest.isElement(this[nodeName])){
						domConstr.empty(this[nodeName]);
					}else{
						domConstr.empty(this[nodeName].domNode);
					}
				}
			}
		},
		
		_createAttachPoint: function(propName, tagName, constructor){
			constructor = ((constructor == undefined) ? {} : constructor);
			
			if(!typeTest.isElement(this[propName]) && !typeTest.isWidget(this[propName])){
				if(Object.prototype.toString.call(tagName) === '[object String]'){
					this[propName] = domConstr.create(
						tagName, constructor, this.domNode
					);
				}else{
					this[propName] = new tagName(constructor);
					if(typeTest.isWidget(this[propName])){
						domConstr.place(this[propName].domNode, this.domNode);
					}
				}
			}else if((typeTest.isWidget(this[propName])) && (Object.prototype.toString.call(tagName) !== '[object String]')){
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
			this._createSection(this.show.kiteMarks, "_createKiteMarks", value);
			this._createSection(this.show.kiteMarks, "_createDownloads", value);
			this._createSection(this.show.contacts, "_createContactsTable", value);
			this._createSection(this.show.activityTimes, "_createActivityTimesTable", value);
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
				if(!typeTest.isBlank(id)){
					title = "<a href=\"#id="+id+"\">"+title+"</a>";
				}
			}
			
			if(this.show.title && !typeTest.isBlank(title)){
				domAttr.set(this.titleNode, "innerHTML", title);
			}
			
			if(this.titleNotify){
				topic.publish("/rcbc/pin/titleChange", title);
			}
			
			return title;
		},
		
		_getTitleText: function(value){
			var title = this._getField(value, "title");
			
			if(typeTest.isBlank(title)){
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
			
			var accreditation = this._getField(value, "accreditation");
			if(!typeTest.isBlank(accreditation)){
				if(typeTest.isArray(accreditation)){
					accreditation = accreditation.join(", ");
				}
				
				domConstr.create("p", {
					"innerHTML": "<b>Accreditation:</b> " + accreditation + "."
				}, this.descriptionNode);
			}
			
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
			if(!typeTest.isBlank(ol)){
				domConstr.create("h"+subTitleLevel.toString(), {
					"innerHTML": "Key Features:"
				}, this.keyFeaturesNode);
				domConstr.place(ol, this.keyFeaturesNode);
			}
			
			return this.keyFeaturesNode;
		},
		
		_createKiteMarks: function(value){
			if(typeTest.isProperty(value, "kiteMarks")){
				if(!typeTest.isBlank(value.kiteMarks)){
					this._createAttachPoint("kiteMarksNode", kiteMarks);
					this.kiteMarksNode.set("data", value.kiteMarks);
				}
			}
		},
		
		_createDownloads: function(value){
			if(typeTest.isProperty(value, "downloads")){
				if(!typeTest.isBlank(value.downloads)){
					this._createAttachPoint("downloadsNode", Downloads);
					this.downloadsNode.set("data", value.downloads);
				}
			}
		},
		
		_createFeaturesOl: function(value){
			var ol = domConstr.create("ol");
			
			array.forEach([1,2,3,4,5,6], function(key){
				var feature = this._getField(value,"keyFeature"+key);
				if(!typeTest.isBlank(feature)){
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
			this._createAttachPoint("venuesNode", venuesDisplayer, {
				"application": this.application,
				"titleLevel": this.titleLevel+1,
				"value": value.venues,
				"show": this.show
			});
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
			if(this._hasAccessDetails(value)){
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
		
		_createActivityTimesTable: function(value){
			if(!typeTest.isBlank(value.days)){
				this._getTableWidgetDom(value, {
					"propertyNode": "accessTableWidget",
					"constructor": activityTimesTable,
					"title": "Activity Times",
					"titleLevel": this.titleLevel+1
				});
				return this.accessTableWidget.domNode;
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
		
		_getField: function(data, fieldName){
			if(fieldName == undefined){
				fieldName = data;
				data = this.value;
			}
			
			var value = ""
			if(typeTest.isProperty(data, fieldName)){
				value = data[fieldName];
			}
			
			if(typeTest.isString(value)){
				return lang.trim(value);
			}
			
			return value;
		},
		
		_getTableWidgetDom: function(value, args){
			args = this._getTableWidgetSetDataArgument(value, args);
			
			var node;
			if(typeTest.isProperty(args, "data")){
				var obj = {
					"data": args.data,
					"title": args.title
				};
				if(typeTest.isProperty(args, "titleLevel")){
					obj.titleLevel = args.titleLevel;
				}
				
				if(typeTest.isProperty(args, "propertyNode")){
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
				if(typeTest.isProperty(args, "propertyNode")){
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
			if(typeTest.isProperty(args, "field")){
				args.data = value[args.field];
			}else{
				args.data = value;	
			}
			
			return args;
		},
		
		_hasAccessDetails: function(value){
			for(var i = 0; i < this._accessTesters.length; i++){
				if(this._hasAccessCheck(
					this._accessTesters[i][0],
					this._accessTesters[i][1],
					value
				)){
					return true;
				}
			}
			
			if(this._hasAccessCheckAge(value)){
				return true;
			}
			
			if(!typeTest.isBlank(value.accessDetails)){
				return true;
			}
			
			if(!typeTest.isBlank(value.servicePeriodsOld)){
				return true;
			}
			
			return false;
		},
		
		_hasAccessCheck: function(enableField, contentField, value){
			if(typeTest.isProperty(value, enableField) && typeTest.isProperty(value, contentField)){
				if(typeTest.isTrue(value[enableField])){
					if(!typeTest.isBlank(value[contentField])){
						return true;
					}
				}
			}
			
			return false;
		},
		
		_hasAccessCheckAge: function(value){
			if(typeTest.isTrue(value.ageTarget)){
				if((!typeTest.isBlank(value.age1)) || (!typeTest.isBlank(value.age2))){
					return true;
				}
				if((!typeTest.isBlank(value.age1Months)) || (!typeTest.isBlank(value.age2Months))){
					return true;
				}
			}
			
			return false;
		}
	});
	
	return construct;
});