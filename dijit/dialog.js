define([
	"dojo/_base/declare",
	"dijit/Dialog",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/query",
	"dijit/registry",
	"dojo/aspect",
	"dojo/dom-attr",
	"dojo/dom-class",
	"dojo/_base/array",
	"simpo/typeTest"
], function(
	declare, Dialog, on, lang, $, registry, aspect, domAttr, domClass, array, typeTest
){
	"use strict";
	
	var construct = declare([Dialog],{
		"okButton": false,
		"cancelButton": false,
		"preload": true,
		
		"tooltipLabels": {},
		"tooltipLabels2": {},
		
		"_ids": {},
		"_ids2": {},
		"_nodes": {},
		"_nodes2": {},
		"_initialFields": {},
		
		constructor: function(){
			on(this, "load", lang.hitch(this, this._init));
			on(this, "hide", lang.hitch(this, this._dialogHide));
			on(this, "show", lang.hitch(this, this._dialogShow));
		},
		
		_init: function(){
			var pane = this._getPane();
			if(pane){
				this._generateIds(pane);
				this._generateLabels(pane);
				this._parseTooltipLabels(pane);
				domClass.add(this.domNode, "dojoRcbcDijitDialog");
			}
		},
		
		_getDialogId: function(){
			return domAttr.get(this.domNode, "id");
		},
		
		getWidget2: function(id){
			var dialogId = this._getDialogId();
			var widget = null;
			var node = null;
			
			if(this._hasProperty(this._nodes, id)){
				var node = this._nodes2[dialogId][id];
			}else if(this._hasProperty(this, id)){
				var node = this[id];
			}
			
			if(node != null){
				widget = registry.getEnclosingWidget(node);
				if(widget == null){
					widget = node;
				}else if(widget.domNode.tagName.toLowerCase() == "form"){
					widget = node;
				}
			}
			
			return widget;
		},
		
		getWidget: function(id){
			var widget = null;
			var node = null;
			
			if(this._hasProperty(this._nodes, id)){
				var node = this._nodes[id];
			}else if(this._hasProperty(this, id)){
				var node = this._nodes[id];
			}
			
			if(node != null){
				widget = registry.getEnclosingWidget(node);
				if(widget == null){
					widget = node;
				}else if(widget.domNode.tagName.toLowerCase() == "form"){
					widget = node;
				}
			}
			
			return widget;
		},
		
		getTooltips: function(){
			var dialogId = this._getDialogId();
			return this.tooltipLabels2[dialogId];
		},
		
		_generateIds: function(pane){
			var dialogId = this._getDialogId();
			this._nodes2[dialogId] = {};
			this._ids2[dialogId] = {};
			
			$("[data-dojo-create-id]", pane).forEach(function(node){
				var id = domAttr.get(node, "data-dojo-create-id");
				var nId = this._randomId(id);
				domAttr.set(node, "id", nId);
				this._ids[id] = nId;
				this._ids2[dialogId][id] = nId;
				this._nodes[id] = node;
				this._nodes2[dialogId][id] = node;
			}, this);
		},
		
		_generateLabels: function(pane){
			$("[data-dojo-for]", pane).forEach(function(node){
				var id = domAttr.get(node, "data-dojo-for");
				if(this._hasProperty(this._ids, id)){
					domAttr.set(node, "for", this._ids[id]);
				}
			}, this);
		},
		
		_parseTooltipLabels: function(pane){
			var dialogId = this._getDialogId();
			this.tooltipLabels2[dialogId] = {};
			
			$("[data-dojo-tooltip-label]", pane).forEach(function(node){
				var label = domAttr.get(node, "data-dojo-tooltip-label");
				var widget = registry.getEnclosingWidget(node);
				var fieldName = widget.name;
				
				if(fieldName != "" && label != ""){
					this.tooltipLabels[fieldName] = label;
					this.tooltipLabels2[dialogId][fieldName] = label;
				}
			}, this);
		},
		
		_randomId: function(prefix){
			var no = Math.floor((Math.random()*1000000000000)+1);
			return prefix + "_" + no.toString();
		},
		
		_getPane: function(){
			var pane = $(".dijitDialogPaneContent", this.domNode);
			if(pane.length > 0){
				return pane[0];
			}
			
			return false;
		},
		
		_getDialogForm: function(){
			var form = null;
			
			var qry = $("form", this.domNode);
			if(qry.length > 0){
				form = registry.byNode(qry[0]);
			}
			
			return form;
		},
		
		update: function(fieldName, value){
			var form = this._getDialogForm();
			
			if(form != null){
				var widget = this._getFormWidgetByName(fieldName);
				if(widget !== undefined){
					widget.set("value", value);
				}
			}
		},
		
		_getFormWidgetByName: function(widgetName){
			var form = this._getDialogForm();
			var widget;
			
			if(form != null){
				var widgets = form.getChildren();
				array.every(widgets, function(cWidget){
					if(cWidget.name == widgetName){
						widget = cWidget;
						return false;
					}else{
						return true;
					}
				}, this);
			}
			
			return widget;
		},
		
		_dialogShow: function(){
			$(".dijitTooltip", document.body).forEach(function(tooltipDom){
				var tooltip = registry.byNode(tooltipDom);
				tooltip.hide(tooltip.aroundNode);
			},this);
			this.okButton = false;
			this.cancelButton = false;
		},
		
		_dialogHide: function(evt){
			var form = this._getDialogForm();
			if(form != null){
				form.startup();
				this.value = form.value;
			}
		},
		
		_getValueAttr: function(){
			var form = this._getDialogForm();
			var value;
			
			if(form != null){
				form.startup();
				value = form.get("value");
			}
			return value;
		},
		
		_hasProperty: function(obj, propName){
			return Object.prototype.hasOwnProperty.call(obj, propName);
		},
		
		clear: function(){
			var form = this._getDialogForm();
			if(form != null){
				form.reset();
			}
		}
	});
	
	return construct;
});