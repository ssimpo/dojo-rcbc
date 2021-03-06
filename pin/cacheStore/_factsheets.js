// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/topic"
], function(
	declare, array, lang, topic
) {
	"use strict";
	
	var construct = declare(null, {
		"_factsheetCache": [],
		
		constructor: function(){
			this.addIntervalCheck(function(){
				if(!this._isBlank(this._factsheetCache)){
					this.addIntervalCommand(
						lang.hitch(this, this._updateFromFactsheetCache)
					);
				}
			});
		},
		
		_updateFromFactsheetCache: function(){
		}
	});
	
	return construct;
});