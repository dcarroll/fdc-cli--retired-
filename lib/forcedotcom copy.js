#! /usr/bin/env node

var userArgs = process.argv.slice(2);
var sforce = require('./connection').sforce;
var webserver = require('./webserver').webserver;

var commandMap = { 
					login:0, 
					createtable:1, 
					addfield:2, 
					test:3, 
					showtables:4,
					showmetadata:5,
					listmetadata:6,
					retrieveMetadata:7,
					checkRetrieve:8,
					checkStatus:9
				 };

var _ = require("underscore")._;

var prompt = require('prompt');
var promptdefs = require("./promptdefs").promptdefs;
var prompts = promptdefs.prompts;
var CREDS = ".forcedc";
var SETTINGS = ".settings";

var writeFile = function(file, data) {
	var fs = require('fs');
	fs.writeFile(file, JSON.stringify(data, null, 4), 
		function(err) {
			if(err) {
				console.log(err);
			} else {
			}
		}
	);	
};

var writeKeyValue = function(file, key, value) {
	var fs = require('fs');
	if (typeof key !== 'undefined') {
		var obj = readValue(file, function(err, data) {
			if (typeof obj === 'undefined') {
				obj = {};
			}
			obj[key] = value;
			console.log("KEYVAL: " + JSON.stringify(obj) + "\n" + key  + ':' + value);
			writeFile(file, obj);
		});
	} else {
		writeFile(file, value);
	}
};

var readValue = function(file, callback) {
	var fs = require('fs');
	fs.readFile(file, callback);
};

var readKeyValue = function(file, key, callback) {
	readValue(file, function(err, data) {
		if (err) {
			writeFile(SETTINGS, '');
		};// throw err;
		var obj = JSON.parse(data);
		console.log("READKEYVALUE: " + JSON.stringify(obj));
		callback(obj[key]);
	});
};

var doLogin = function(un, pw) {
	//webserver.startServer();
	var open = require('open');

	//var loginUrl = 'https://login-blitz04.soma.salesforce.com/services/oauth2/authorize?display=touch'
	//		    + '&response_type=code&client_id=' + '3MVG9PhR6g6B7ps4obQcN0JWrnMZoxjqlknR8xCDhlW_IiDPq7Ecw02TVVxCICrucS0hb9CiuTEAJYz16c7zC'
	//		    + '&redirect_uri=http://localhost:3000/success';

	var loginUrl = 'https://login.salesforce.com/services/oauth2/authorize?display=touch'
			    + '&response_type=code&client_id=' + '3MVG9A2kN3Bn17hupqqk7YYhDRpNfOTVzCvbaGntcvP0X2zs.ZKXLyFnavnPH9dJcKlJUKAUT0OPsKFlusKH1'
			    + '&redirect_uri=http://localhost:3000/success';

	//open(loginUrl);

	//return;
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
		//sforce.connection.serverUrl = "https://login-blitz04.soma.salesforce.com/services/Soap/u/29.0";
		sforce.connection.serverUrl = "https://login.salesforce.com/services/Soap/u/28.0";
		var lr = sforce.connection.login(result["username"], result["password"]);
		sforce.connection.init(lr.sessionId, lr.serverUrl);
		writeFile(CREDS, lr);
	}); 
}

var loggedin = function() {
	var exec = require('child_process').exec;
	var child = exec('ls -a | grep ' + ".forcedc", function(err, stdout, stderr) {
    	if (err) {
    		console.log("Please run the login command and try again.");
    		return false;
		} else {
			readValue(CREDS,
				function (err, data) {
  					if (err) throw err;
  					lr = JSON.parse(data);
  					sforce.connection.init(lr.sessionId[0], lr.serverUrl[0]);
					runcommand();
				}
			);


			/*var fs = require('fs');
			fs.readFile('.forcedc', 
				function (err, data) {
  					if (err) throw err;
  					lr = JSON.parse(data);
  					sforce.connection.init(lr.sessionId[0], lr.serverUrl[0]);
					runcommand();
				}
			);*/
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

	var props = promptdefs.validateFieldCreate(userArgs);

	var getFieldType = function(userprops) {

		console.log("User props: " + JSON.stringify(userprops));

		if (userprops.hasType === "false") {
			userprops.props.push(promptdefs.typePrompt);
		}
		userprops.props = _.reject(userprops.props, function(prop) { return prop.name === "customobject" });
		userprops.props = _.reject(userprops.props, function(prop) { return prop.name !== "type" });

		console.log("User props 2: " + JSON.stringify(userprops));


		prompt.get(userprops.props, function(err, result) {
			if (err) { return onErr(err); }

			console.log("Initial result: " + JSON.stringify(result, null, 2));
			if ( result["type"] === '') {
				console.log("You must specify the field type that you want to add.");
				getFieldType(userprops);
			} else {
				fieldConfig.type = result["type"];
				console.log("Field Config: " + JSON.stringify(fieldConfig));
				if (typeof prompts[result["type"]] === 'undefined') {
					console.log("I actually don't know that field type, can you try another?");
					getFieldType(userprops);
				} else if (result["type"] == "?") {
					console.log(promptdefs.prompts["?"][0].description);
					getFieldType(userprops);
				} else {
					getFieldAttributes(err, result, userprops);
				}
			};
		});
	};

	var getFieldAttributes = function(err, result, userprops) {
		console.log("New Userargs: " + JSON.stringify(userArgs));
			console.log("FieldConfig: " + JSON.stringify(fieldConfig, null, 2));
		userprops.props = promptdefs.validateFieldCreate(userArgs);
		userprops.props = _.reject(userprops.props, function(prop) { return prop.name === "type" });
		userprops.props = _.reject(userprops.props, function(prop) { return prop.name === "table" });
		console.log("Final props: " + JSON.stringify(userprops, null, 2));
		//prompt.get(promptdefs.prompts[result.type], function(err, result) {
		prompt.get(userprops.props[0], function(err, result) {
			console.log("FieldConfig " + JSON.stringify(fieldConfig, null, 2));
			for (var key in result) {
				console.log("\tKey: " + key);
				if (key != "table") fieldConfig[key] = result[key];
			}
			_.each(userArgs, function(arg) {
				var argkvp = arg.split(":");
				console.log("\tKVO: " + argkvp);
				if (argkvp[0] !== "table") fieldConfig[argkvp[0]] = argkvp[1];
			});
			console.log("FieldConfig: " + JSON.stringify(fieldConfig, null, 2));
			doCreateField(fieldConfig);
		});
	};

	var getTableName = function(err, result) {


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
					if (props.hasType == "false") {
						props.props.push(promptdefs.typePrompt);
						getFieldType(props);
					} else {
						fieldConfig["type"] = userArgs.type;
						getFieldAttributes(null, result, props);
					}
				}
			};
		};

		if(typeof result !== 'undefined') {
			tableCheck(err, result);
		} else {
			prompt.get(props.props, tableCheck);
		}
	}

  	function onErr(err) {
    	console.log(err);
    	return 1;
  	}

  	var cmdConfig = {};

	console.log("Props: " + JSON.stringify(props));

  	if (props["hasTable"] === "false") {
  		console.log("Props has no table");
  		props.props.push(promptdefs.tablePrompt);
		console.log("Props: " + JSON.stringify(props));
  		getTableName();
  	} else {
  		getTableName(null, { customobject:promptdefs.arrayToObject(userArgs).table });
  	}

  	/*if (typeof props["table"] !== 'undefined') {
  		// Looks like we have a table name on the command line,
  		// check the table exists and then goto the field prompts
  		getTableName(null, { customobject:props["table"] });
  	} else {
	  	getTableName();
	}*/
};

var doCreateField = function(fieldConfig) {
	fieldConfig.sforce = sforce;
	var metadata = require("./fdcmetadata").fdcmetadata;
	var result = metadata.createCustomField(fieldConfig);
	console.log("Create Field Result: \n" + JSON.stringify(result[0].id[0], null, 2));
	var config = {
			sforce:sforce
	};	
	while (result[0].done[0] === "false") {
		config.id = result[0].id[0];
		result = metadata.checkStatus(config);
	}
	console.log("Final result: " + JSON.stringify(result, null, 2));
}

if (userArgs[0] === 'login') {
	doLogin(userArgs[1], userArgs[2]);
} else {
	loggedin();
}

var showMetadata = function() {
	var metadata = require("./fdcmetadata").fdcmetadata;
	var dsr = metadata.showMetadata({sforce:sforce, apiVersion:"29.0"})[0];
	_.each(dsr.metadataObjects, function(mdo) {
		console.log(mdo.xmlName);
	});

//	console.log(JSON.stringify(dsr, null, 2));
};

var retrieveMetadata = function() {
	var packageTypeMembers = new sforce.Xml("PackageTypeMembers");
	packageTypeMembers.set("name", "ConnectedApp");
	packageTypeMembers.set("members", "*");

	var package = new sforce.Xml("Package");
	package.set("types", packageTypeMembers);
	package.set("version", "29.0");
		
	var retrieveRequest = new sforce.Xml("RetrieveRequest");
	retrieveRequest.set("unpackaged", package);
	var config = {
		sforce:sforce,
		retrieveRequest:retrieveRequest
	};

	var metadata = require("./fdcmetadata").fdcmetadata;
	sforce.debug.trace = true;
	var res = metadata.retrieveMetadata(config)[0];
	config.id = res.id;
    rId = res.id;
    writeKeyValue(SETTINGS, 'rid', rId);
    console.log("RiD: " + rId);
	//	apiVersion:"29.0",
	//	packageName: "",
	//	singlePackage: true,
	//	specificFiles: ["ConnectedApp"],
	//	unpackaged: package
	console.log(JSON.stringify(res, null, 2));
};

var rId;

var checkRetrieveStatus = function() {
	readKeyValue(SETTINGS, 'rid', function(data) {
		var config = {
			sforce:sforce
		};
		console.log("checkRetrieveStatus: " + JSON.stringify(data));
		var metadata = require("./fdcmetadata").fdcmetadata;
		sforce.debug.trace = true;
		config.id = data[0];
		var res = metadata.checkRetrieveStatus(config)[0];
	});
};

var checkStatus = function() {
	readKeyValue(SETTINGS, 'rid', function(data) {
		var config = {
			sforce:sforce
		};
		console.log("checkStatus: " + JSON.stringify(data));
		var metadata = require("./fdcmetadata").fdcmetadata;
		sforce.debug.trace = true;
		config.id = data[0];
		var res = metadata.checkStatus(config)[0];
		console.log("Check Status: \n" + JSON.stringify(res, null, 2));
	});
};

var listMetadata = function() {
	sforce.debug.trace = true;
	if (typeof userArgs[1] === 'undefined') {
		console.log("Enter a metadata type to list.");
	} else {
		var metadata = require("./fdcmetadata").fdcmetadata;
		var arg1 = userArgs[1];
		var lmq = new sforce.Xml("ListMetaDataQuery");
		lmq.set("type", arg1);
		var dsr = metadata.listMetadata({
				sforce:sforce, 
				queries:[
					lmq
				]
				, 
				asOfVersion:"29.0"
				
			})[0];
	//	_.each(dsr.metadataObjects, function(mdo) {
	//		console.log(mdo.xmlName);
	//	});

		console.log(JSON.stringify(dsr, null, 2));
	}
};

var showTables = function() {
	var dsr = sforce.connection.describeGlobal();
	//console.log(JSON.stringify(dsr["sobjects"]));
	var Table = require("cli-table");
	var table = new Table({
		head: [
			'API Name', 
			'Label', 
			//'Plural Label', 
			"Rows"
			]
	});
	//console.log(JSON.stringify(dsr["sobjects"], null, 2));

	var tableMap = {};
	_.each(dsr["sobjects"], function(objectDef) {
		if (userArgs[1] === 'all' || objectDef.name[0].indexOf("__c") != -1) {
			tableMap[objectDef.name[0]] = { 
					name:objectDef.name[0], 
					label:objectDef.label[0],
					//labelPlural:objectDef.labelPlural[0], 
					rows:0 
				};
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
		table.push(
			[ 
				tableMap[key].name, 
				tableMap[key].label, 
				//tableMap[key].labelPlural, 
				tableMap[key].rows 
			]);
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
		case 5:
			showMetadata();
			break;
		case 6:
			listMetadata();
			break;
		case 7:
			retrieveMetadata();
			break;
		case 8:
			checkRetrieveStatus();
			break;
		case 9:
			checkStatus();
			break;
		default:
			console.log(userArgs[0] + " is not a command I understand.");
	}
}


