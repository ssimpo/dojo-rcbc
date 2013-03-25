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
	"dojo/i18n!./nls/kiteMarks",
	"dojo/text!./views/kiteMarks.html",
	"simpo/typeTest",
	"dojo/dom-construct",
	"dojo/dom-attr"
], function(
	declare, _widget, _templated, _wTemplate, i18n, strings, template,
	typeTest, domConstr, domAttr
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
				this.data = ((data == undefined) ? "" : data);
				if(typeTest.isBlank(this.data)){
					this._hideContent();
				}else{
					this.update(data);
					this._showContent();
				}
			}catch(e){
				console.info("Could not set data attribute for kiteMarks widget.");
			}
		},
		
		update: function(value){
			domAttr.set(this.titleDom, "innerHTML", strings.title);
			domAttr.set(this.detailsNode, "innerHTML", value);
		},
		
		_hideContent: function(){
			try{
				domConstr.place(this.titleDom, this.hiddenNode);
				domConstr.place(this.detailsNode, this.hiddenNode);
			}catch(e){
				console.info("Could not hide KiteMark details");
			}
		},
		
		_showContent: function(){
			try{
				domConstr.place(this.titleDom, this.domNode);
				domConstr.place(this.detailsNode, this.domNode);
			}catch(e){
				console.info("Could not show KiteMark details");
			}
		}
	});
	
	return construct;
});