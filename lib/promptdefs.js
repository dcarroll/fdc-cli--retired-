var promptdefs = new Object()
var _ = require("underscore")._;

promptdefs.tablePrompt = { 	
	name: "customobject",
	description: "What table do we add the field to?",
	required: "true"
};

promptdefs.typePrompt = { 	
	name: "type",
	description: "What type of field?",
	required: "true"
};

promptdefs.autoNumberFieldPrompts = [ 
		{ 	name: "label",
			description: "Enter the field label",
			required: "true"
		}, 
		{ 
			name: "displayFormat",
			description: "Display format?",
			default: "A-{00000}",
			required: "true"
		}, 
		{ 
			name: "startingNumber",
			description: "Enter a starting number",
			default: "1",
			required: "false"
		}, 
		{ 
			name: "externalId",
			description: "Is this an external id?",
			default: "false",
			required: "false"
		},
		{ 
			name: "description",
			description: "Enter and optional description"
		} 
	];

promptdefs.checkBoxFieldPrompts = [ 
		{
			name: "label",
			description: "Enter the field label",
			required: "true"
		},
		{
			name:"defaultValue",
			description:"Enter an optional default value",
			default: "false",
			required: "false"
		},
		{ 
			name: "description",
			description: "Enter and optional description",
			required: "false"
		} 
	];

promptdefs.fieldHelpPrompts = [
		{
			name: "help",
			description: "AutoNumber, Checkbox"
		}
	];

promptdefs.prompts = { 
	"AutoNumber":promptdefs.autoNumberFieldPrompts, 
	"Checkbox":promptdefs.checkBoxFieldPrompts,
	"?":promptdefs.fieldHelpPrompts
	};

promptdefs.arrayToObject = function(arr) {
	var result = {};
	//console.log("\nArr: " + JSON.stringify(arr, null, 2) + "\n");
	_.each(arr, function(el) {
		//console.log("EL: " + (typeof el));
		if (el.indexOf(":") > -1) {
			var elkvp = el.split(":");
			result[elkvp[0]] = elkvp[1];
		}
	});
	return result;
}

promptdefs.validateFieldCreate = function(args) {
	var userArgs = this.arrayToObject(args);
	var newProps = [];
	var result = { props:newProps };
	
	/*if ( typeof userArgs["customobject"] === 'undefined') {
		result["hasTable"] = "false";
	}
	if ( typeof userArgs["type"] === 'undefined') {
		result["hasType"] = "false";
	}*/

	//console.log("args: " + JSON.stringify(userArgs));

	result["hasTable"] = (typeof userArgs.table === 'undefined') ? "false" : "true";
	result["hasType"] = (typeof userArgs.type === 'undefined') ? "false" : "true";

	if (result.hasType === "true") {
		var fprops = promptdefs.prompts[userArgs["type"]];
		if (result.hasTable === "false") fprops.push(promptdefs.tablePrompt);
		_.each(fprops, function(fprop) {
			//console.log("fprop name: " + fprop.name);
			if (typeof userArgs[fprop.name] === 'undefined') {
				result.props.push(fprop);
			}
		});
	} 
	//console.log("Result: " + JSON.stringify(result));
	return result;
};

exports.promptdefs = promptdefs;
