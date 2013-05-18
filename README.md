Initial stab at a CLI for exercising the Force.com metadata API.

Clone this guy and then in the root folder of project run

	npm link

This should make forcedotcom a runnable command.

Not many commands implemented just yet.

	forcedotcom login <username> <password>
	forcedotcom createtable 
	forcedotcom addfield
	forcedotcom addfield <tablename>
	forcedotcom showtables
	forcedotcom showtables all
	

The addfield commands initiate a series of prompts that ask for

	the tablename for the new field
	the type of the field
	various field properties depending on the type of field.

Currently the only two field types that are understood are

	Checkbox
	AutoNumber

Both are case sensitive right now.