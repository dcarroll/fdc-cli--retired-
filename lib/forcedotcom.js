#! /usr/bin/env node

var userArgs = process.argv.slice(2);
var sforce = require('./connection').sforce;

var commandMap = { login:0, createtable:1, addfield:2, test:3, showtables:4 };

var _ = require("underscore")._;

var prompt = require('prompt');
var promptdefs = require("./promptdefs").promptdefs;
var prompts = promptdefs.prompts;


var doLogin = function(un, pw) {
	prompt.message = "Login".red;
	prompt.start();

	var props = [
		{
			description: "Enter your username",
			name:"username",
			required: true
		},
		{
			description: "Enter your password",
			name:"password",
			required: true,
			hidden: true
		}
	];

	prompt.get(props, function(err, result) {
		if (err) { return onErr(err); }

		var lr = sforce.connection.login(result["username"], result["password"]);
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
	}); 
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
	prompt.message = "Create Table".red;
	prompt.start();

	var props = [
		{
			description: "Enter your table's name",
			name:"name",
			required: true
		}/*,
		{
			description: "Enter your password",
			name:"password",
			required: true,
			hidden: true
		}*/
	];

	prompt.get(props, function(err, result) {
		if (err) { return onErr(err); }

		config["name"] = result["name"];
		config.sforce = sforce;
		var metadata = require("./fdcmetadata").fdcmetadata;
		metadata.createCustomObject(config);
		// Look for the table name 
	});
}


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
				//Should validate the object exists herevar dsr = sforce.connection.describeSObject(fieldConfig.fullName);
				
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

var showTables = function() {
	var dsr = sforce.connection.describeGlobal();
	//console.log(JSON.stringify(dsr["sobjects"]));
	var Table = require("cli-table");
	var table = new Table({
		head: ['API Name', 'Label', 'Plural Label', "Rows"]
	});
	//console.log(JSON.stringify(dsr["sobjects"], null, 2));

	var tableMap = {};
	_.each(dsr["sobjects"], function(objectDef) {
		if (userArgs[1] === 'all' || objectDef.name[0].indexOf("__c") != -1) {
			tableMap[objectDef.name[0]] = { name:objectDef.name[0], label:objectDef.label[0],
				labelPlural:objectDef.labelPlural[0], rows:0 };
			//table.push([objectDef.name[0], objectDef.label[0], objectDef.labelPlural[0]]);
		}
	});
	console.log("Got tables");

	for (var key in tableMap) {
		console.log("Getting Row count for " + key);
		if (userArgs[1] !== 'all') {
			var res = sforce.connection.query("Select Count() From " + key);
			tableMap[key].rows = res.size;
		} else {
			tableMap[key].rows = "na";
		}
		table.push([ tableMap[key].name, tableMap[key].label, tableMap[key].labelPlural, tableMap[key].rows ]);
	}
	console.log(table.toString());
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
		case 4:
			showTables();
			break;
		default:
			console.log(userArgs[0] + " is not a command I understand.");
	}
}
