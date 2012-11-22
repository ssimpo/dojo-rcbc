// summary:
//		Validation TextBox with built-in validation types
// description:
//		Adds better tooltips to the validation textbox so that it displays a help
//		message as you hover over the input area (as well as when you type).  The
//		message is not lost when error messages are displayed. Has built-in validation
//		for some common input types (Email and Tel(UK))
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
// todo:
//		Add validation for other input types:
//		* Postcode
//		* URL
//		* Facebook
//		* Skype
//		* Twitter
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
		// i18n: object
		//		The internationalisation text-strings for current browser language.
		"i18n": strings,
		
		// validationType: string
		//		The validation type to apply (eg. Email, Tel).
		"validationType": "",
		
		// tooltipPosition: array
		//		The tooltip position order, try after first, then below ...etc.
		"tooltipPosition": [
			"after-centered","below-centered","above-centered","before-centered"
		],
		
		// validateFunction: function|boolean
		//		The validation function to use (default=false, meaning no validation).
		//		This will be generated from the validationType or can be
		//		supplied via constructor.
		"validateFunction": false,
		
		// invalidMessage: string
		//		The invalid message to display when invalid text is supplied.
		"invalidMessage": "",
		
		// missingMessage: string
		//		The missing message to display when field is required but no text entered.
		"missingMessage": "This is a required field.",
		
		postCreate: function(){
			this._addHelpTooltip();
			this._addValidation();
			this._addMessages();
		},
		
		_addMessages: function(){
			// summary:
			//		Adds prompt, missing-data and error messages for tooltips.
			// description:
			//		Adds prompt messages, giving each message its own div node and class
			//		attribute so it can be styled easily.
			
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
		
		_setInvalidMessageAttr: function(message){
			// summary:
			//		Set the invalid message to the supplied text and update the tooltips.
			// txt: string
			//		The invalid message to use.
			
			this.invalidMessage = message;
			this._addMessages();
		},
		
		_setPromptMessageAttr: function(message){
			// summary:
			//		Set the prompt message to the supplied text and update the tooltips.
			// txt: string
			//		The prompt message to use.
			
			this.promptMessage = message;
			this._addMessages();
		},
		
		_setMissingMessageAttr: function(message){
			// summary:
			//		Set the missing-value message to the supplied text and update the tooltips.
			// message: string
			//		The missing-value message to use.
			
			this.missingMessage = message;
			this._addMessages();
		},
		
		displayMessage: function(message){
			// summary:
			//		Display the attached tooltip with supplied message
			//		(or remove it, if message is blank).
			// message: string
			//		Message to display.
			
			if(message && (this.focused || this.hovering)){
				Tooltip.show(message, this.domNode, this.tooltipPosition, !this.isLeftToRight());
			}else{
				Tooltip.hide(this.domNode);
			}
		},
		
		_addHelpTooltip: function(){
			// summary:
			//		Add the help tooltips mouse is moved over the input.
			
			on(this.domNode, "mouseover", lang.hitch(this, function(){
				this.validate();
			}));
			
			on(this.domNode, "mouseout", lang.hitch(this, function(){
				this.validate();
			}));
		},
		
		_addValidation: function(){
			// summary:
			//		Add validation to the textbox according to the validationType property.
			
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
		
		_setValidationTypeAttr: function(type){
			// summary:
			//		Set the validation type attribute (blank if default).
			// type: string
			//		The type of validation to use.
			
			this.validationType = type;
			this._addValidation();
		},
		
		_addValidationDefault: function(){
			// summary:
			//		Adds a validation of always valid as a default.
			
			this.set("validateFunction", lang.hitch(this,
				function(value, constraints){
					return true;
				}
			));
		},
		
		_addValidationEmail: function(){
			// summary:
			//		Adds email address validation function.
			
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
			// summary:
			//		Adds telephone number validation function.
			
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
			// summary:
			//		Validator, that will test the input for valid entry.
			// value: string
			//		The text to validate.
			// constraints: object regex
			//		The regular expression to use for validation.
			
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