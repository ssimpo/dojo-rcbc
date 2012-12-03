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
	"dojo/i18n!./nls/contactsTable",
	"dojo/text!./views/contactsTable.html",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dojo/_base/lang",
	"require"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template,
	array, domConstr, lang, require
) {
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"data": [],
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._processContacts();
		},
		
		_processContacts: function(){
			array.forEach(this.data, function(contact, n){
				var tr = domConstr.create("tr", {}, this.domNode);
				this._processContact(contact, tr);
			}, this);
		},
		
		_processContact: function(contact, tr){
			var type = lang.trim(contact.type);
			if(type !== ""){
				var dojoId = "./contactsTable/"+this._camelize(type);
				require([dojoId], lang.hitch(this, function(construct){
					var rowWidget = new construct(contact);
					domConstr.place(rowWidget.domNode, tr, "replace");
				}));
			}
		},
		
		_camelize: function(str){
			return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
				if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
				return index == 0 ? match.toLowerCase() : match.toUpperCase();
			});
		}
	});
	
	return construct;
});