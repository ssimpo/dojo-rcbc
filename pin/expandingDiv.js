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
	"dojo/i18n!./nls/expandingDiv",
	"dojo/text!./views/expandingDiv.html",
	"dojo/_base/fx",
	"dojo/dom-style",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/dom-attr",
	"dojo/query",
	"dojo/dom-construct"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template,
	fx, domStyle, on, lang, domAttr, $, domConstr
){
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		"minHeight": 0,
		"maxHeight": 0,
		"padding": 5,
		"helpMessage": strings.helpMessage,
		
		postCreate: function(){
			this._init();
		},
		
		_init: function(){
			this._initContent()
			this._initEvents();
			this.contract();
		},
		
		_initContent: function(){
			$("*", this.domNode).forEach(function(node){
				if((node !== this.contentNode) && (node !== this.headingNode)){
					if(this._getParentNode(node) === this.domNode){
						domConstr.place(node, this.contentNode);
					}	
				}
			}, this);
		},
		
		_getParentNode: function(node){
			return ((!node.parentElement) ? node.parentNode : node.parentElement);
		},
		
		_initEvents: function(){
			on(this.domNode, "mouseover", lang.hitch(this, this.expand));
			on(this.domNode, "mouseout", lang.hitch(this, this.contract));
		},
		
		_setHeights: function(){
			this.set(
				"minHeight",
				domStyle.get(this.headingInfoNode, "height")
					+ this.get("padding")
			);
			this.set(
				"maxHeight",
				domStyle.get(this.contentNode, "height")
					+ this.get("padding")
					+ domStyle.get(this.headingNode, "height")
			);
		},
		
		_animate: function(height, callback){
			fx.animateProperty({
				"node": this.domNode,
				"properties": {
					"height": height
				},
				"onEnd": callback
			}).play();
		},
		
		expand: function(){
			this._setHeights();
			domAttr.set(
				this.headingInfoNode,
				"innerHTML",
				"&nbsp;"
			);
			this._animate(this.get("maxHeight"), lang.hitch(this, function(){
				domStyle.set(this.headingNode, "cursor", "default");
			}));
			
		},
		
		contract: function(){
			this._setHeights();
			domStyle.set(this.headingNode, "cursor", "pointer");
			this._animate(this.get("minHeight"));
			domAttr.set(
				this.headingInfoNode,
				"innerHTML",
				this.helpMessage
			);
		},
		
		setHeader: function(html){
			domAttr.set(this.headingTitleNode, "innerHTML", html);
			this.contract();
		}
	});
	
	return construct;
});