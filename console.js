// summary:
//
// description:
//
// author:
//		Stephen Simpson <me@simpo.org>, <http://simpo.org>
define([
	"dojo/aspect",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/string"
], function(
	aspect, lang, array, string
){
	"use strict";
	
	var construct = function(strings){
		
		
		(function(){
			var warn = console.warn;
			var log = console.log;
			var info = console.info;
			var error = console.error;
			
			if(!_hasProperty(window, "errorLevel")){
				window.errorLevel = 0;
			}
		
			console.warn = function(msg){
				//if(window.errorLevel > 2){
					var args = _makeArgumentsArray.apply(null, arguments);
					args.push(strings);
					args = _parseArguments.apply(null, args);
					
					try{
						warn.apply(this, args);
					}catch(e){
						Function.prototype.call.call(warn, this, Array.prototype.slice.call(args));
					}
				//}
			}
			
			console.log = function(msg){
				//if(window.errorLevel > 1){
					var args = _makeArgumentsArray.apply(null, arguments);
					args.push(strings);
					args = _parseArguments.apply(null, args);
					
					try{
						log.apply(this, args);
					}catch(e){
						Function.prototype.call.call(log, this, Array.prototype.slice.call(args));
					}
				//}
			}
			
			console.info = function(msg){
				//if(window.errorLevel > 0){
					var args = _makeArgumentsArray.apply(null, arguments);
					args.push(strings);
					args = _parseArguments.apply(null, args);
					
					try{
						info.apply(this, args);
					}catch(e){
						Function.prototype.call.call(info, this, Array.prototype.slice.call(args));
					}
				//}
			}
			
			console.error = function(msg){
				//if(window.errorLevel > 3){
					var args = _makeArgumentsArray.apply(null, arguments);
					args.push(strings);
					args = _parseArguments.apply(null, args);
					
					try{
						error.apply(this, args);
					}catch(e){
						Function.prototype.call.call(error, this, Array.prototype.slice.call(args));
					}
				//}
			}
		
			function _makeArgumentsArray(){
				var args = new Array();
				for(var i = 0; i < arguments.length; i++){
					args[i] = arguments[i];
				}
				return args;
			}
		
			function _parseArguments(){
				var args = _parseMessages1.apply(null, arguments);
				args = _parseMessages2.apply(null, args);
				return args;
			}
		
			function _parseMessages1(){
				var args = _makeArgumentsArray.apply(null, arguments);
				var strings = args.pop();
			
				array.forEach(args, function(arg, n){
					if(_isString(arg)){
						try{
							var parseString = lang.getObject(arg, false, strings);
							if(parseString !== undefined){
								args[n] = parseString;
							}
						}catch(e){
							// Do nothing
						}
					}
				});
			
				return args
			}
		
			function _parseMessages2(){
				var args = _makeArgumentsArray.apply(null, arguments);
				if(args.length > 1){
					if((_isString(args[0])) && (_isObject(args[1]))){
						if(/\$\{.*\}/.test(args[0])){
							try{
								var parseString = string.substitute(args[0], args[1]);
								if(parseString !== "" && parseString !== undefined && parseString !== null && parseString !== false){
									args[0] = parseString;
									args = removeItem(args, 1);
								}
							}catch(e){
								// Do nothing
							}
						}
					}
				}
			
				return args;
			}
			
			function removeItem(ary, index){
				var newArray = new Array();
				
				array.forEach(ary, function(item, n){
					if(n != index){
						newArray.push(item);
					}
				});
				
				return newArray;
			}
		
			function _isObject(value){
				return ((Object.prototype.toString.call(value) === '[object Object]') || (typeof value === "object"));
			}
		
			function _isString(value){
				return (Object.prototype.toString.call(value) === '[object String]');
			}
			
			function _hasProperty(obj, propName){
				if(_isObject(obj)){
					return Object.prototype.hasOwnProperty.call(obj, propName);
				}
			
				return false;
			}
		})();
		
		return console;
	};
	
	return {
		load: function (name, require, load, config){
			require([
				"dojo/i18n!"+name
			], function(strings){
				var newConsole = new construct(strings);
				load(newConsole);
			});
		}
	}
});