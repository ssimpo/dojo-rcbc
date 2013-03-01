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
	"require",
	"simpo/typeTest"
], function(
	declare, _widget, _templated, _wTemplate, _tableMixin, i18n, strings,
	template, array, domConstr, domAttr, lang, require, typeTest
){
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate, _tableMixin], {
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
			try{
				if(!typeTest.isEqual(this.titleDom.tagName, "h"+this.titleLevel.toString())){
					this.titleDom = domConstr.create(
						"h"+this.titleLevel.toString(),
						{"innerHTML": domAttr.get(this.titleDom, "innerHTML")},
						this.titleDom,
						"replace"
					);
				}
			}catch(e){
				console.info("Could not fix title-level for contact table.");
			}
		},
		
		_setDataAttr: function(data){
			try{
				this.data = ((data == undefined) ? [] : data);
				this._init();
				this._processContacts();
			}catch(e){
				console.info("Could not set data attribute for contact table.");
			}
		},
		
		_setTitleAttr: function(title){
			try{
				this.title = title;
				this._addTitle();
				this._showTitleNode();
			}catch(e){
				console.info("Could not set title attribute for contact table.");
			}
		},
		
		_init: function(){
			try{
				this._fixTitleLevel();
			}catch(e){
				console.info("Could not set inititate contact table.");
			}
		},
		
		_processContacts: function(){
			var self = this;
			var count = ((typeTest.isArray(this.data)) ? this.data.length : 0);
			
			var callback = function(){
				try{
					count--;
					if(count <= 0){
						if(!self._tableIsEmpty()){
							self._showTable();
							self._writeLastRow();
						}else{
							self._hideTable();
						}
					}
				}catch(e){
					console.info("Could not handle show/hide in contact table.");
				}
			};
			
			try{
				domConstr.empty(this.tableNode);
				array.forEach(this.data, function(contact, n){
					var tr = domConstr.create("tr", {}, this.tableNode);
					this._processContact(contact, tr, callback);
				}, this);
			}catch(e){
				console.info("Could not process contacts in contact table.");
			}
		},
		
		_writeLastRow: function(){
			try{
				domConstr.place(this._createLastTr(2), this.tableNode);
			}catch(e){
				console.info("Could not write the last row of contact table.");
			}
		},
		
		_processContact: function(contact, tr, callback){
			var type = lang.trim(contact.type);
			
			require.on("error", function(e){
				console.info("Load failure in contact table.");
				callback();
			});
			
			if(type !== ""){
				var dojoId = "./contactsTable/"+this._camelize(type);
				require([dojoId], lang.hitch(this, function(construct){
					try{
						if(!typeTest.isBlank(tr.parentNode)){
							var rowWidget = new construct(contact);
							domConstr.place(rowWidget.domNode, tr, "replace");
							callback();
						}
					}catch(e){
						console.info("Could not run require callback.");
					}
				}));
			}
		},
		
		_camelize: function(str){
			try{
				return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index){
					if(+match === 0){
						return ""; // or if (/\s+/.test(match)) for white spaces
					}
					return index == 0 ? match.toLowerCase() : match.toUpperCase();
				});
			}catch(e){
				console.info("Could not camelize text in contact table.");
				return str;
			}
		}
	});
	
	return construct;
});