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
	"dojo/dom-construct",
	"dojo/_base/lang"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template,
	domConstr, lang
){
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
		
		"_trueValues": ["yes", "true", "on", "checked", "ticked", "1"],
		"_falseValues": ["no", "false", "off", "unchecked", "unticked", "0"],
		
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
			if(!this._isBlank(this.data.accessDetails)){
				domConstr.create("p", {
					"innerHTML": this.data.accessDetails
				}, this.domNode, "first");
				this._tableIsBlank = false;
			}
		},
		
		_addRow: function(title, test, details){
			if((details === undefined) && (test !== undefined)){
				details = test;
				test = true;
			}
			
			if(this._isTrue(test) && !this._isBlank(details)){
				var tr = domConstr.create("tr", {}, this.tableNode);
				domConstr.create("th", {
					"innerHTML": title,
					"class": "r b p30"
				}, tr);
				domConstr.create("td", {
					"innerHTML": details,
					"class": "b"
				}, tr);
				this._tableIsBlank = false;
			}
		},
		
		_addReferrel: function(){
			this._addRow(
				strings.referrelOnly + ":",
				this.data.referralOnly,
				this.data.referralOnlyDetails
			);
		},
		
		_addAppointments: function(){
			this._addRow(
				strings.appointmentOnly + ":",
				this.data.appointmentOnly,
				this.data.appointmentOnlyDetails
			);
		},
		
		_addDropIn: function(){
			this._addRow(
				strings.dropinDetails + ":",
				this.data.dropIn,
				this.data.dropInDetails
			);
		},
		
		_addAge: function(){
			var html = "";
			if(this._isEqual(this.data.ageTargetType, "Above")){
				var age = this._getAgeBlock(1);
				if(this._isBlank(age)){
					age = this._getAgeBlock(2);
				}
				if(!this._isBlank(age)){
					html += strings.above + " "+age;
				}
			}else if(this._isEqual(this.data.ageTargetType, "Below")){
				var age = this._getAgeBlock(1);
				if(this._isBlank(age)){
					age = this._getAgeBlock(2);
				}
				if(!this._isBlank(age)){
					html += strings.below + " " + age;
				}
			}else if(this._isEqual(this.data.ageTargetType, "Between")){
				html += strings.between + " " + this._getAgeBlock(1)+" - "+this._getAgeBlock(2);
			}
				
			this._addRow(
				strings.ageTarget+":",
				this.data.ageTarget,
				html
			);
		},
		
		_addOther: function(){
			var html = "";
			if(this._isTrue(this.data.genderTarget) || this._isTrue(this.data.geographicRestriction)){
				if(this._isTrue(this.data.genderTarget) && this._isEqual(this.data.genderTargetType, "Male")){
					html += strings.restrictedToMen + ".  "
				}else if(this._isTrue(this.data.genderTarget) && this._isEqual(this.data.genderTargetType, "Female")){
					html += strings.restrictedToWomen + ".  "
				}
			}
			
			if(this._isTrue(this.data.geographicRestriction) && !this._isBlank(this.data.geographicCoverage)){
				if(Object.prototype.toString.call(this.data.geographicCoverage) === '[object Array]'){
					html += strings.restrictedToAreas + ": " + this._combineListAsText(this.data.geographicCoverage) + ".  ";
				}
			}
			
			this._addRow(strings.otherRestrictions+":", html);
		},
		
		_combineListAsText: function(list, joiner, lastJoiner){
			var text = "";
			
			if(Object.prototype.toString.call(list) === '[object Array]'){
				if(list.length > 0){
					lastJoiner = ((lastJoiner === undefined) ? strings.and : lastJoiner);
					joiner = ((joiner === undefined) ? ", " : joiner);
					
					for(var i = 0; i < list.length; i++){
						if(i == 0){
							text += list[i];
						}else if(i == (list.length - 1)){
							text += lastJoiner + list[i];
						}else{
							text += joiner + list[i];
						}
					}
				}
			}
			
			return text;
		},
		
		_getAgeBlock: function(no){
			var age = this.data["age"+no.toString()];
			var months = this.data["age"+no.toString()+"Months"];
			
			if((!this._isBlank(age)) && (!this._isBlank(months))){
				return age + strings.yrs + " " + months + strings.mths;
			}else if(!this._isBlank(age)){
				return age + strings.yrs;
			}else if(!this._isBlank(months)){
				return months + strings.mths;
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
		
		_isTrue: function(value){
			if(value === true){
				return true;
			}
			if(value === 1){
				return true;
			}
			
			try{
				var stringValue = value.toString();
				for(var i = 0; i < this._trueValues.length; i++){
					if(this._isEqual(stringValue, this._trueValues[i])){
						return true;
					}
				}
			}catch(e){
				return false;
			}
			
			return false;
		},
		
		_isFalse: function(value){
			if(value === false){
				return true;
			}
			if(value === 0){
				return true;
			}
			if(this._isBlank(value)){
				return true;
			}
			try{
				var stringValue = value.toString();
				for(var i = 0; i < this._falseValues.length; i++){
					if(this._isEqual(stringValue, this._falseValues[i])){
						return true;
					}
				}
			}catch(e){
				return false;
			}
			
			return false;
		},
		
		_isEqual: function(value1, value2){
			if(value1 === value2){
				return true;
			}else if((Object.prototype.toString.call(value1) === '[object String]') && (Object.prototype.toString.call(value2) === '[object String]')){
				return (lang.trim(value1.toLowerCase()) == lang.trim(value2.toLowerCase()));
			}else if(this._isBlank(value1) && this._isBlank(value2)){
				return true;
			}
			
			return false;
		},
		
		_isBlank: function(value){
			if((value === null) || (value === undefined) || (value === "") || (value === false)){
				return true;
			}
			
			if(Object.prototype.toString.call(value) === '[object String]'){
				if(lang.trim(value) === ""){
					return true;
				}
			}else if(Object.prototype.toString.call(value) === '[object Object]'){
				for(var key in map){
					if(map.hasOwnProperty(key)){
						return false;
					}
				}
				return true;
			}else if(Object.prototype.toString.call(value) === '[object Array]'){
				if(value.length == 0){
					return true;
				}
			}
			
			return false;
		}
	});
	
	return construct;
});