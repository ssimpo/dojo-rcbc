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
	"./_tableMixin",
	"dojo/i18n",
	"dojo/i18n!./nls/accessTable",
	"dojo/text!./views/accessTable.html",
	"dojo/dom-construct",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-attr",
	"simpo/typeTest"
], function(
	declare, _widget, _templated, _wTemplate, _tableMixin, i18n, strings,
	template, domConstr, lang, array, domAttr, typeTest
){
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate, _tableMixin], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"data": {},
		"title": "",
		"columnWidths": [30],
		"titleLevel": 2,
		
		_fixTitleLevel: function(){
			if(!typeTest.isEqual(this.titleDom.tagName, "h"+this.titleLevel.toString())){
				this.titleDom = domConstr.create(
					"h"+this.titleLevel.toString(),
					{"innerHTML": domAttr.get(this.titleDom, "innerHTML")},
					this.titleDom,
					"replace"
				);
			}
		},
		
		_setDataAttr: function(data){
			this.data = data;
			this._init();
		},
		
		_setTitleAttr: function(title){
			this.title = title;
			this._addTitle();
			this._showTitleNode();
		},
		
		_init: function(){
			this._fixTitleLevel();
			domConstr.empty(this.tableNode);
			domConstr.empty(this.detailsNode);
			
			if(!typeTest.isBlank(this.data)){
				this._addRows();
			}
			if(!this._tableIsEmpty()){
				this._showTable();
				this._writeLastRow();
			}else{
				this._hideTable();
			}
		},
		
		_addRows: function(){
			this._addDetails();
			this._addReferrel();
			this._addAppointments();
			this._addDropIn();
			this._addAge();
			this._addOther();
			this._addOldServiceHours();
		},
		
		_addDetails: function(){
			if(!typeTest.isBlank(this.data.accessDetails)){
				domAttr.set(
					this.detailsNode,
					"innerHTML",
					this.data.accessDetails
				)
			}
		},
		
		_addOldServiceHours: function(){
			if(!typeTest.isBlank(this.data.servicePeriodsOld)){
				this._addRow(
					strings.servicePeriodsOld + ":",
					this.data.servicePeriodsOld
				);
			}
		},
		
		_addRow: function(title, test, details){
			if((details === undefined) && (test !== undefined)){
				details = test;
				test = true;
			}
			
			if(typeTest.isTrue(test) && !typeTest.isBlank(details)){
				domConstr.place(
					this._createTr([title, details]),
					this.tableNode
				);
			}
		},
		
		_writeLastRow: function(){
			domConstr.place(this._createLastTr(2), this.tableNode);
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
			if(typeTest.isEqual(this.data.ageTargetType, "Above")){
				var age = this._getAgeBlock(1);
				if(typeTest.isBlank(age)){
					age = this._getAgeBlock(2);
				}
				if(!typeTest.isBlank(age)){
					html += strings.above + " "+age;
				}
			}else if(typeTest.isEqual(this.data.ageTargetType, "Below")){
				var age = this._getAgeBlock(1);
				if(typeTest.isBlank(age)){
					age = this._getAgeBlock(2);
				}
				if(!typeTest.isBlank(age)){
					html += strings.below + " " + age;
				}
			}else if(typeTest.isEqual(this.data.ageTargetType, "Between")){
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
			if(typeTest.isTrue(this.data.genderTarget) || typeTest.isTrue(this.data.geographicRestriction)){
				if(typeTest.isTrue(this.data.genderTarget) && typeTest.isEqual(this.data.genderTargetType, "Male")){
					html += strings.restrictedToMen + ".  "
				}else if(typeTest.isTrue(this.data.genderTarget) && typeTest.isEqual(this.data.genderTargetType, "Female")){
					html += strings.restrictedToWomen + ".  "
				}
			}
			
			if(typeTest.isTrue(this.data.geographicRestriction) && !typeTest.isBlank(this.data.geographicCoverage)){
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
			
			if((!typeTest.isBlank(age)) && (!typeTest.isBlank(months))){
				return age + strings.yrs + " " + months + strings.mths;
			}else if(!typeTest.isBlank(age)){
				return age + strings.yrs;
			}else if(!typeTest.isBlank(months)){
				return months + strings.mths;
			}
			
			return "";
		}
	});
	
	return construct;
});