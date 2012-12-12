// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"./_variableTestMixin",
	"simpo/store/local",
	"dojo/aspect",
	"dojo/_base/lang",
	"dojo/has",
	"dojo/on",
	"dojo/_base/array",
	"dojo/request"
], function(
	declare, _variableTestMixin, store, aspect, lang, has, on, array, request
){
	"use strict";
	
	var construct = declare([_variableTestMixin, store], {
		"id": "rcbcPIN",
		"sessionOnly": false,
		"compress": true,
		"encrypt": false,
		
		
		constructor: function(args){
			aspect.around(this, "get", lang.hitch(this, this._localGet));
			this._updateStubs();
		},
		
		_updateStubs: function(){
			request(
				"/servicesStub.json", {
					"handleAs": "json",
					"preventCache": true
				}
			).then(
				lang.hitch(this, this._updateStubsSuccess),
				function(e){
					console.error(e);
				}
			);
		},
		
		_updateStubsSuccess: function(data){
			array.forEach(data.services, function(service, n){
				if(service.hasOwnProperty("id")){
					data.services[n].id = data.services[n].id.toLowerCase();
					data.services[n].category1 = this._parseCategory(service, 1);
					data.services[n].category2 = this._parseCategory(service, 2);
					
					this.put({
						"id": data.services[n].id,
						"type": "service",
						"data": data.services[n],
						"isStub": true
					});
				}
			}, this);
		},
		
		getCategory: function(section, category){
			var self = this;
			
			return this.query(function(object){
				var found = false;
				
				if(object.hasOwnProperty("type") && object.hasOwnProperty("data")){
					if(self._isEqual(object.type, "service")){
						var fieldName = "category" + section.toString();
						
						array.every(object.data[fieldName], function(cCat){
							if(self._isEqual(cCat,category)){
								found = true;
								return false;
							}
							return true;
						});
					}
				}
				
				return found;
			});
		},
		
		_parseCategory: function(service, categoryNum){
			var fieldName = "category" + categoryNum.toString();
			if(service.hasOwnProperty(fieldName)){
				if(!this._isArray(service[fieldName])){
					if(this._isBlank(service[fieldName])){
						return new Array();
					}else{
						return new Array(service[fieldName]);
					}
				}else{
					return service[fieldName];
				}
			}
			
			return new Array();
		},
		
		_localGet: function(orginalGet){
			orginalGet = lang.hitch(this, orginalGet);
			
			return function(id){
				var result = orginalGet(id);
				return result;
			};
		}
	});
	
	return construct;
});