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
	"dojo/i18n!./nls/downloads",
	"dojo/text!./views/downloads.html",
	"dojo/dom-construct",
	"dojo/dom-class",
	"simpo/typeTest",
	"dojo/_base/array",
	"dojo/dom-attr"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template,
	domConstr, domClass, typeTest, array, domAttr
) {
	"use strict";
	
	var construct = declare([_widget, _templated, _wTemplate], {
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// templateString: string
		//		The loaded template string containing the HTML formatted template for this widget.
		"templateString": template,
		
		
		_setDataAttr: function(data){
			try{
				this.data = ((data == undefined) ? [] : data);
				if(typeTest.isBlank(this.data)){
					this._hideContent();
				}else{
					this.update(data);
					this._showContent();
				}
			}catch(e){
				console.info("Could not set data attribute for downloads widget.", e);
			}
		},
		
		update: function(value){
			domAttr.set(this.titleDom, "innerHTML", strings.title+":");
			domAttr.set(this.detailsNode, "innerHTML", this._getLinksHtml(value));
		},
		
		_getLinksHtml: function(value){
			var html = "<ul>";
			
			array.forEach(value, function(item){
				html += "<li><a href=\""+item.href+"\">"+item.name+"</a></li>";
			}, this);
			
			return html + "</ul>";
		},
		
		_hideContent: function(){
			try{
				domConstr.place(this.titleDom, this.hiddenNode);
				domConstr.place(this.detailsNode, this.hiddenNode);
			}catch(e){
				console.info("Could not hide download details");
			}
		},
		
		_showContent: function(){
			try{
				domConstr.place(this.titleDom, this.domNode);
				domConstr.place(this.detailsNode, this.domNode);
			}catch(e){
				console.info("Could not show download details");
			}
		}
	});
	
	return construct;
});