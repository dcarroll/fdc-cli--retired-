var fdcmetadata = new Object();
var sforce = require("./connection.js").sforce;

fdcmetadata.createCustomObject = function(config) {

    var customObject = new sforce.Xml("metadata");
    customObject._xsiType = "CustomObject";
    customObject.set("fullName", config.name + "__c");
    customObject.set("deploymentStatus", "Deployed");
    customObject.set("description", config.description || "");
    customObject.set("label", config.label || config.name);
    customObject.set("pluralLabel", customObject.label + "s");
    customObject.set("sharingModel", "ReadWrite");

    // The name field appears in page layouts, related lists, and elsewhere.
    var nf = new sforce.Xml("metadata");
    nf._xsiType = "CustomField";
    nf.set("type", "Text");
    nf.set("description", "");
    nf.set("label", customObject.label);
    nf.set("fullName", config.name);
    customObject.set("nameField", nf);

    var _ = require("underscore")._;

    _force = _.clone(config.sforce);
    _force.connection.serverUrl = _force.connection.serverUrl.replace("/u/", "/m/");
    _force.connection.sforceNs = "http://soap.sforce.com/2006/04/metadata"
    _force.connection.sobjectNs = "http://soap.sforce.com/2006/04/metadata";
    _force.Connection.prototype.sforceNs = "http://soap.sforce.com/2006/04/metadata";
    _force.Connection.prototype.sobjectNs = "http://soap.sforce.com/2006/04/metadata";
    sforce.Connection.prototype.namespaceMap = [
        {ns:sforce.Connection.prototype.sforceNs, prefix:null},
        {ns:sforce.Connection.prototype.sobjectNs, prefix:"ns1"}
    ];

    _force.connection.createObject([customObject]);

}


fdcmetadata.createCustomField = function(config) {
    // forcedotcom createfield object:MyTable name:MyField 
    // The name field appears in page layouts, related lists, and elsewhere.
    var nf = new sforce.Xml("metadata");

    var fieldApiName = config.label.replace(/\ /g,'_') + "__c"

    nf._xsiType = "CustomField";
    for (var key in config) {
        if (key !== "sforce") {
            nf.set(key, config[key]);
            if (key === "fullName") nf.set(key, config[key] + "." + fieldApiName);
        }
    }

    var _ = require("underscore")._;

    _force = _.clone(config.sforce);
    _force.connection.serverUrl = _force.connection.serverUrl.replace("/u/", "/m/");
    _force.connection.sforceNs = "http://soap.sforce.com/2006/04/metadata"
    _force.connection.sobjectNs = "http://soap.sforce.com/2006/04/metadata";
    _force.Connection.prototype.sforceNs = "http://soap.sforce.com/2006/04/metadata";
    _force.Connection.prototype.sobjectNs = "http://soap.sforce.com/2006/04/metadata";
    sforce.Connection.prototype.namespaceMap = [
        {ns:sforce.Connection.prototype.sforceNs, prefix:null},
        {ns:sforce.Connection.prototype.sobjectNs, prefix:"ns1"}
    ];

    var result = _force.connection.createObject([nf]);
}

exports.fdcmetadata = fdcmetadata;