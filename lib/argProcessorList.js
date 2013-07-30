var argList = {};
var commandLineUtils = require('./commandLineUtils');


argList.getArgProcessorList = function(command) {
	var result;
	switch (command) {
		case "tables":
			result = argList.createShowTablesProcessorList();
			break;
        case "login":
            result = argList.createLoginProcessorList();
            break;
        case "createapp":
            result = argList.createAppProcessorList();
            break;
        case "deleteapp":
            result = argList.createDeleteAppProcessorList();
            break;
        case "createtable":
            result = argList.createCreateTableProcessorList();
            break;
        case "deletetable":
            result = argList.createDeleteTableProcessorList();
            break;
        case "makeapp":
            result = argList.createMakeConnectedAppProcessorList();
            break;
        case "query":
            result = argList.createQueryProcessorList();
            break;
        case "pull":
            result = argList.createPullProcessorList();
            break;
        case "push":
            result = argList.createPushProcessorList();
            break;
        case "showfields":
            result = argList.createShowFieldsProcessorList();
            break;
        case "autonumber":
            result = argList.createAutoNumberProcessorList();
            break;
        case "text":
            result = argList.createTextProcessorList();
            break;
        case "number":
            result = argList.createNumberProcessorList();
            break;
		default:
			result = new commandLineUtils.ArgProcessorList();
			break;
	}
	return result;
}

// -----
// Input argument validation / processing.
// -----
argList.createLoginProcessorList = function() {
    var argProcessorList = new commandLineUtils.ArgProcessorList();

    // username
    argProcessorList.addArgProcessor('username', 'Enter your username:', false, true, function(username) {
        username = username.trim();
        return new commandLineUtils.ArgProcessorOutput(true, username);
    });

    // password
    argProcessorList.addArgProcessor('password', 'Enter your password:', true, true, function(password) {
        password = password.trim();
        return new commandLineUtils.ArgProcessorOutput(true, password);
    });

    return argProcessorList;
};

argList.createShowTablesProcessorList = function() {
    var argProcessorList = new commandLineUtils.ArgProcessorList();

    // App type
    argProcessorList.addArgProcessor('all', 'Show all tables? (--all=true):', false, false, function(all) {
        // This is an optional value
        //console.log("arg type: " + (typeof all));
        if (typeof all != 'object') {
            all = all.trim();
            //console.log("Arg validation: " + all);
        }
        return new commandLineUtils.ArgProcessorOutput(true);
    });

    return argProcessorList;
};

argList.createShowFieldsProcessorList = function() {
    var argProcessorList = new commandLineUtils.ArgProcessorList();

    // App type
    argProcessorList.addArgProcessor('tablename', 'What table:', false, true, function(tablename) {
        // This is an optional value
        //console.log("arg type: " + (typeof all));
        if (typeof tablename != 'object') {
            tablename = tablename.trim();
            //console.log("Arg validation: " + all);
        }
        return new commandLineUtils.ArgProcessorOutput(true, tablename);
    });

    return argProcessorList;
};

argList.createLoginProcessorList = function() {
    var argProcessorList = new commandLineUtils.ArgProcessorList();

    // username
    argProcessorList.addArgProcessor('username', 'Enter your username:', false, true, function(username) {
        username = username.trim();
        return new commandLineUtils.ArgProcessorOutput(true, username);
    });

    // password
    argProcessorList.addArgProcessor('password', 'Enter your password:', true, true, function(password) {
        password = password.trim();
        return new commandLineUtils.ArgProcessorOutput(true, password);
    });

    return argProcessorList;
};

argList.createQueryProcessorList = function() {
    var argProcessorList = new commandLineUtils.ArgProcessorList();

    // App type
    argProcessorList.addArgProcessor('soql', 'Enter your query:', false, true, function(soql) {
        // This is an optional value
        //console.log("arg type: " + (typeof all));
        if (typeof soql != 'object') {
            soql = soql.trim();
            //console.log("Arg validation: " + all);
        }
        return new commandLineUtils.ArgProcessorOutput(true, soql);
    });

    return argProcessorList;
};

argList.createPullProcessorList = function() {
    var argProcessorList = new commandLineUtils.ArgProcessorList();

    return argProcessorList;
};

argList.createPushProcessorList = function() {
    var argProcessorList = new commandLineUtils.ArgProcessorList();

    return argProcessorList;
};

argList.createDeleteTableProcessorList = function() {
    var argProcessorList = new commandLineUtils.ArgProcessorList();

    // App type
    argProcessorList.addArgProcessor('name', 'Tablename to delete:', false, true, function(name) {
        if (typeof name != 'object') {
            name = name.trim();
            //console.log("Arg validation: " + all);
        }
        return new commandLineUtils.ArgProcessorOutput(true, name);
    });

    argProcessorList.addArgProcessor('confirm', 'Please type "DELETE" to confirm:', false, true, function(confirm) {
        confirm = confirm.trim();
        if (confirm !== 'DELETE') {
            return new commandLineUtils.ArgProcessorOutput(false, "Enter 'DELETE' to confirm, Ctrl-c to cancel");
        } else {
            return new commandLineUtils.ArgProcessorOutput(true, confirm);
        }
    });

    return argProcessorList;
};

argList.createDeleteAppProcessorList = function() {
    var argProcessorList = new commandLineUtils.ArgProcessorList();

    // App type
    argProcessorList.addArgProcessor('name', 'App to delete:', false, true, function(name) {
        if (typeof name != 'object') {
            name = name.trim();
            if (name.length === 0) {
                return new commandLineUtils.ArgProcessorOutput(false, "Enter the name of the app to delete.");
            }
        }
        return new commandLineUtils.ArgProcessorOutput(true, name);
    });

    argProcessorList.addArgProcessor('confirm', 'Please type "DELETE" to confirm:', false, true, function(confirm) {
        confirm = confirm.trim();
        if (confirm !== 'DELETE') {
            return new commandLineUtils.ArgProcessorOutput(false, "Enter 'DELETE' to confirm, Ctrl-c to cancel");
        } else {
            return new commandLineUtils.ArgProcessorOutput(true, confirm);
        }
    });

    return argProcessorList;
};

argList.createMakeConnectedAppProcessorList = function() {
    var argProcessorList = new commandLineUtils.ArgProcessorList();

    // App type
    argProcessorList.addArgProcessor('name', 'Connected App name:', false, true, function(name) {
        if (typeof name != 'object') {
            name = name.trim();
            //console.log("Arg validation: " + all);
        }
        return new commandLineUtils.ArgProcessorOutput(true, name);
    });

    argProcessorList.addArgProcessor('contactEmail', 'Contact email:', false, true, function(contactEmail) {
        if (typeof name != 'object') {
            contactEmail = contactEmail.trim();
        }
        return new commandLineUtils.ArgProcessorOutput(true, contactEmail);
    });

    argProcessorList.addArgProcessor('callbackUrl', 'Callback url:', false, true, function(callbackUrl) {
        if (typeof name != 'object') {
            callbackUrl = callbackUrl.trim();
        }
        return new commandLineUtils.ArgProcessorOutput(true, callbackUrl);
    });

    argProcessorList.addArgProcessor('scopes', 'OAuth scopes:', false, false, function(scopes) {
        if (typeof scopes != 'object') {
            scopes = scopes.trim();
        } else if (scopes == null) {
            scopes = "Full";
        }
        return new commandLineUtils.ArgProcessorOutput(true, scopes);
    });

    argProcessorList.addArgProcessor('version', 'App version:', false, false, function(version) {
        if (typeof version != 'object') {
            version = version.trim();
        } else if (version == null) {
            version = "1.0";
        }
        return new commandLineUtils.ArgProcessorOutput(true, version);
    });

    return argProcessorList;
};

argList.createAppProcessorList = function() {
    var argProcessorList = new commandLineUtils.ArgProcessorList();

    // App type
    argProcessorList.addArgProcessor('name', 'Connected App name:', false, true, function(name) {
        if (typeof name != 'object') {
            name = name.trim();
            if (name.length === 0) {
                return new commandLineUtils.ArgProcessorOutput(false, "You must specify a name for your app.");
            }
        }
        return new commandLineUtils.ArgProcessorOutput(true, name);
    });

    argProcessorList.addArgProcessor('contactEmail', 'Contact email:', false, true, function(contactEmail) {
        if (typeof contactEmail != 'object') {
            contactEmail = contactEmail.trim();
            if (contactEmail.length === 0) {
                contactEmail = "default";
            }
        }
        return new commandLineUtils.ArgProcessorOutput(true, contactEmail);
    });

    argProcessorList.addArgProcessor('callbackUrl', 'Callback url:', false, true, function(callbackUrl) {
        if (typeof callbackUrl != 'object') {
            callbackUrl = callbackUrl.trim();
            if (callbackUrl.length === 0) {
                callbackUrl = "default";
            }
        }
        return new commandLineUtils.ArgProcessorOutput(true, callbackUrl);
    });

    argProcessorList.addArgProcessor('scopes', 'OAuth scopes:', false, false, function(scopes) {
        if (typeof scopes != 'object') {
            scopes = scopes.trim();
        } else if (scopes == null) {
            scopes = "Full";
        }
        return new commandLineUtils.ArgProcessorOutput(true, scopes);
    });

    argProcessorList.addArgProcessor('version', 'App version:', false, false, function(version) {
        if (typeof version != 'object') {
            version = version.trim();
        } else if (version == null) {
            version = "1.0";
        }
        return new commandLineUtils.ArgProcessorOutput(true, version);
    });

    return argProcessorList;
};

argList.createCommonFieldProcessorList = function() {
    // App name
    var argProcessorList = new commandLineUtils.ArgProcessorList();

    // table name - required
    argProcessorList.addArgProcessor('tablename', 'Table name:', false, true, function(tablename) {
        tablename = tablename.trim();
        return new commandLineUtils.ArgProcessorOutput(true, tablename);
    });

    // field name - required
    argProcessorList.addArgProcessor('name', 'Field name:', false, true, function(name) {
        name = name.trim();
        return new commandLineUtils.ArgProcessorOutput(true, name);
    });

    // field name - required
    argProcessorList.addArgProcessor('label', 'Field label:', false, true, function(label) {
        label = label.trim();
        return new commandLineUtils.ArgProcessorOutput(true, label);
    });
    // field description - required
    argProcessorList.addArgProcessor('description', 'Field description:', false, false, function(description) {
        if (typeof description !== 'object') {
            description = description.trim();
        }
        return new commandLineUtils.ArgProcessorOutput(true, description);
    });

    return argProcessorList;
}

argList.createAutoNumberProcessorList = function() {
    // App name
    var argProcessorList = argList.createCommonFieldProcessorList();

    // field starting number - required
    argProcessorList.addArgProcessor('type', 'Field stype:', false, false, function(type) {
        return new commandLineUtils.ArgProcessorOutput(true, "AutoNumber");
    });
    // field starting number - required
    argProcessorList.addArgProcessor('startingNumber', 'Field starting number:', false, false, function(startingnumber) {
        if (typeof startingnumber !== 'object') {
            startingnumber = startingnumber.trim();
        } else if (startingnumber == null) {
            startingnumber = "0";
        }
        return new commandLineUtils.ArgProcessorOutput(true, startingnumber);
    });
    // field starting number - required
    argProcessorList.addArgProcessor('displayFormat', 'Field display format:', false, false, function(displayFormat) {
        if (typeof displayFormat !== 'object') {
            displayFormat = displayFormat.trim();
        } else if (displayFormat === null) {
        return new commandLineUtils.ArgProcessorOutput(true, null);
        }
        return new commandLineUtils.ArgProcessorOutput(true, displayFormat);
    });
    // field starting number - required
    argProcessorList.addArgProcessor('externalId', 'Field is external Id:', false, false, function(externalId) {
        if (typeof externalId !== 'object') {
            externalId = externalId.trim();
            if (externalId.toString().toLocaleLowerCase() !== 'false' &&
                externalId.toString().toLocaleLowerCase() !== 'true') {
                 return new commandLineUtils.ArgProcessorOutput(false, "External Id value should be true or false");   
            }
        } else {
            externalId = "false";
        }
        return new commandLineUtils.ArgProcessorOutput(true, externalId);
    });

    return argProcessorList;
};

argList.createTextProcessorList = function() {
    // App name
    var argProcessorList = argList.createCommonFieldProcessorList();

    // field starting number - required
    argProcessorList.addArgProcessor('type', 'Field type:', false, false, function(type) {
        return new commandLineUtils.ArgProcessorOutput(true, "Text");
    });
    // field starting number - required
    argProcessorList.addArgProcessor('length', 'Field length:', false, true, function(length) {
        if (typeof length !== 'object') {
            length = length.trim();
        } else if (length == null) {
            length = "50";
        }
        return new commandLineUtils.ArgProcessorOutput(true, length);
    });
    // field starting number - required
    argProcessorList.addArgProcessor('required', 'Field display format:', false, false, function(required) {
        if (typeof required !== 'object') {
            required = required.trim();
            if (required.toString().toLocaleLowerCase() !== 'false' &&
                required.toString().toLocaleLowerCase() !== 'true') {
                 return new commandLineUtils.ArgProcessorOutput(false, "Required value should be true or false");   
            }
         } else if (required === null) {
            required = "false"
        }
        return new commandLineUtils.ArgProcessorOutput(true, required);
    });
    // field starting number - required
    argProcessorList.addArgProcessor('unique', 'Field display format:', false, false, function(unique) {
        if (typeof unique !== 'object') {
            unique = unique.trim();
            if (unique.toString().toLocaleLowerCase() !== 'false' &&
                unique.toString().toLocaleLowerCase() !== 'true') {
                 return new commandLineUtils.ArgProcessorOutput(false, "Unique value should be true or false");   
            }
         } else if (unique === null) {
            unique = "false"
        }
        return new commandLineUtils.ArgProcessorOutput(true, unique);
    });
    // field starting number - required
    argProcessorList.addArgProcessor('externalId', 'Field is external Id:', false, false, function(externalId) {
        if (typeof externalId !== 'object') {
            externalId = externalId.trim();
            if (externalId.toString().toLocaleLowerCase() !== 'false' &&
                externalId.toString().toLocaleLowerCase() !== 'true') {
                 return new commandLineUtils.ArgProcessorOutput(false, "External Id value should be true or false");   
            }
        } else {
            externalId = "false";
        }
        return new commandLineUtils.ArgProcessorOutput(true, externalId);
    });

    return argProcessorList;
};

argList.createNumberProcessorList = function() {
    // App name
    var argProcessorList = argList.createCommonFieldProcessorList();

    // field starting number - required
    argProcessorList.addArgProcessor('type', 'Field type:', false, false, function(type) {
        return new commandLineUtils.ArgProcessorOutput(true, "Number");
    });
    // field starting number - required
    argProcessorList.addArgProcessor('length', 'Field length:', false, false, function(length) {
        if (typeof length !== 'object') {
            length = length.trim();
        } else if (length == null) {
            length = "50";
        }
        return new commandLineUtils.ArgProcessorOutput(true, length);
    });
    // field starting number - required
    argProcessorList.addArgProcessor('precision', 'Field length:', false, false, function(precision) {
        if (typeof precision !== 'object') {
            precision = precision.trim();
        } else if (precision == null) {
            precision = "0";
        }
        return new commandLineUtils.ArgProcessorOutput(true, precision);
    });
    // field starting number - required
    argProcessorList.addArgProcessor('required', 'Field display format:', false, false, function(required) {
        if (typeof required !== 'object') {
            required = required.trim();
            if (required.toString().toLocaleLowerCase() !== 'false' &&
                required.toString().toLocaleLowerCase() !== 'true') {
                 return new commandLineUtils.ArgProcessorOutput(false, "Required value should be true or false");   
            }
         } else if (required === null) {
            required = "false"
        }
        return new commandLineUtils.ArgProcessorOutput(true, required);
    });
    // field starting number - required
    argProcessorList.addArgProcessor('unique', 'Field display format:', false, false, function(unique) {
        if (typeof unique !== 'object') {
            unique = unique.trim();
            if (unique.toString().toLocaleLowerCase() !== 'false' &&
                unique.toString().toLocaleLowerCase() !== 'true') {
                 return new commandLineUtils.ArgProcessorOutput(false, "Unique value should be true or false");   
            }
         } else if (unique === null) {
            unique = "false"
        }
        return new commandLineUtils.ArgProcessorOutput(true, unique);
    });
    // field starting number - required
    argProcessorList.addArgProcessor('externalId', 'Field is external Id:', false, false, function(externalId) {
        if (typeof externalId !== 'object') {
            externalId = externalId.trim();
            if (externalId.toString().toLocaleLowerCase() !== 'false' &&
                externalId.toString().toLocaleLowerCase() !== 'true') {
                 return new commandLineUtils.ArgProcessorOutput(false, "External Id value should be true or false");   
            }
        } else {
            externalId = "false";
        }
        return new commandLineUtils.ArgProcessorOutput(true, externalId);
    });

    return argProcessorList;
};

argList.createCreateTableProcessorList = function() {
    // App name
    var argProcessorList = new commandLineUtils.ArgProcessorList();

    // table name - required
    argProcessorList.addArgProcessor('name', 'Table name:', false, true, function(name) {
        name = name.trim();
        return new commandLineUtils.ArgProcessorOutput(true, name);
    });

    // deployment status - optional defaults to deployed
    argProcessorList.addArgProcessor('deploymentStatus', 'Deployment Status:', false, false, function(deploymentStatus) {
        if (typeof deploymentStatus !== 'object') {
            deploymentStatus = deploymentStatus.trim();
            //console.log("deploymentStatus: " + deploymentStatus);
            if (deploymentStatus.toLocaleLowerCase() !== "deployed" &&
                deploymentStatus.toLocaleLowerCase() != "indevelopment") {
                return new commandLineUtils.ArgProcessorOutput(false, "Deployment status should be Deployed or InDevelopment");
            }
        } else if (deploymentStatus == null) {
            deploymentStatus = "Deployed";
        }
        //console.log("deploymentStatus: " + deploymentStatus);
        return new commandLineUtils.ArgProcessorOutput(true, deploymentStatus);
    });

    // description - optional defaults to nothing
    argProcessorList.addArgProcessor('description', 'Description:', false, false, function(description) {
        if (typeof description !== 'object') {
            description = description.trim();
        }
            return new commandLineUtils.ArgProcessorOutput(true, description);
    });

    // enable feeds - optional defaults to false
    argProcessorList.addArgProcessor('enableFeeds', 'Enable feeds:', false, false, function(enableFeeds) {
        if (typeof enableFeeds !== 'object') {
            enableFeeds = enableFeeds.trim();
        }
            return new commandLineUtils.ArgProcessorOutput(true, enableFeeds);
    });

    // enable reports - optional defaults to false
    argProcessorList.addArgProcessor('enableReports', 'Enable reporting:', false, false, function(enableReports) {
        if (typeof enableReports !== 'object') {
            enableReports = enableReports.trim();
        }
            return new commandLineUtils.ArgProcessorOutput(true, enableReports);
    });

    // enable history - optional defaults to false
    argProcessorList.addArgProcessor('enableHistory', 'Enable history tracking:', false, false, function(enableHistory) {
        if (typeof enableHistory !== 'object') {
            enableHistory = enableHistory.trim();
        }
            return new commandLineUtils.ArgProcessorOutput(true, enableHistory);
    });

    return argProcessorList;
}

exports.argList = argList;
