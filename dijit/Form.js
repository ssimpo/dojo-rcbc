define([
	"dojo/_base/declare",
	"dojo/i18n",
	"dojo/i18n!./nls/Form",
	"dijit/form/Form",
	"dijit/registry",
	"dojo/on",
	"dojo/ready",
	"dojo/_base/lang",
	"simpo/store/local",
	"lib/md5",
	"dojo/io-query",
	"simpo/typeTest",
	"simpo/xhrManager",
	"dojo/_base/array",
	"dojo/query"
], function(
	declare, i18n, strings, Form, registry, on, ready, lang, memory, md5,
	ioQuery, typeTest, xhrManager, array, $
){
	"use strict";
	
	var construct = declare([Form], {
		"i18n": strings,
		"store": false,
		"compress": true,
		"encrypt": true,
		"sessionOnly": true,
		"useStore": false,
		
		_serverDataMapper1: [
			["appointmentOnly", "appointmentOnly", "appointmentOnlyDetails"],
			["dropIn", "dropIn", "dropInDetails"],
			["genderTarget", "genderTarget", "genderTargetType"],
			["geographicCoverage", "geographicRestriction", "geographicCoverage"],
			["referralOnly", "referralOnly", "referralOnlyDetails"],
			["ageTarget", "ageTarget", "ageTargetType"]
		],
		
		constructor: function(args){
			this._init(args);
			
			if(this._hasProperty(args, "id")){
				args.id = this._getStoreId(args);
				if(this.useStore){
					this.store = new memory({
						"compress": this.compress,
						"encrypt": this.encrypt,
						"sessionOnly": this.sessionOnly
					});
					//this.store.clear(true);
				}
			}
		},
		
		_init: function(args){
			if(this._isObject(args)){
				for(var key in args){
					this[key] = args[key];
				}
			}
		},
		
		_isObject: function(obj){
			return (Object.prototype.toString.call(obj) === '[object Object]');
		},
		
		_getStoreId: function(args){
			var id = location.pathname + location.search + '#' + args.id;
			return md5(id);
		},
		
		postCreate: function(){
			var query = this._getQuery();
			if(typeTest.isProperty(query, "id")){
				ready(lang.hitch(this, function(){
					this._getServiceData(query.id);
				}));
			}else if(this.store){
				ready(lang.hitch(this, function(){
					var qry = this.store.query({"id":"formData"});
					if(qry.length > 0){
						this.set("value", qry[0].formData);
					}
					
					if(this.useStore){
						registry.findWidgets(this.domNode).forEach(function(widget){
							on(widget, "focusout", lang.hitch(this, this._widgetUpdate));
						}, this);
					}
				}));
			}
		},
		
		_getServiceData: function(id){
			if(typeTest.isString(id)){
				if(id.length == 32){		
					xhrManager.add({
						"url": "/pin.nsf/getService2?openagent&stub=false",
						"method": "post",
						"data": {
							"id": id
						}
					}).then(
						lang.hitch(this, this._getServiceDataSuccess),
						lang.hitch(this, function(e){
							console.info("Failed to get service data", e);
						})
					);
				}
			}
		},
		
		_getVenueData: function(id){
			if(typeTest.isString(id)){
				if(id.length == 32){		
					xhrManager.add({
						"url": "/pin.nsf/getVenue?openagent",
						"method": "post",
						"data": {
							"id": id
						}
					}).then(
						lang.hitch(this, this._getVenueDataSuccess),
						lang.hitch(this, function(e){
							console.info("Failed to get service data", e);
						})
					);
				}
			}
		},
		
		_getServiceDataSuccess: function(data){
			if(!typeTest.isBlank(data)){
				if(typeTest.isProperty(data, "services")){
					if(data.services.length > 0){
						data = this._parseServerData(data.services[0])
						this.set("value", data);
					}
				}
			}
		},
		
		_getVenueDataSuccess: function(data){
			if(typeTest.isProperty(data, "venues")){
				if(typeTest.isArray(data.venues)){
					if(data.venues.length > 0){
						data = data.venues[0];
						
						var venueWidget = this._getWidget("venue");
						if(venueWidget !== undefined){
							var id = data.id.toLowerCase();
							var value = venueWidget.get("value");
							
							if(!typeTest.isProperty(value, id)){
								value[id] = data;
								venueWidget.set("value", value);
							}
						}
						
					}
				}
			}
		},
		
		_getWidget: function(id){
			var query = $("#"+id);
			if(query.length > 0){
				return registry.byNode(query[0]);
			}
			
			return undefined;
		},
		
		_parseServerData: function(data){
			array.forEach(
				["Access", "Venues", "Contacts", "servicePeriods"],
				function(parser){
					data = this["_parseService"+parser](data);
				},
				this
			);
			
			return data;
		},
		
		_parseServiceAccess: function(data){
			array.forEach(this._serverDataMapper1, function(tester){
				data[tester[0]] = this._getDetailsField(data, tester[1], tester[2]);
			}, this);
			
			return data;
		},
		
		_parseServiceVenues: function(data){
			if(typeTest.isProperty(data, "venues")){
				if(typeTest.isArray(data.venues)){
					array.forEach(data.venues, function(venue){
						this._getVenueData(venue.venueId.toLowerCase());
					}, this);
				}
			}
			
			return data;
		},
		
		_parseServiceContacts: function(data){
			if(typeTest.isProperty(data, "contacts")){
				if(typeTest.isArray(data.contacts)){
					var contactsWidget = this._getWidget("contacts");
					
					array.forEach(data.contacts, function(contact){
						if(contactsWidget !== undefined){
							var id = "";
							var value = contactsWidget.get("value");
							if(!typeTest.isProperty(contact, "id")){
								id = this._createUnid();
							}else{
								id = contact.id.toLowerCase();
							}
							
							if(!typeTest.isProperty(value, id)){
								value[id] = contact;
								contact.value = contact.details;
								contactsWidget.set("value", value);
							}
							
						}
					}, this);
					
				}
			}
			
			return data;
		},
		
		_parseServiceservicePeriods: function(data){
			if(typeTest.isProperty(data, "servicePeriods")){
				if(typeTest.isArray(data.servicePeriods)){
					var servicePeriodWidget = this._getWidget("hours");
					
					array.forEach(data.servicePeriods, function(servicePeriod){
						if(servicePeriodWidget !== undefined){
							var id = "";
							var value = servicePeriodWidget.get("value");
							if(!typeTest.isProperty(servicePeriod, "id")){
								id = this._createUnid();
							}else{
								id = servicePeriod.id.toLowerCase();
							}
							
							if(!typeTest.isProperty(value, id)){
								value[id] = servicePeriod;
								
								var hours1 = servicePeriod.hours1.split(":");
								servicePeriod.from = new Date(2013,0,1,hours1[0],hours1[1],hours1[2]);
								var hours2 = servicePeriod.hours2.split(":");
								servicePeriod.to = new Date(2013,0,1,hours2[0],hours2[1],hours2[2]);

								servicePeriodWidget.set("value", value);
							}
						}
					}, this);
				}
			}
			
			return data;
		},
		
		_createUnid: function(){
			var unid = "";
			for(var i = 1; i <= 32; i++){
				var no = Math.floor(Math.random()*15);
				unid += no.toString(15);
			}
			return unid.toLowerCase();
		},
		
		_getDetailsField: function(data, testField, detailField){
			if(typeTest.isProperty(data, testField)){
				if(typeTest.isProperty(data, detailField)){
					if (typeTest.isEqual(data[testField], "yes")){
						return data[detailField];
					}
				}
			}
			
			return false;
		},
		
		_getQuery: function(query){
			query = ((query === undefined) ? location.search : query);
			
			if(query !== undefined){
				query = query.toLowerCase().split(/[#\?]/g);
				query = (((query[0] === "") & (query.length > 1)) ? query[1] : query[0]);
				return ioQuery.queryToObject(query);
			}else{
				return new Object();
			}
		},
		
		_hasProperty: function(obj, propName){
			return Object.prototype.hasOwnProperty.call(obj, propName);
		},
		
		_widgetUpdate: function(event){
			if(this.store){
				if(this.useStore){
					this.store.put({"id":"formData", "formData":this.get("value")});
				}
			}
		}
	});
	
	return construct;
});