#! /usr/bin/env node

var userArgs = process.argv.slice(2);
var sforce = require('./connection').sforce;

var commandMap = { login:0, createtable:1, addfield:2, test:3 };

var _ = require("underscore")._;

var prompt = require('prompt');


var doLogin = function(un, pw) {
	var lr = sforce.connection.login(un, pw);
	sforce.connection.init(lr.sessionId, lr.serverUrl);
	var fs = require('fs');
	fs.writeFile(".forcedc", JSON.stringify(lr, null, 4), 
		function(err) {
    		if(err) {
        		console.log(err);
    		} else {
    		}
		}
	); 
}

var loggedin = function() {
	var exec = require('child_process').exec;
	var child = exec('ls -a | grep ' + ".forcedc", function(err, stdout, stderr) {
    	if (err) {
    		console.log("Please run the login command and try again.");
    		return false;
		} else {
			var fs = require('fs');
			fs.readFile('.forcedc', 
				function (err, data) {
  					if (err) throw err;
  					lr = JSON.parse(data);
  					sforce.connection.init(lr.sessionId[0], lr.serverUrl[0]);
					runcommand();
				}
			);
			return true;
		}
	});	
}

/*
	forcedotcom createtable name:MyTable autonumber:true label:"My Table" description:"This is a node.js CLI created table"
*/
var doCreateTable = function() {
	var config = {};
	_.each(userArgs, function(arg) {
		if (arg.indexOf(":") !== -1) {
			var kv = arg.split(":");
			config[kv[0]] = kv[1];
		}
	});
	config.sforce = sforce;
	var metadata = require("./fdcmetadata").fdcmetadata;
	metadata.createCustomObject(config);
	// Look for the table name 
}

var promptdefs = require("./promptdefs").promptdefs;
var prompts = promptdefs.prompts;

var getFieldSpec = function() {
	var fieldConfig = {};
	prompt.message = "Add Field".red;
	prompt.start();

	var getFieldType = function() {
		var props = [
			{
				description: "Enter the field type",
				name:"fieldtype"
			}
		];

		prompt.get(props, function(err, result) {
			if (err) { return onErr(err); }

			if ( result["fieldtype"] === '') {
				console.log("You must specify the field type that you want to add.");
				getFieldType();
			} else {
				fieldConfig.type = result["fieldtype"];
				if (typeof prompts[result["fieldtype"]] === 'undefined') {
					console.log("I actually don't know that field type, can you try another?");
					getFieldType();
				} else {
					prompt.get(promptdefs.prompts[result.fieldtype], function(err, result) {
						for (var key in result) {
							fieldConfig[key] = result[key];
						}
						doCreateField(fieldConfig);
					});
				}
			};
		});
	};

	var getTableName = function(err, result) {

		var props = [
			{
				description: "Enter the parent object",
				name:'customobject',
				reqired: true
			}
		];

		function tableCheck(err, result) {
			if (err) { return onErr(err); }

			if ( result["customobject"] === '') {
				console.log("You must specify the object the field will be part of.");
				getTableName();
			} else {
				fieldConfig.fullName = result.customobject;
				if (fieldConfig.fullName.substring(fieldConfig.fullName.length - 3) !== "__c") {
					fieldConfig.fullName += "__c";
				}
				//Should validate the object exists here
				var dsr = sforce.connection.describeSObject(fieldConfig.fullName);
				//console.log(JSON.stringify(dsr, null, 4));
				if (typeof dsr.length != "undefined") {
					console.log("Nope, that table does not exist, check your spelling and try again!");
					getTableName();
				} else {
					getFieldType();
				}
			};
		};

		if(typeof result !== 'undefined') {
			tableCheck(err, result);
		} else {
			prompt.get(props, tableCheck);
		}
	}

  	function onErr(err) {
    	console.log(err);
    	return 1;
  	}

  	if (typeof userArgs[1] !== 'undefined') {
  		// Looks like we have a table name on the command line,
  		// check the table exists and then goto the field prompts
  		getTableName(null, { customobject:userArgs[1]});
  	} else {
	  	getTableName();
	}
};

var doCreateField = function(fieldConfig) {
	fieldConfig.sforce = sforce;
	var metadata = require("./fdcmetadata").fdcmetadata;
	metadata.createCustomField(fieldConfig);
}

if (userArgs[0] === 'login') {
	doLogin(userArgs[1], userArgs[2]);
} else {
	loggedin();
}

var runcommand = function() {
	switch (commandMap[userArgs[0]]) {
		case 1:
			doCreateTable();
			break;
		case 2:
			getFieldSpec();
			break;
		case 3:
			cliTest();
			break;
		default:
			console.log(userArgs[0] + " is not a command I understand.");
	}
}
