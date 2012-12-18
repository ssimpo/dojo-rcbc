require([
	"dojo/on",
	"dojo/request/xhr",
	"dojo/_base/lang"
], function(
	on, request, lang
){
	var global = Function('return this')() || (42, eval)('this');
	var updateUrl = "/pin.nsf/getService2?openagent";
	var updateVenueUrl = "/pin.nsf/getVenue?openagent";
	var serviceIds = [];
	var throttle = 800;
	var currentXhr = 0;
	
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
				currentXhr--;
			},
			function(e){
				currentXhr--;
				console.error(e);
			}
		);
		currentXhr++;
		//console.log("Running XHR: "+currentXhr.toString());
	};
	
	var updateCache2 = function(data){
		request(
			updateUrl+"&id="+data, {
				"handleAs": "text",
				"preventCache": true
			}
		).then(
			function(cache){
				currentXhr--;
				global.postMessage({
					"type": "message",
					"message": {
						"type": "updateCache",
						"message": cache,
						"orginalLookup": data
					}
				});
				updateCache([]);
			},
			function(e){
				currentXhr--;
				console.error(e);
			}
		);
		currentXhr++;
		//console.log("Running XHR: "+currentXhr.toString());
	};
	
	var serviceIds = new Array();
	var updateCache = function(data){
		serviceIds = serviceIds.concat(data);
		
		var ids = new Array();
		for(var i = 0; ((i < 50) && (i < serviceIds.length)); i++){
			ids.push(serviceIds.pop());
		}
		
		if(ids.length > 0){
			global.setTimeout(function(){
				updateCache2(ids)
			}, throttle);
		}
	}
	
	var updateVenueCache2 = function(data){
		request(
			updateVenueUrl+"&id="+data, {
				"handleAs": "text",
				"preventCache": true
			}
		).then(
			function(cache){
				currentXhr--;
				global.postMessage({
					"type": "message",
					"message": {
						"type": "updateVenueCache",
						"message": cache,
						"orginalLookup": data
					}
				});
				if(data.length > 0){
					updateVenueCache([]);
				}
			},
			function(e){
				currentXhr--;
				console.error(e);
			}
		);
		currentXhr++;
		//console.log("Running XHR: "+currentXhr.toString());
	};
	
	var venueIds = new Array();
	var updateVenueCache = function(data){
		venueIds = venueIds.concat(data);
		
		var ids = new Array();
		for(var i = 0; ((i < 50) && (i < venueIds.length)); i++){
			ids.push(venueIds.pop());
		}
		
		if(ids.length > 0){
			global.setTimeout(function(){
				updateVenueCache2(ids)
			}, throttle);
		}
	}
	
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