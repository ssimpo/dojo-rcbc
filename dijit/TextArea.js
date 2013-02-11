define([
	"dojo/_base/declare",
	"dojo/i18n",
	"dojo/i18n!./nls/TextArea",
	"dijit/form/Textarea",
	"dijit/Tooltip"
], function(
	declare, i18n, strings, TextArea, Tooltip
){
	"use strict";
	
	var construct = declare([TextArea], {
		"i18n": strings,
		"tooltip": {},
		
		postCreate: function(){
			if(this._hasProperty(this, "promptMessage")){
				if(this.promptMessage != ""){
					this.tooltip = new Tooltip({
						"label": "<div class=\"dojoDijitHelperTooltip\"><b class=\"label\">"+strings.help+":</b> "+this.promptMessage+"</div>",
						"position": ["after-centered","below-centered","above-centered","before-centered"]
					});
					this.tooltip.addTarget(this.domNode);
				}
			}
		},
		
		_hasProperty: function(obj, propName){
			return Object.prototype.hasOwnProperty.call(obj, propName);
		}
	});
	
	return construct;
});