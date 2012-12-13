require([
	"dojo/on",
	"dojo/request/xhr",
	"dojo/_base/lang"
], function(
	on, request, lang
){
	var global = Function('return this')() || (42, eval)('this');
	var updateUrl = "/test/stephen/pin.nsf/getService2?openagent";
	var updateVenueUrl = "/test/stephen/pin.nsf/getVenue?openagent";
	var serviceIds = [];
	
	var updateStubs = function(){
		request(
			"/servicesStub.json", {
				"handleAs": "json",
				"preventCache": true
			}
		).then(
			function(data){
				global.postMessage({
					"type": "message",
					"message": {
						"type": "updateStubs",
						"message": data
					}
				});
			},
			function(e){
				console.error(e);
			}
		);
	};
	
	var updateCache = function(data){
		var ids = new Array();
		for(var i = 0; ((i < 50) && (i < data.length)); i++){
			ids.push(data.pop());
		}
			
		request(
			updateUrl+"&id="+ids, {
				"handleAs": "text",
				"preventCache": true
			}
		).then(
			function(cache){
				global.postMessage({
					"type": "message",
					"message": {
						"type": "updateCache",
						"message": cache
					}
				});
				if(data.length > 0){
					updateCache(data);
				}
			},
			function(e){
				console.error("ERROR");
			}
		);
	};
	
	var updateVenueCache = function(data){
		var ids = new Array();
		for(var i = 0; ((i < 50) && (i < data.length)); i++){
			ids.push(data.pop());
		}
			
		request(
			updateVenueUrl+"&id="+ids, {
				"handleAs": "text",
				"preventCache": true
			}
		).then(
			function(cache){
				global.postMessage({
					"type": "message",
					"message": {
						"type": "updateVenueCache",
						"message": cache
					}
				});
				if(data.length > 0){
					updateCache(data);
				}
			},
			function(e){
				console.error("ERROR");
			}
		);
	};
	
	var handleCommand = function(message){
		if(message.command == "updateStubs"){
			updateStubs();
		}else if(message.command == "updateCache"){
			updateCache(message.data);
		}else if(message.command == "updateVenueCache"){
			updateVenueCache(message.data);
		}
	};
	
	on(global, "message", function(message){
		if(message.data.type == "command"){
			handleCommand(message.data);
		}
	});
})