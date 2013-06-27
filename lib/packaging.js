var packaging = {};
var AdmZip = require("adm-zip");
var _ = require("underscore")._;
var fs = require('fs');
var currentDir = process.cwd();

packaging.cleanUp = function() {
	var rmdir = function(dir) {
		var path = require("path");
		var list = fs.readdirSync(dir);
		for(var i = 0; i < list.length; i++) {
			var filename = path.join(dir, list[i]);
			var stat = fs.statSync(filename);
		
			if(filename == "." || filename == "..") {
				// pass these files
			} else if(stat.isDirectory()) {
				// rmdir recursively
				rmdir(filename);
			} else {
				// rm fiilename
				fs.unlinkSync(filename);
			}
		}
		fs.rmdirSync(dir);
	};
	try {
		rmdir(currentDir + "/temp");
	} catch(e) {}
}

packaging.createZip = function(folder, callback) {
	
	//return;
	var zip = new AdmZip();
	packaging.walk(zip, folder, function(dir, data) {
		zip.writeZip(currentDir + "/unpackaged.zip");
		callback(fs.readFileSync(currentDir + "/unpackaged.zip", {encoding:"base64"}));
		process.chdir('..');
	});
//	zip.addLocalFolder(currentDir + "/" + folder);
//	zip.writeZip(currentDir + "/unpackaged.zip");
}

packaging.makePackageDirectory = function() {
	var pdir = "temp";
	fs.mkdirSync(pdir);
	return pdir;
}

packaging.makeConnectedApp = function(args, callback) { //email, appName, callbackUrl, scopes, callback) {
	var pdir = packaging.makePackageDirectory();
	fs.mkdirSync(pdir + "/unpackaged");
	fs.mkdirSync(pdir + "/unpackaged/ConnectedApps");
	var pkgXml = '<?xml version="1.0" encoding="UTF-8"?>' + 
				 '<Package xmlns="http://soap.sforce.com/2006/04/metadata">' +
					'<types>' +
        				'<members>*</members>' +
			        	'<name>ConnectedApp</name>' +
					'</types>' +
    				'<version>29.0</version>' +
				 '</Package>';
	fs.writeFileSync("temp/unpackaged/package.xml", pkgXml);
	fs.writeFileSync("temp/unpackaged/ConnectedApps/" + args.name + ".ConnectedApp", 
		packaging.getConnectedAppXml(args));
	process.chdir('temp');
	packaging.createZip("unpackaged", callback)
};

packaging.getConnectedAppXml = function(args) {
	var caXml = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<ConnectedApp xmlns="http://soap.sforce.com/2006/04/metadata">' +
    				'<contactEmail>' + args.contactEmail + '</contactEmail>' +
	    			'<name>' + args.name + '</name>' +
    				'<oauthConfig>' +
        				'<callbackUrl>' + args.callbackUrl + '</callbackUrl>' +
        				'<scopes>' + args.scopes + '</scopes>' + 
	    			'</oauthConfig>' +
				    '<version>' + args.version + '</version>' +
				'</ConnectedApp>';
	return caXml;
}

packaging.walk = function(zip, dir, done) {
  var results = [];
  //console.log("Processing " + dir);
  var list = fs.readdirSync(dir);
  var i = 0;
    (function next() {
      var file = list[i++];
      if (!file) return done(null, results);
      file = dir + '/' + file;
      var stat = fs.statSync(file)
        if (stat && stat.isDirectory()) {

          packaging.walk(zip, file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
        	zip.addFile(dir + "/", new Buffer(""));
        	//console.log("Adding file: " + file + " at dir: " + dir);
        	if (file.indexOf(".DS_Store") == -1) {
        		zip.addFile(file, fs.readFileSync(file));
	      	}
          	next();
        }
      
    })();
};
exports.packaging = packaging;