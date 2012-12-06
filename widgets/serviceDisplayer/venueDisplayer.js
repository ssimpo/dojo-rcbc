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
	"dojo/i18n!./nls/venueDisplayer",
	"dojo/text!./views/venueDisplayer.html",
	"dojo/dom-construct",
	"dojo/_base/lang"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template,
	domConstr, lang
) {
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"description": "",
		"venueId": "",
		"data": null,
		
		"_mainDiv": {},
		
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._getData();
			this._addDescription();
			this._mainDiv = this.domNode;
			
			this._addTitle();
			this._addAddress();
		},
		
		_addDescription: function(){
			this.description = lang.trim(this.description);
			if(this.description != ""){
				this.description = lang.trim(this.data.name);
			}
		},
		
		_getData: function(){
			if(this.venueId !== ""){
				if(this.hasOwnProperty(this.venueId)){
					this.data = this[this.venueId];
				}
			}
		},
		
		_addTitle: function(){
			if(this.description != ""){
				var div = domConstr.create("div", {}, this._mainDiv);
				var h3 = domConstr.create("h3", {
					"innerHTML": this.description
				}, div);
				var indent = domConstr.create("div", {
					"class": "indent"
				}, div);
				this._mainDiv = div;
			}
		},
		
		_addAddress: function(){
			var html = "";
			if(this.data.name != ""){
				html += "<b>"+this.data.name+"</b><br />";
			}
			if((this.data.house_no_name != "") && (this.data.house_no_name != this.data.name)){
				if(this.data.house_no_name.length < 8){
					html += lang.trim(this.data.house_no_name + " " + this.data.street) + "<br />";
				}else{
					if(this.data.name == ""){
						html += "<b>"+this.data.house_no_name + "</b><br />";
					}else{
						html += this.data.house_no_name + "<br />";
					}
					if(this.data.street == ""){
						html += this.data.street + "<br />";
					}
				}
			}else{
				if(this.data.street == ""){
					html += this.data.street + "<br />";
				}
			}
			if(this.data.area != ""){
				html += this.data.area + "<br />";
			}
			if(this.data.town != ""){
				html += this.data.town + "<br />";
			}
			if(this.data.postcode != ""){
				html += this.data.postcode + "<br />";
			}
			
			domConstr.create("div", {
				"innerHTML": html
			}, this._mainDiv);
		}
		
	});
	
	return construct;
});