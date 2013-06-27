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

	var loginUrl = 'https://login-blitz04.soma.salesforce.com/services/oauth2/authorize?display=touch'
			    + '&response_type=code&client_id=' + '3MVG9PhR6g6B7ps4obQcN0JWrnMZoxjqlknR8xCDhlW_IiDPq7Ecw02TVVxCICrucS0hb9CiuTEAJYz16c7zC'
			    + '&redirect_uri=http://localhost:3000/success';

	//var loginUrl = 'https://login.salesforce.com/services/oauth2/authorize?display=touch'
	//		    + '&response_type=code&client_id=' + '3MVG9A2kN3Bn17hupqqk7YYhDRpNfOTVzCvbaGntcvP0X2zs.ZKXLyFnavnPH9dJcKlJUKAUT0OPsKFlusKH1'
	//		    + '&redirect_uri=http://localhost:3000/success';

	//open(loginUrl);

	//return;
	//prompt.message = "Login".red;
	//prompt.start();

	/*var props = [
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
	];*/

	//prompt.get(props, function(err, result) {
	//	if (err) { return onErr(err); }
		sforce.connection.serverUrl = "https://login-blitz04.soma.salesforce.com/services/Soap/u/29.0";
		//sforce.connection.serverUrl = "https://login.salesforce.com/services/Soap/u/28.0";
		var lr = sforce.connection.login(un, pw);
		sforce.connection.init(lr.sessionId, lr.serverUrl);
		writeFile(CREDS, lr);
	//}); 
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
			readValue(CREDS,
				function (err, data) {
  					if (err) throw err;
  					lr = JSON.parse(data);
  					sforce.connection.init(lr.sessionId[0], lr.serverUrl[0]);
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

var getFieldSpec = function() {
	var fieldConfig = {};
	prompt.message = "Add Field".red;
	prompt.start();

	var props = promptdefs.validateFieldCreate(userArgs);

	var getFieldType = function(userprops) {

		//console.log("User props: " + JSON.stringify(userprops));

		if (userprops.hasType === "false") {
			userprops.props.push(promptdefs.typePrompt);
		}
		userprops.props = _.reject(userprops.props, function(prop) { return prop.name === "customobject" });
		userprops.props = _.reject(userprops.props, function(prop) { return prop.name !== "type" });

		//console.log("User props 2: " + JSON.stringify(userprops));


		prompt.get(userprops.props, function(err, result) {
			if (err) { return onErr(err); }

			//console.log("Initial result: " + JSON.stringify(result, null, 2));
			if ( result["type"] === '') {
				console.log("You must specify the field type that you want to add.");
				getFieldType(userprops);
			} else {
				fieldConfig.type = result["type"];
				//console.log("Field Config: " + JSON.stringify(fieldConfig));
				if (typeof prompts[result["type"]] === 'undefined') {
					console.log("I actually don't know that field type, can you try another?");
					getFieldType(userprops);
				} else if (result["type"] == "?") {
					//console.log(promptdefs.prompts["?"][0].description);
					getFieldType(userprops);
				} else {
					getFieldAttributes(err, result, userprops);
				}
			};
		});
	};

	var getFieldAttributes = function(err, result, userprops) {
		//console.log("New Userargs: " + JSON.stringify(userArgs));
			//console.log("FieldConfig: " + JSON.stringify(fieldConfig, null, 2));
		userprops.props = promptdefs.validateFieldCreate(userArgs);
		userprops.props = _.reject(userprops.props, function(prop) { return prop.name === "type" });
		userprops.props = _.reject(userprops.props, function(prop) { return prop.name === "table" });
		//console.log("Final props: " + JSON.stringify(userprops, null, 2));
		//prompt.get(promptdefs.prompts[result.type], function(err, result) {
		prompt.get(userprops.props[0], function(err, result) {
			//console.log("FieldConfig " + JSON.stringify(fieldConfig, null, 2));
			for (var key in result) {
				//console.log("\tKey: " + key);
				if (key != "table") fieldConfig[key] = result[key];
			}
			_.each(userArgs, function(arg) {
				var argkvp = arg.split(":");
				//console.log("\tKVO: " + argkvp);
				if (argkvp[0] !== "table") fieldConfig[argkvp[0]] = argkvp[1];
			});
			//console.log("FieldConfig: " + JSON.stringify(fieldConfig, null, 2));
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

	//console.log("Props: " + JSON.stringify(props));

  	if (props["hasTable"] === "false") {
  		//console.log("Props has no table");
  		props.props.push(promptdefs.tablePrompt);
		//console.log("Props: " + JSON.stringify(props));
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
	//console.log("Create Field Result: \n" + JSON.stringify(result[0].id[0], null, 2));
	var config = {
			sforce:sforce
	};	
	while (result[0].done[0] === "false") {
		config.id = result[0].id[0];
		result = metadata.checkStatus(config);
	}
	//console.log("Final result: " + JSON.stringify(result, null, 2));
}

/*if (userArgs[0] === 'login') {
	doLogin(userArgs[1], userArgs[2]);
} else {
	loggedin();
}*/

var showMetadata = function() {
	var metadata = require("./fdcmetadata").fdcmetadata;
	var dsr = metadata.showMetadata({sforce:sforce, apiVersion:"29.0"})[0];
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
	var res = metadata.retrieveMetadata(config)[0];
	config.id = res.id;
    rId = res.id;
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

		//console.log(JSON.stringify(dsr, null, 2));
	}
};

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

var commandLineArgs = process.argv.slice(2, process.argv.length);
var command = commandLineArgs.shift();

if (typeof command !== 'string') {
//    usage();
    process.exit(1);
}
var argList = require("./argProcessorList").argList;

// Set up the input argument processing / validation.
var argProcessorList = argList.getArgProcessorList(command); //createArgProcessorList();
var commandLineArgsMap;

//console.log("Command: " + command + 
//	"\nprocessorList: " + JSON.stringify(argProcessorList));

commandLineUtils.processArgsInteractive(commandLineArgs, argProcessorList, function (outputArgsMap) {
    commandLineArgsMap = outputArgsMap;
    //console.log("outputArgsMap: " + JSON.stringify(outputArgsMap));
    switch  (command) {
    	case 'makeapp':
    		loggedin(outputArgsMap, makeConnectedApp);
    		break;
        case 'create':
            createApp();
            break;
        case 'showtables':
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
        default:
            console.log('Unknown option: \'' + command + '\'.');
            usage(command);
            process.exit(2);
    }
});

function usage(command) {
	switch (command) {
		case "showtables":
			console.log("showtables (--all)");
			break;

	}
}
// -----
// Input argument validation / processing.
// -----

function createArgProcessorList() {
    var argProcessorList = new commandLineUtils.ArgProcessorList();

    // App type
    argProcessorList.addArgProcessor('apptype', 'Enter your application type (native, hybrid_remote, or hybrid_local):', function(appType) {
        appType = appType.trim();
        if (appType !== 'native' && appType !== 'hybrid_remote' && appType !== 'hybrid_local')
            return new commandLineUtils.ArgProcessorOutput(false, 'App type must be native, hybrid_remote, or hybrid_local.');

        return new commandLineUtils.ArgProcessorOutput(true, appType);
    });
    return argProcessorList;

    // App name
    argProcessorList.addArgProcessor('appname', 'Enter your application name:', function(appName) {
        if (appName.trim() === '')
            return new commandLineUtils.ArgProcessorOutput(false, 'Invalid value for app name: \'' + appName + '\'');
        
        return new commandLineUtils.ArgProcessorOutput(true, appName.trim());
    });

    // Target dir
    argProcessorList.addArgProcessor('targetdir', 'Enter the target directory of your app:', function(targetDir) {
        if (targetDir.trim() === '')
            return new commandLineUtils.ArgProcessorOutput(false, 'Invalid value for target dir: \'' + targetDir + '\'');
        
        return new commandLineUtils.ArgProcessorOutput(true, targetDir.trim());
    });

    // Package name
    argProcessorList.addArgProcessor('packagename', 'Enter the package name for your app (com.mycompany.my_app):', function(packageName) {
        if (packageName.trim() === '')
            return new commandLineUtils.ArgProcessorOutput(false, 'Invalid value for package name: \'' + packageName + '\'');

        packageName = packageName.trim();
        var validPackageRegExp = /^[a-z]+[a-z0-9_]*(\.[a-z]+[a-z0-9_]*)*$/;
        if (!validPackageRegExp.test(packageName)) {
            return new commandLineUtils.ArgProcessorOutput(false, '\'' + packageName + '\' is not a valid Java package name.');
        }
        
        return new commandLineUtils.ArgProcessorOutput(true, packageName);
    });

    // Apex page
    argProcessorList.addArgProcessor(
        'apexpage',
        'Enter the Apex page for your app (only applicable for hybrid_remote apps):',
        function(apexPage, argsMap) {
            if (argsMap && argsMap.apptype === 'hybrid_remote') {
                if (apexPage.trim() === '')
                    return new commandLineUtils.ArgProcessorOutput(false, 'Invalid value for Apex page: \'' + apexPage + '\'');

                return new commandLineUtils.ArgProcessorOutput(true, apexPage.trim());
            }

            // Unset any value here, as it doesn't apply for non-remote apps.
            return new commandLineUtils.ArgProcessorOutput(true, undefined);
        },
        function (argsMap) {
            return (argsMap['apptype'] === 'hybrid_remote');
        }
    );

    // Use SmartStore
    argProcessorList.addArgProcessor('usesmartstore', 'Do you want to use SmartStore in your app? [yes/NO] (\'No\' by default)', function(useSmartStore) {
        var boolUseSmartStore = (useSmartStore.trim().toLowerCase() === 'yes');
        return new commandLineUtils.ArgProcessorOutput(true, boolUseSmartStore);
    });

    return argProcessorList;
}