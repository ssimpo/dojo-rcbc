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
	"./_variableTestMixin",
	"dojo/i18n",
	"dojo/i18n!./nls/shortlist",
	"dojo/text!./views/shortlist.html",
	"./serviceDisplayer",
	"dojo/dom-construct",
	"dojo/dom-class",
	"dojo/_base/array",
	"dojo/topic",
	"dijit/form/CheckBox",
	"dojo/on",
	"dojo/_base/lang",
	"dijit/form/Button"
], function(
	declare,
	_widget, _templated, _wTemplate, _variableTestMixin,
	i18n, strings, template,
	serviceDisplayer, domConstr, domClass, array, topic, CheckBox, on, lang,
	Button
){
	"use strict";
	
	var construct = declare([
		_widget, _templated, _wTemplate, _variableTestMixin
	], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"value": [],
		"_displayers": [],
		
		"application": null,
		"parentNode": null,
		"hiddenNode": null,
		"parentPosPlace": "last",
		"messageNode": null,
		
		"show": {
			"title": true,
			"titleLink": true,
			"description": false,
			"keyFeatures": true,
			"contacts": true,
			"costs": true,
			"venues": false,
			"serviceHours": false,
			"accessDetails": true
		},
		
		postCreate: function(){
			this._initEvents();
			this._initCheckboxes();
		},
		
		ready: function(){
			if(this.messageNode === null){
				this.messageNode = domConstr.create("p", {
					"innerHTML": strings.emptyMessage
				}, this.hiddenNode);
				this._hideEmptyMessage();
			}
		},
		
		_initEvents: function(){
			try{
				on(this.showDescription, "change", lang.hitch(this, this._showChange));
				on(this.showKeyFeatures, "change", lang.hitch(this, this._showChange));
				on(this.showCosts, "change", lang.hitch(this, this._showChange));
				on(this.showContacts, "change", lang.hitch(this, this._showChange));
				on(this.showVenues, "change", lang.hitch(this, this._showChange));
				on(this.showServiceHours, "change", lang.hitch(this, this._showChange));
				on(this.showAccessDetails, "change", lang.hitch(this, this._showChange));
			}catch(e){
				console.info("Could not inititate events.");
			}
		},
		
		_initCheckboxes: function(){
			try{
				this.showDescription.set("value", this.show.description);
				this.showKeyFeatures.set("value", this.show.keyFeatures);
				this.showCosts.set("value", this.show.costs);
				this.showContacts.set("value", this.show.contacts);
				this.showVenues.set("value", this.show.venues);
				this.showServiceHours.set("value", this.show.serviceHours);
				this.showAccessDetails.set("value", this.show.accessDetails);
			}catch(e){
				console.info("Could not set initial checkbox values.");
			}
		},
		
		_init: function(){
			try{
				this._initNodes();
				this._destroyDisplayers();
				domConstr.empty(this.displayerNode);
			}catch(e){
				console.info("Could not ininitate shortlist displayer.");
			}
		},
		
		_initNodes: function(){
			try{
				if(this.application !== null){
					if(this.parentNode === null){
						this.parentNode = this.application.articleContentNode;
					}
					if(this.hiddenNode === null){
						this.hiddenNode = this.application.hiddenDiv;
					}
				}
			}catch(e){
				console.info("Could not ininitate shortlist nodes.");
			}
		},
		
		_hideWidget: function(){
			try{
				if(this.hiddenNode !== null){
					domConstr.place(this.domNode, this.hiddenNode);
					domClass.replace(
						this.parentNode,
						"articleContent",
						"articleContent-wide"
					);
				}
			}catch(e){
				console.info("Could not hide shortlist displayer.");
			}
		},
		
		_showWidget: function(){
			try{
				if(this.parentNode !== null){
					domConstr.place(
						this.domNode, this.parentNode, this.parentPosPlace
					);
					domClass.replace(
						this.parentNode,
						"articleContent-wide",
						"articleContent"
					);
				}
			}catch(e){
				console.info("Could not show shortlist displayer.");
			}
		},
		
		clear: function(){
			this.value = [];
			this._hideWidget();
			this._hideEmptyMessage();
		},
		
		_showChange: function(evt){
			try{
				this.show = {
					"title": true,
					"titleLink": true,
					"description": this.showDescription.get("value"),
					"keyFeatures": this.showKeyFeatures.get("value"),
					"contacts": this.showContacts.get("value"),
					"costs": this.showCosts.get("value"),
					"venues": this.showVenues.get("value"),
					"serviceHours": this.showServiceHours.get("value"),
					"accessDetails": this.showAccessDetails.get("value")
				}
				this.set("value", this.get("value"));
			}catch(e){
				console.info("Could not set show values.");
			}
		},
		
		_setValueAttr: function(value){
			this._init();
			
			try{
				if(this._isBlank(value)){
					this._hideWidget();
					this._showEmptyMessage();
				}else{
					this._hideEmptyMessage();
					topic.publish("/rcbc/pin/titleChange", "");
					this._showWidget();
					this._displayShortlist(value);
				}
				this.value = value;
			}catch(e){
				console.info("Could not set shortlist displayer value.");
			}
		},
		
		_showEmptyMessage: function(){
			if(this.messageNode !== null){
				domConstr.place(this.messageNode, this.parentNode);
				domClass.replace(
					this.parentNode, "articleContent-wide", "articleContent"
				);
				this.application.hideButtonPanel();
			}
		},
		
		_hideEmptyMessage: function(){
			if(this.messageNode !== null){
				domConstr.place(this.messageNode, this.hiddenNode);
			}
		},
		
		_destroyDisplayers: function(){
			try{
				array.forEach(this._displayers, function(displayer){
					displayer.destroy();
				}, this);
				this._displayers = new Array();
			}catch(e){
				console.info("Could not destroy shortlist displayers");
			}
		},
		
		_displayShortlist: function(ids){
			try{
				this._displayers = new Array();
				var services = this._getServices(ids);
			
				array.forEach(services, function(service, n){
					this._createItem(service.data);
				}, this);
			}catch(e){
				console.info("Could not display shortlist.");
			}
		},
		
		_createItem: function(data){
			try{
				var item = domConstr.create("li", {}, this.displayerNode);
				var block = this._createBlock(data);
				domConstr.place(block, item);
			}catch(e){
				console.info("Could not create shortlist item.");
			}
		},
		
		_createBlock: function(data){
			try{
				var block = domConstr.create("div");
				var buttonPanel = this._createButtonPanel(data);
				domConstr.place(buttonPanel, block);
				var displayer = this._createDisplayer(data);
				domConstr.place(displayer.domNode, block);
				this._displayers.push(displayer);
				return block;
			}catch(e){
				console.info("Could not create block.");
				return domConstr.create("div");
			}
		},
		
		_createButtonPanel: function(data){
			try{
				var panel = domConstr.create("div", {
					"class": "buttonsPanel"
				});
				var removeButton = new Button({
					"label": "Remove from shortlist",
				});
				domConstr.place(removeButton.domNode, panel);
				on(
				   removeButton,
				   "click",
				   lang.hitch(this, this._removeItemClick, data.id)
				);
				return panel;
			}catch(e){
				console.info("Could not create button panel.");
				return domConstr.create("div");
			}
		},
		
		_removeItemClick: function(id){
			this.application.store.removeFromShortlist(id);
			var shortlist = this.application.store.getShortlist();
			this.set("value", shortlist.services);
		},
		
		_createDisplayer: function(data){
			try{
				var displayer = new serviceDisplayer({
					"application": this.application,
					"parentNode": this.displayerNode,
					"titleLevel": 2,
					"show": this.show
				});
				displayer.set("value", data);
				return displayer;
			}catch(e){
				console.info("Could not create displayer.");
				return {
					"domNode": domConstr.create("div")
				}
			}
		},
		
		_getServices: function(ids){
			var services = new Array();
			
			try{
				array.forEach(ids, function(id){
					var service = this.application.store.get(id);
					if(!this._isBlank(service)){
						services.push(service);
					}
				}, this);
			}catch(e){
				console.info("Could not get services");
			}
			
			return services;
		}
	});
	
	return construct;
});