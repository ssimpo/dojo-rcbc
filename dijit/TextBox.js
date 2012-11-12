define([
	"dojo/_base/declare",
	"dojo/i18n!./nls/TextBox",
	"dijit/form/ValidationTextBox",
	"dojo/_base/lang",
	"dojo/on",
	"dijit/Tooltip"
], function(
	declare, strings, TextBox, lang, on, Tooltip
){
	"use strict";
	
	var construct = declare([TextBox], {
		"i18n": strings,
		"validationType": "",
		"tooltipPosition": ["after-centered","below-centered","above-centered","before-centered"],
		"validateFunction": false,
		invalidMessage: "",
		missingMessage: "This is a required field.",
		
		postCreate: function(){
			this._addHelpTooltip();
			this._addValidation();
			this._addMessages();
		},
		
		_addMessages: function(){
			if(this.promptMessage != "" && this.promptMessage.indexOf('dojoDijitHelperTooltip') === -1){
				this.promptMessage = "<div class=\"dojoDijitHelperTooltip\"><b class=\"label\">"+strings.help+":</b> "+this.promptMessage+"</div>";
			}
			if(this.invalidMessage != "" && this.invalidMessage.indexOf('dojoDijitErrorTooltip') === -1){
				this.invalidMessage = "<div class=\"dojoDijitErrorTooltip\"><b class=\"label\">"+strings.invalid+":</b> "+this.invalidMessage+"</div>";
				if(this.promptMessage != ""){
					this.invalidMessage += "<br />" + this.promptMessage;
				}
			}
			if(this.missingMessage != "" && this.missingMessage.indexOf('dojoDijitMissingTooltip') === -1){
				this.missingMessage = "<div class=\"dojoDijitMissingTooltip\"><b class=\"label\">"+strings.required+":</b> "+this.missingMessage+"</div>";
				if(this.promptMessage != ""){
					this.missingMessage += "<br />" + this.promptMessage;
				}
			}
		},
		
		_setInvalidMessageAttr: function(value){
			this.invalidMessage = value;
			this._addMessages();
		},
		
		_setPromptMessageAttr: function(value){
			this.promptMessage = value;
			this._addMessages();
		},
		
		_setMissingMessageAttr: function(value){
			this.missingMessage = value;
			this._addMessages();
		},
		
		displayMessage: function(/*String*/ message){
			if(message && (this.focused || this.hovering)){
				Tooltip.show(message, this.domNode, this.tooltipPosition, !this.isLeftToRight());
			}else{
				Tooltip.hide(this.domNode);
			}
		},
		
		_addHelpTooltip: function(){
			on(this.domNode, "mouseover", lang.hitch(this, function(){
				this.validate();
			}));
			
			on(this.domNode, "mouseout", lang.hitch(this, function(){
				this.validate();
			}));
		},
		
		_addValidation: function(){
			var validationType = this.get("validationType");
			if(validationType != ""){
				validationType = validationType.charAt(0).toUpperCase() + validationType.slice(1);
				
				var validationMethod = "_addValidation"+validationType;
				if(typeof this[validationMethod] === 'function'){
					this[validationMethod]();
				}else{
					this._addValidationDefault();
				}
			}
		},
		
		_setValidationTypeAttr: function(value){
			this.validationType = value;
			this._addValidation();
		},
		
		_addValidationDefault: function(){
			this.set("validateFunction", lang.hitch(this,
				function(value, constraints){
					return true;
				}
			));
		},
		
		_addValidationEmail: function(){
			var pattern = /^[A-Z0-9\!\#\$\%\&\'\*\+\/\=\?\^_\`\{\|\}\~\-]+(?:\.[A-Z0-9\!\#\$\%\&\'\*\+\/\=\?^_\`\{\|\}\~\-]+)*\@(?:[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?\.)+[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?$/i;
			var regx = new RegExp(pattern);
			
			this.set("invalidMessage", "This is not a valid email address");
			this.set("validateFunction", lang.hitch(this,
				function(value, constraints){
					if(value == ""){ return true; }
					return regx.test(value);
				}
			));
		},
		
		_addValidationTel: function(){
			var pattern = /^(?:(?:\(?(?:0(?:0|11)\)?[\s-]?\(?|\+)44\)?[\s-]?(?:\(?0\)?[\s-]?)?)|(?:\(?0))(?:(?:\d{5}\)?[\s-]?\d{4,5})|(?:\d{4}\)?[\s-]?(?:\d{5}|\d{3}[\s-]?\d{3}))|(?:\d{3}\)?[\s-]?\d{3}[\s-]?\d{3,4})|(?:\d{2}\)?[\s-]?\d{4}[\s-]?\d{4}))(?:[\s-]?(?:x|ext\.?|\#)\d{3,4})?$/;
			var regx = new RegExp(pattern);
			
			this.set("invalidMessage", "This is not a valid UK telephone number.");
			this.set("validateFunction", lang.hitch(this,
				function(value, constraints){
					if(value == ""){ return true; }
					return regx.test(value);
				}
			));
		},
		
		validator: function(value, constraints){
			if(this.validateFunction){
				return (
					this.validateFunction(value, constraints)) &&
					(!this.required ||
					!this._isEmpty(value)) &&
					(this._isEmpty(value) ||
					this.parse(value, constraints) !== undefined);
			}else{
				return (new RegExp("^(?:" + this._getPatternAttr(constraints) + ")"+(this.required?"":"?")+"$")).test(value) &&
				(!this.required || !this._isEmpty(value)) &&
				(this._isEmpty(value) || this.parse(value, constraints) !== undefined);
			}
		}
	});
		
	
	return construct;
});