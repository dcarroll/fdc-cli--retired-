var promptdefs = new Object()


promptdefs.autoNumberFieldPrompts = [ 
		{ 	name: "label",
			description: "Enter the field label" 
		}, 
		{ 
			name: "displayFormat",
			description: "Display format?",
			default: "A-{00000}"
		}, 
		{ 
			name: "startingNumber",
			description: "Enter a starting number",
			default: "1"
		}, 
		{ 
			name: "externalId",
			description: "Is this an external id?",
			default: "false"
		},
		{ 
			name: "description",
			description: "Enter and optional description"
		} 
	];

promptdefs.checkBoxFieldPrompts = [ 
		{
			name: "label",
			description: "Enter the field label"
		},
		{
			name:"defaultValue",
			description:"Enter an optional default value",
			default: "false"
		},
		{ 
			name: "description",
			description: "Enter and optional description"
		} 
	];

promptdefs.prompts = { "AutoNumber":promptdefs.autoNumberFieldPrompts, "Checkbox":promptdefs.checkBoxFieldPrompts };

exports.promptdefs = promptdefs;
