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
	"dojo/i18n!./nls/searchWidget",
	"dojo/text!./views/searchWidget.html",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/hash",
	"dojo/io-query",
	"simpo/typeTest",
	
	"dijit/form/TextBox",
	"dijit/form/Button"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template, 
	on, lang, hash, ioQuery, typeTest
) {
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"section": "",
		"value": "",
		
		postCreate: function(){
			this._init();
		},
		
		clear: function(){
			this.searchInput.set("value", "");
			this.searchInput.set("value", "");
		},
		
		_init: function(){
			on(this.searchButton, "click", lang.hitch(this, this._searchClicked));
			on(this.searchInput, "keyup", lang.hitch(this, this._searchTyping));
			on(this.domNode, "submit", lang.hitch(this, this._searchClicked));
		},
		
		_setSectionAttr: function(section){
			if(typeTest.isEqual(section, "Adult Services")){
				this.searchInput.set(
					"placeHolder",
					strings.searchInputAdultsPlaceHolder
				);
			}else if(typeTest.isEqual(section, "Family Services")){
				this.searchInput.set(
					"placeHolder",
					strings.searchInputFamiliesPlaceHolder
				);
			}else{
				this.searchInput.set(
					"placeHolder",
					strings.searchInputPlaceHolder
				);
			}
		},
		
		_searchTyping: function(evt){
			var search = this.searchInput.get("value");
			this.set("value", search);
			var temp = setTimeout(
				lang.hitch(
					this.application,
					this.application._displaySearch,
					search
				),
				50
			)
		},
		
		_searchClicked: function(evt){
			evt.preventDefault();
		}
	});
	
	return construct;
});