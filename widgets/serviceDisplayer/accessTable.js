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
	"dojo/i18n!./nls/accessTable",
	"dojo/text!./views/accessTable.html",
	"dojo/dom-construct"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template,
	domConstr
) {
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"data": {},
		
		"_tableIsBlank": true,
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._addDetails();
			this._addReferrel();
			this._addAppointments();
			this._addDropIn();
			this._addAge();
			this._addOther();
			
			if(!this._tableIsBlank){
				this._writeLastRow();
			}
		},
		
		_addDetails: function(){
			if(this.data.accessDetails != ""){
				domConstr.create("p", {
					"innerHTML": this.data.accessDetails
				}, this.domNode, "first");
				this._tableIsBlank = false;
			}
		},
		
		_addReferrel: function(){
			if(this.data.referralOnly == "Yes"){
				var tr = domConstr.create("tr", {}, this.tableNode);
				domConstr.create("th", {
					"innerHTML": "By referral only:",
					"class": "r b p30"
				}, tr);
				domConstr.create("td", {
					"innerHTML": this.data.referralOnlyDetails,
					"class": "b"
				}, tr);
				this._tableIsBlank = false;
			}
		},
		
		_addAppointments: function(){
			if(this.data.appointmentOnly == "Yes"){
				var tr = domConstr.create("tr", {}, this.tableNode);
				domConstr.create("th", {
					"innerHTML": "By appointnent only:",
					"class": "r b p30"
				}, tr);
				domConstr.create("td", {
					"innerHTML": this.data.appointmentOnlyDetails,
					"class": "b"
				}, tr);
				this._tableIsBlank = false;
			}
		},
		
		_addDropIn: function(){
			if(this.data.dropIn == "Yes"){
				var tr = domConstr.create("tr", {}, this.tableNode);
				domConstr.create("th", {
					"innerHTML": "Dropin details:",
					"class": "r b p30"
				}, tr);
				domConstr.create("td", {
					"innerHTML": this.data.dropInDetails,
					"class": "b"
				}, tr);
				this._tableIsBlank = false;
			}
		},
		
		_addAge: function(){
			if((this.data.genderTarget == "Yes") || (this.data.geographicRestriction == "Yes")){
			}
		},
		
		_addOther: function(){
			if(this.ageTarget == "Yes"){
				var tr = domConstr.create("tr", {}, this.tableNode);
				domConstr.create("th", {
					"innerHTML": "Other access details:",
					"class": "r b p30"
				}, tr);
				
				if(this.data.ageTargetType == "Above"){
					var age = this._getAgeBlock(1);
					if(age == ""){
						var age = this._getAgeBlock(2);
					}
					if(age == ""){
						html += "above "+age;
					}
				}else if(this.data.ageTargetType == "Below"){
					var age = this._getAgeBlock(1);
					if(age == ""){
						var age = this._getAgeBlock(2);
					}
					if(age == ""){
						html += "below "+age;
					}
				}else if(this.data.ageTargetType == "Between"){
					html += "between "+this._getAgeBlock(1)+" - "+this._getAgeBlock(2);
				}
				
				domConstr.create("td", {
					"innerHTML": html,
					"class": "b"
				}, tr);
				this._tableIsBlank = false;
			}
		},
		
		_getAgeBlock: function(no){
			var age = this.data["age"+no.toString()];
			var months = this.data["age"+no.toString()+"Months"];
			
			if((age !="") && (months != "")){
				return age+"yrs "+months+"mths";
			}else if(age !=""){
				return age+"yrs";
			}else if(months !=""){
				return months+"mths";
			}
			
			return "";
		},
		
		_writeLastRow: function(){
			var tr = domConstr.create("tr", {}, this.tableNode);
			domConstr.create("td", {
				"innerHTML": "&nbsp;",
				"class": "r"
			}, tr);
			domConstr.create("td", {
				"innerHTML": "&nbsp;",
			}, tr);
		},
	});
	
	return construct;
});