#! /usr/bin/env node

var userArgs = process.argv.slice(2);
var sforce = require('./connection').sforce;
var webserver = require('./webserver').webserver;
var exec = require('child_process').exec;
var path = require('path');
var shellJs = require('shelljs');
var fs = require('fs');
var commandLineUtils = require('./commandLineUtils');
var outputColors = require('./outputColors');

var _ = require("underscore")._;

var CREDSFILE = ".forcedc";
var SETTINGS = ".settings";
var creds = {};

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
			//console.log("KEYVAL: " + JSON.stringify(obj) + "\n" + key  + ':' + value);
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
		//console.log("READKEYVALUE: " + JSON.stringify(obj));
		callback(obj[key]);
	});
};

var doLogin = function(un, pw) {
	//webserver.startServer();
	var open = require('open');

	//var loginUrl = 'https://https://dooder-developer-edition.na1-blitz04.t.force.com/developer/services/oauth2/authorize?display=touch'
	//		    + '&response_type=code&client_id=' + '3MVG9PhR6g6B7ps4obQcN0JWrnMZoxjqlknR8xCDhlW_IiDPq7Ecw02TVVxCICrucS0hb9CiuTEAJYz16c7zC'
	//		    + '&redirect_uri=http://localhost:3000/success';

	var loginUrl = 'https://login-blitz04.soma.salesforce.com/services/oauth2/authorize?display=touch'
			    + '&response_type=code&client_id=' + '3MVG9PhR6g6B7ps4obQcN0JWrnMZoxjqlknR8xCDhlW_IiDPq7Ecw02TVVxCICrucS0hb9CiuTEAJYz16c7zC'
			    + '&redirect_uri=http://localhost:3000/success';

	//var loginUrl = 'https://login.salesforce.com/services/oauth2/authorize?display=touch'
	//		    + '&response_type=code&client_id=' + '3MVG9A2kN3Bn17hupqqk7YYhDRpNfOTVzCvbaGntcvP0X2zs.ZKXLyFnavnPH9dJcKlJUKAUT0OPsKFlusKH1'
	//		    + '&redirect_uri=http://localhost:3000/success';

	//open(loginUrl);

	//return;
	sforce.connection.serverUrl = "https://login-blitz04.soma.salesforce.com/services/Soap/u/29.0";
	//sforce.connection.serverUrl = "https://login.salesforce.com/services/Soap/u/28.0";
	
	//sforce.connection.loginScopeHeader = {};
	//sforce.connection.loginScopeHeader.organizationId = "00DD0000000JxlU";
	//sforce.connection.loginScopeHeader.portalId = "";

	var lr = sforce.connection.login(un, pw);
	console.log("Login: " + JSON.stringify(lr, null, 2));
	if (typeof lr === 'array') {
		console.log("Error logging in: " + outputColors.red + 
			lr[0].detail[0]["sf:LoginFault"][0]["sf:exceptionMessage"] + outputColors.reset);
	} else {
		sforce.connection.init(lr.sessionId, lr.serverUrl);
		var userId = lr.userInfo[0].userId[0];
		var qr = sforce.connection.query("Select Id, Name From User_App_Data__c Where OwnerId = '" + userId + "'");
		console.log("QR: " + JSON.stringify(qr, null, 2));


		if (typeof qr[0].faultcode !== 'undefined') {
			writeFile(CREDSFILE, { lr:lr });
		} else {
			var output = "Select the App you are working on: ";
			var i = 1;
			_.each(qr.records, function(record) {
				output += "\n    " + i + ": " + record["sf:Name"];
				i++;
			})
			output += "\n";

			//console.log("Records: " + JSON.stringify(qr.records, null, 2));
			var argProcessorList = new commandLineUtils.ArgProcessorList();

		    argProcessorList.addArgProcessor('app', output, false, true, function(app) {
		        app = app.trim();

	    	    return new commandLineUtils.ArgProcessorOutput(true, app);
	    	});
	    	var commandLineArgsMap;

			commandLineUtils.processArgsInteractive([], argProcessorList, function (outputArgsMap) {
				commandLineArgsMap = outputArgsMap;
				//console.log("What app? " + JSON.stringify(commandLineArgsMap));
				var app = qr.records[commandLineArgsMap["app"] - 1];
				writeFile(CREDSFILE, { app:{ name:app["sf:Name"], id:app["sf:Id"][0] }, lr:lr });
			});
		}
	}
}

var loggedin = function(args, command) {
	var exec = require('child_process').exec;
	var args = args;
	var acommand = command;
	var child = exec('ls -a | grep ' + ".forcedc", function(err, stdout, stderr) {
    	if (err) {
    		console.log("Please run the login command and try again.");
    		return false;
		} else {
			readValue(CREDSFILE,
				function (err, data) {
  					if (err) throw err;
  					creds = JSON.parse(data);
  					sforce.connection.init(creds.lr.sessionId[0], creds.lr.serverUrl[0]);
					if (typeof acommand != 'undefined') {
						acommand(args);
					}
				}
			);

			return true;
		}
	});	
}

/*
	forcedotcom createtable name:MyTable autonumber:true label:"My Table" description:"This is a node.js CLI created table"
*/
var doCreateTable = function(args) {
	var config = {};
	//console.log("Args: " + JSON.stringify(args));
	var keys = _.keys(args);
	_.each(keys, function(key) {
		if (args[key] != null) {
			config[key] = args[key];
		}
	});
	config.sforce = sforce;
	var metadata = require("./fdcmetadata").fdcmetadata;
	var result = metadata.createCustomObject(config);
	
	//console.log("result; \n\n" + JSON.stringify(result));

	while (result[0].done[0] === "false") {
		config.id = result[0].id[0];
		result = metadata.checkStatus(config);
	}
	if (result[0].state[0] === "Error") {
		console.log(outputColors.red + result[0].statusCode[0] + "\n" + outputColors.yellow + result[0].message[0] + outputColors.reset);
	} else {
		console.log("Table created successfully.");
	}
}

var doDeleteTable = function(args) {
	var config = {};
	config.sforce = sforce;
	var fullName = args.name;
	if (fullName.substring(fullName.length - 3) !== "__c")  {
		fullName += "__c";
	}
	config["name"] = fullName;

	var metadata = require("./fdcmetadata").fdcmetadata;
	var result = metadata.deleteCustomObject(config);

	while (result[0].done[0] === "false") {
		config.id = result[0].id[0];
		result = metadata.checkStatus(config);
	}
	if (result[0].state[0] === "Error") {
		console.log(outputColors.red + result[0].statusCode[0] + "\n" + outputColors.yellow + result[0].message[0] + outputColors.reset);
	} else {
		console.log("Table deleted successfully.");
	}
};

var doCreateField = function(args) {
	var config = {
			sforce:sforce,
			args:args
	};	
	var metadata = require("./fdcmetadata").fdcmetadata;
	var result = metadata.createCustomField(config);
	//console.log("Create Field Result: \n" + JSON.stringify(result[0].id[0], null, 2));
	while (result[0].done[0] === "false") {
		config.id = result[0].id[0];
		result = metadata.checkStatus(config);
	}

	if (typeof result[0].statusCode !== "undefined") {
		console.log(outputColors.red + result[0].messages[0].problem[0] + outputColors.reset);
	} else {
		console.log("Field created successfully.");
	}
}

var showMetadata = function() {
	var metadata = require("./fdcmetadata").fdcmetadata;
	var dsr = metadata.showMetadata({sforce:sforce, apiVersion:"28.0"})[0];
	_.each(dsr.metadataObjects, function(mdo) {
		//console.log(mdo.xmlName);
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
	
	var result = metadata.retrieveMetadata(config);

	config.id = result.id;
    rId = result.id;
   	while (result[0].done[0] === "false") {
		config.id = result[0].id[0];
		result = metadata.checkStatus(config);
	}
	
	config.id = result[0].id[0];

	result = metadata.checkRetrieveStatus(config);

	if (typeof result[0].messages[0].problem !== "undefined") {
		console.log(outputColors.red + result[0].messages[0].problem[0] + outputColors.reset);
	} else {
		console.log("Table created successfully.");
	}

    writeKeyValue(SETTINGS, 'rid', rId);
    //console.log("RiD: " + rId);
	//	apiVersion:"29.0",
	//	packageName: "",
	//	singlePackage: true,
	//	specificFiles: ["ConnectedApp"],
	//	unpackaged: package
	//console.log(JSON.stringify(res, null, 2));
};

var rId;

var checkRetrieveStatus = function() {
	readKeyValue(SETTINGS, 'rid', function(data) {
		var config = {
			sforce:sforce
		};
		//console.log("checkRetrieveStatus: " + JSON.stringify(data));
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
		//console.log("checkStatus: " + JSON.stringify(data));
		var metadata = require("./fdcmetadata").fdcmetadata;
		sforce.debug.trace = true;
		config.id = data[0];
		var res = metadata.checkStatus(config)[0];
		//console.log("Check Status: \n" + JSON.stringify(res, null, 2));
	});
};

var listMetadata = function() {
	//sforce.debug.trace = true;
	//if (typeof userArgs[1] === 'undefined') {
	//	console.log("Enter a metadata type to list.");
	//} else {
		var metadata = require("./fdcmetadata").fdcmetadata;
		var arg1 = "ConnectedApp";
		var lmq = new sforce.Xml("ListMetaDataQuery");
		lmq.set("type", arg1);
		console.log("Connected Apps:");
		var dsr = metadata.listMetadata({
			sforce:sforce, 
			queries:[ lmq ], 
			asOfVersion:"29.0"	
		});
		_.each(dsr, function(item) {
			console.log("  " + item.fullName[0]);
		});
		//console.log("Metadata: " + JSON.stringify(dsr, null, 2));
	//}
};

var doQuery = function(args) {
	loggedin(false);
	var qr = sforce.connection.query(args.soql);
	console.log(JSON.stringify(qr, null, 2));

	var Table = require("cli-table");
	if (qr.size > 0) {
		var heads = [];
		var colWidths = [];
		for (var key in qr.records[0]) {
			//console.log("Key: " + key + "\nValue: " + qr.records[0][key]);
			if (key !== '$' && key !== 'sf:type') {
				heads.push(key);
				colWidths.push(30);
			}
		};
		var table = new Table({
			head: heads,
			colWidths: colWidths
		})
		//console.log("Number of heads: " + heads.length);

		_.each(qr.records, function(record) {
			var d = [];
			for (var i=0;i<heads.length;i++) {
				if (heads[i] === "sf:Id") {
					//console.log("pushing " + record[heads[i]][0]);
					d.push(record[heads[i]][0]);
				} else {
					//console.log("pushing " + record[heads[i]]);
					d.push(record[heads[i]]);
				}
			}
			table.push(d);
		})
		//console.log("heads: " + JSON.stringify(table.head, null, 2));

		console.log(table.toString());
	} else {
		console.log("Query returned no rows.");
	}
}

var showTables = function(args) {
	//console.log("showtables");
	loggedin(false);
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
		if (args.all === 'true' || objectDef.name[0].indexOf("__c") != -1) {
			tableMap[objectDef.name[0]] = { 
					name:objectDef.name[0], 
					label:objectDef.label[0],
					//labelPlural:objectDef.labelPlural[0], 
					rows:0 
				};
			//table.push([objectDef.name[0], objectDef.label[0], objectDef.labelPlural[0]]);
		}
	});
	//console.log("Got tables");

	for (var key in tableMap) {
		//console.log("Getting Row count for " + key);
		if (args.all !== 'all') {
			try {
				var res = sforce.connection.query("Select Count() From " + key);
				tableMap[key].rows = res.size;
			} catch(error) { }
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

var doShowFields = function(args) {
	//console.log("showtables");
	loggedin(false);
	var dsr = sforce.connection.describeSObject(args.tablename);
	//console.log(JSON.stringify(dsr.fields, null, 2));
	var Table = require("cli-table");
	var table = new Table({
		head: [
			'API Name', 
			'Label', 
			//'Plural Label', 
			"Type"
			]
	});
	//console.log(JSON.stringify(dsr["sobjects"], null, 2));

	var tableMap = {};
	_.each(dsr.fields, function(field) {
			table.push([field.name[0], field.label[0], field.type[0]]);
	});
	//console.log("Got tables");

	console.log(table.toString());
}

var doNewApp = function(args) {
	console.log("Creds: " + JSON.stringify(creds.lr, null, 2));
	// Make sure we have all required fields, and if not, set default values
	if (args.contactEmail === "default")
		args.contactEmail = creds.lr.userInfo[0].userEmail[0];
	if (args.callbackUrl === "default") 
		args.callbackUrl = "sfdc://success";

	args["oauthConfig"] = new sforce.Xml("oauthConfig");
	args.oauthConfig.set("callbackUrl", args.callbackUrl);
	args.oauthConfig.set("scopes", args.scopes);

	delete args.callbackUrl;
	delete args.scopes;

	sforce.debug.trace = true;
	var config = {
			sforce:sforce,
			args:args
	};	

	config.object = "ConnectedApp";
	
	var metadata = require("./fdcmetadata").fdcmetadata;

	var result = metadata.createMetadata(config);
	console.log("Result: \n" + JSON.stringify(result, null, 2));

	while (result[0].done[0] === "false") {
		config.id = result[0].id[0];
		result = metadata.checkStatus(config);
	}

	if (typeof result[0].statusCode !== "undefined") {
		console.log(outputColors.red + result[0].messages[0].problem[0] + outputColors.reset);
	} else {
		console.log("App created successfully.");
	}	
};

var doDeleteApp = function(args) {
	var config = {};
	config.sforce = sforce;
	var fullName = args.name;
	
	config["name"] = fullName;
	config.object = "ConnectedApp";

	var metadata = require("./fdcmetadata").fdcmetadata;
	var result = metadata.deleteMetadata(config);

	while (result[0].done[0] === "false") {
		config.id = result[0].id[0];
		result = metadata.checkStatus(config);
	}
	if (result[0].state[0] === "Error") {
		console.log(outputColors.red + result[0].statusCode[0] + "\n" + outputColors.yellow + result[0].message[0] + outputColors.reset);
	} else {
		console.log("App deleted successfully.");
	}
};


/* Deprecated for doNewApp
var makeConnectedApp = function(args) {
	//console.log("\n\nArgs: " + JSON.stringify(args));

	var pkg = require("./packaging.js").packaging;
	pkg.cleanUp();
	pkg.makeConnectedApp(args, function(data) {
		sforce.debug.trace = true;

		//console.log(data);
		var config = {
				sforce:sforce
			};
		
		// Temp, just read a working zip
		//var data = fs.readFileSync(process.cwd() + "/unpackaged.zip", {encoding:"base64"});

		var metadata = require("./fdcmetadata").fdcmetadata;
		//sforce.debug.trace = true;
		config.ZipFile = data;
		var result = metadata.deployMetadata(config);	
		//console.log("Result: " + JSON.stringify(result));
		while (result[0].done[0] === "false") {
			config.id = result[0].id[0];
			result = metadata.checkStatus(config);
			//console.log("\n\nResult: " + JSON.stringify(result, null, 2));
		}
		result = metadata.checkDeployStatus(config);
		
		//console.log("Deploy Status: " + "\n" + JSON.stringify(result, null, 2));

		if (result[0].success[0] === "false") {
			console.log(outputColors.red + result[0].messages[0].problem[0] + outputColors.reset);
		} else {
			console.log("Deployment successful.");
			//pkg.cleanUp();
		}

	});
}
*/

var doShowApps = function(args) {

};

var doPull = function(args) {
	console.log("Not yet implemented...");
}

var doPush = function(args) {
	console.log("Push not yet implemented...");
}

var commandLineArgs = process.argv.slice(2, process.argv.length);
var command = commandLineArgs.shift();

if (typeof command !== 'string') {
    usage();
    process.exit(1);
}
var argList = require("./argProcessorList").argList;
var argProcessorList;

// Set up the input argument processing / validation.
if (command === 'addfield') {
	var fieldType = commandLineArgs.shift();
	console.log("field type: " + fieldType);
	argProcessorList = argList.getArgProcessorList(fieldType.toLowerCase());
} else {
	argProcessorList = argList.getArgProcessorList(command); //createArgProcessorList();	
}
var commandLineArgsMap;

//console.log("Command: " + command + 
//	"\nprocessorList: " + JSON.stringify(argProcessorList));

commandLineUtils.processArgsInteractive(commandLineArgs, argProcessorList, function (outputArgsMap) {
    commandLineArgsMap = outputArgsMap;
    //console.log("outputArgsMap: " + JSON.stringify(outputArgsMap));
    switch  (command) {
    	//case 'makeapp':
    	//	loggedin(outputArgsMap, makeConnectedApp);
    	//	break;
    	case 'deleteapp':
    		loggedin(outputArgsMap, doDeleteApp);
    		break;
        case 'createapp':
            loggedin(outputArgsMap, doNewApp);
            break;
        case 'tables':
       		loggedin(outputArgsMap, showTables);
        	break;
        case "createtable":
        	loggedin(outputArgsMap, doCreateTable);
        	break;
        case "deletetable":
        	loggedin(outputArgsMap, doDeleteTable);
        	break;
       	case "login":
       		doLogin(outputArgsMap.username, outputArgsMap.password);
       		break;
       	case "query":
       		loggedin(outputArgsMap, doQuery);
       		break;
       	case 'addfield':
       		loggedin(outputArgsMap, doCreateField);
       		break;
       	case "pull":
       		loggedin(outputArgsMap, doPull);
       		break;
       	case "push":
       		loggedin(outputArgsMap, doPush);
       		break;
       	case "showfields":
       		loggedin(outputArgsMap, doShowFields);
       		break;
       	case "apps":
       		loggedin(outputArgsMap, listMetadata);
       		break;
       	case "getmetadata":
       		loggedin(outputArgsMap, retrieveMetadata);
       		break;
        default:
            console.log('Unknown option: \'' + command + '\'.');
            usage(command);
            process.exit(2);
    }
});


function usage(command) {



var usage_prompt = 
	"Usage: force <command> [arguments] [options]         edit the given files\n" +
	"\n" + 
	"Commands:\n" +
	"  login \t[--username:<username>] [--password:<password>]\n" + 
	"  showtables \t[--all:<true, false>]\n" + 
	"  createtable \t[--tablename:<tablename>] [options]\n" + 
	"  deletetable \t[--tablename:<tablename>]\n" +
	"  query \t[--soql:<soql query>]\n" +
	"  addfield \t<fieldtype> [options]\n" +
	"  newapp \t[--name:<name>] [options]\n" + 
	"  deleteapp \t[--name:<name>]\n" + 
	"  apps \n\n" + 
	"Arguments:\n" + 
  	"  -n or --new-window:  Open a new window\n" +
  	"  -h or --help:        Show help (this message) and exit\n" +
  	"  -v or --version:     Show version and exit\n";




	switch (command) {
		case "showtables":
			//console.log("showtables (--all)");
			break;
		default:
			console.log("usage: " + usage_prompt);

	}
}
