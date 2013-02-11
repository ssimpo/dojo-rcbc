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
	var xhrCounter = 0;
	
	var serviceIds = new Array();
	var venueIds = new Array();
	
	var interval = setInterval(function(){
		if((currentXhr < 2) && ((serviceIds.length > 0) || (venueIds.length > 0))){
			if(serviceIds.length > venueIds.length){
				updateCache();
			}else{
				updateVenueCache();
			}
		}
	}, throttle);
	
	var updateStubs = function(){
		currentXhr++;
		xhrCounter++;
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
		//console.log("XHR COUNTER", xhrCounter);
		//console.log("Running XHR: "+currentXhr.toString());
	};
	
	var updateCache2 = function(data){
		currentXhr++;
		xhrCounter++;
		request(
			updateUrl+"&id="+data, {
				"handleAs": "text",
				"preventCache": true,
				"timeout": 5*1000
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
		//console.log("XHR COUNTER", xhrCounter);
		//console.log("Running XHR: "+currentXhr.toString(), data.length);
	};
	
	var updateCache = function(){
		var ids = new Array();
		for(var i = 0; ((i < 50) && (i < serviceIds.length)); i++){
			ids.push(serviceIds.pop());
		}
		if(ids.length > 0){
			updateCache2(ids);
		}
	}
	
	var updateVenueCache2 = function(data){
		currentXhr++;
		xhrCounter++;
		request(
			updateVenueUrl+"&id="+data, {
				"handleAs": "text",
				"preventCache": true,
				"timeout": 5*1000
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
		//console.log("XHR COUNTER", xhrCounter);
		//console.log("Running XHR: "+currentXhr.toString(), data.length);
	};
	
	var updateVenueCache = function(){
		var ids = new Array();
		for(var i = 0; ((i < 50) && (i < venueIds.length)); i++){
			ids.push(venueIds.pop());
		}
		if(ids.length > 0){
			updateVenueCache2(ids);
		}
	}
	
	var handleCommand = function(message){
		if(message.command == "updateStubs"){
			updateStubs();
		}else if(message.command == "updateCache"){
			serviceIds = serviceIds.concat(message.data);
		}else if(message.command == "updateVenueCache"){
			venueIds = venueIds.concat(message.data);
		}
	};
	
	on(global, "message", function(message){
		if(message.data.type == "command"){
			handleCommand(message.data);
		}
	});
})