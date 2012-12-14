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
	"dojo/i18n!./nls/contactsTable",
	"dojo/text!./views/contactsTable.html",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dojo/_base/lang",
	"require"
], function(
	declare,
	_widget, _templated, _wTemplate, _tableMixin,
	i18n, strings, template,
	array, domConstr, domAttr, lang, require
){
	"use strict";
	
	var construct = declare([
		_widget, _templated, _wTemplate, _tableMixin
	], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"data": [],
		"title": "",
		"columnWidths": [30],
		"titleLevel": 2,
		
		_fixTitleLevel: function(){
			if(!this._isEqual(this.titleDom.tagName, "h"+this.titleLevel.toString())){
				this.titleDom = domConstr(
					"h"+this.titleLevel.toString(),
					{"innerHTML": domAttr.get(this.titleDom, "innerHTML")},
					this.titleDom,
					"replace"
				);
			}
		},
		
		_setDataAttr: function(data){
			this.data = ((data == undefined) ? [] : data);
			this._init();
			this._processContacts();
		},
		
		_setTitleAttr: function(title){
			this.title = title;
			this._addTitle();
			this._showTitleNode();
		},
		
		_init: function(){
			this._fixTitleLevel();
		},
		
		_processContacts: function(){
			var self = this;
			var count = this.data.length;
			var callback = function(){
				count--;
				if(count <= 0){
					if(!self._tableIsEmpty()){
						self._showTable();
						self._writeLastRow();
					}else{
						self._hideTable();
					}
				}
			};
			
			domConstr.empty(this.tableNode);
			array.forEach(this.data, function(contact, n){
				var tr = domConstr.create("tr", {}, this.tableNode);
				this._processContact(contact, tr, callback);
			}, this);
		},
		
		_writeLastRow: function(){
			domConstr.place(this._createLastTr(2), this.tableNode);
		},
		
		_processContact: function(contact, tr, callback){
			var type = lang.trim(contact.type);
			
			require.on("error", function(e){
				callback();
			});
			
			if(type !== ""){
				var dojoId = "./contactsTable/"+this._camelize(type);
				require([dojoId], lang.hitch(this, function(construct){
					if(!this._isBlank(tr.parentNode)){
						var rowWidget = new construct(contact);
						domConstr.place(rowWidget.domNode, tr, "replace");
						callback();
					}
				}));
			}
		},
		
		_camelize: function(str){
			return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index){
				if(+match === 0){
					return ""; // or if (/\s+/.test(match)) for white spaces
				}
				return index == 0 ? match.toLowerCase() : match.toUpperCase();
			});
		}
	});
	
	return construct;
});