define([
	"doh",
	"rcbc/dijit/ageRange"
], function(
	doh, ageRange
){
	"use strict";
	
	var fixtures = {
		"blank": function(){},
		"deferred": function(){
			this.deferred = new doh.Deferred();
		}
	};
	
	var tearDowns = {
		"blank":function(){}	
	};
	
	doh.register("rcbc/tests/dijit/ageRange", [{
		"name": "_handleSelector",
		"setUp": fixtures.blank,
		"tearDown": tearDowns.blank,
		"runTest": function(){
			doh.assertTrue(false);
		}
	},{
		"name": "_handleSelectAbove",
		"setUp": fixtures.blank,
		"tearDown": tearDowns.blank,
		"runTest": function(){
			this.testOne();
			this.testTwo();
			this.testThree();
		},
		"testOne": function(){
			doh.assertTrue(false);
		},
		"testTwo":function(){
		},
		"testThree": function(){
		},
	},{
		"name": "_handleSelectBelow",
		"setUp": fixtures.blank,
		"tearDown": tearDowns.blank,
		"runTest": function(){
		}
	}]);
});