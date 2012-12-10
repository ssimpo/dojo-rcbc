// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"simpo/store/local",
	"dojo/aspect",
	"dojo/_base/lang"
], function(
	declare, store, aspect, lang
){
	"use strict";
	
	var construct = declare([store], {
		"id": "rcbcPIN",
		"sessionOnly": false,
		"compress": true,
		"encrypt": false,
		
		_attachAspects: function(){
			aspect.around(this, "put", lang.hitch(this, this._localPut));
			aspect.around(this, "add", lang.hitch(this, this._localPut));
			aspect.around(this, "remove", lang.hitch(this, this._localRemove));
			aspect.around(this, "get", lang.hitch(this, this._localGet));
		},
		
		_localGet: function(orginalGet){
			orginalGet = lang.hitch(this, orginalGet);
			
			return function(id){
				var result = orginalGet(id);
				console.log("GET", result);
				return result;
			};
		}
	});
	
	return construct;
});