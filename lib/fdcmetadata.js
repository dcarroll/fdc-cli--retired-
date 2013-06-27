var fdcmetadata = new Object();
var sforce = require("./connection.js").sforce;

fdcmetadata.setupConnection = function(config) {
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
  return _force;
};

fdcmetadata.deployMetadata = function(config) {
    var _ = require("underscore")._;
    var deployOptions = {}; //new sforce.Xml("DeployOptions");
    deployOptions["allowMissingFiles"] = "false";
    deployOptions["autoUpdatePackage"] = "false";
    deployOptions["checkOnly"] = "false";
    deployOptions["ignoreWarnings"] = "false";
    deployOptions["performRetrieve"] = "false";
    deployOptions["purgeOnDelete"] = "false";
    deployOptions["rollbackOnError"] = "false";
    deployOptions["runAllTests"] = "false";
    deployOptions["singlePackage"] = "false";
    _force = this.setupConnection(config);
    var deploy = new sforce.Xml("metadata");
    deploy._xsiType = "deploy";
    deploy.set("ZipFile", config.ZipFile);
    deploy.set("DeployOptions", deployOptions);
    //console.log("Config: " + JSON.stringify(config));

    return _force.connection.deployMetadata(deploy);
};

fdcmetadata.retrieveMetadata = function(config) {
    var _ = require("underscore")._;
    _force = this.setupConnection(config);
    var res = _force.connection.retrieveMetadata([config.retrieveRequest]);
    return res;
};

fdcmetadata.checkRetrieveStatus = function(config) {
    var _ = require("underscore")._;
    _force = this.setupConnection(config);
    return _force.connection.checkRetrieveStatus([config.id]);    
};

fdcmetadata.checkStatus = function(config) {
    var _ = require("underscore")._;
    _force = this.setupConnection(config);
    return _force.connection.checkStatus([config.id]);    
};

fdcmetadata.checkDeployStatus = function(config) {
    var _ = require("underscore")._;
    _force = this.setupConnection(config);
    return _force.connection.checkDeployStatus([config.id]);    
};

fdcmetadata.showMetadata = function(config) {
    var _ = require("underscore")._;
    _force = this.setupConnection(config);
    return _force.connection.describeMetadata([config.apiVersion]);
};

fdcmetadata.listMetadata = function(config) {
    var _ = require("underscore")._;
    _force = this.setupConnection(config);

    queries = [];
    _.each(config.listMetadataQueries, function(q){
        //console.log("Q: " + JSON.stringify(q));
        queries.push(new sforce.internal.Parameter("listMetadataQuery", q, false))
    })
    return _force.connection.listMetadata(config.queries, [config.asOfVersion]);
};

fdcmetadata.deleteCustomObject = function(config) {
    var _ = require("underscore")._;
    _force = this.setupConnection(config);

    var customObject = new sforce.Xml("metadata");
    customObject._xsiType = "CustomObject";
    customObject.set("fullName", config.name);

    return _force.connection.deleteObject([customObject]);
};

fdcmetadata.createCustomObject = function(config) {
    var _ = require("underscore")._;

    var customObject = new sforce.Xml("metadata");
    customObject._xsiType = "CustomObject";
    //customObject.set("fullName", config.name + "__c");
    
    //console.log("config: " + JSON.stringify(config));
    var keys = _.keys(config);
    _.each(keys, function(key) {
        if (key !== "sforce") {
            if (key === "name") {
                customObject.set("fullName", config[key] + "__c");
                if (!config.label) {
                    customObject.set("label", config[key]);
                    if (!config.pluralLabel) {
                        customObject.set("pluralLabel", customObject.label + "s");
                    }
                } else {
                    if (!config.pluralLabel) {
                        customObject.set("pluralLabel", customObject.label + "s");                        
                    }
                }
            } else {
                customObject.set(key, config[key]);
            }
        }
    })
    //customObject.set("deploymentStatus", "Deployed");
    //customObject.set("description", config.description || "");
    //customObject.set("label", config.label || config.name);
    //customObject.set("pluralLabel", customObject.label + "s");
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

    _force = this.setupConnection(config);

    return _force.connection.createObject([customObject]);

};

fdcmetadata.createCustomField = function(config) {
    // forcedotcom createfield object:MyTable name:MyField 
    // The name field appears in page layouts, related lists, and elsewhere.
    var nf = new sforce.Xml("metadata");

    var fieldApiName = config.args.label.replace(/\ /g,'_') + "__c"

    nf._xsiType = "CustomField";
    for (var key in config.args) {
        if (key !== "sforce" && key !== "tablename") {
            if (key === "name") {
                if (config.args.tablename.indexOf("__c") === -1) {
                    config.args.tablename += "__c";
                }
                nf.set("fullName", config.args.tablename + "." + config.args[key] + "__c");
            } else {
                if (config.args[key] !== null) {
                    nf.set(key, config.args[key]);
                }
            }
        }
    }

    var _ = require("underscore")._;

    _force = this.setupConnection(config);

    var result = _force.connection.createObject([nf]);
    return result;
    //console.log("createCustomField result \n" + JSON.stringify(result, null, 2));
};

exports.fdcmetadata = fdcmetadata;

/*
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <env:Header>
        <SessionHeader xmlns="http://soap.sforce.com/2006/04/metadata">
            <sessionId>00DD0000000JxlU!AR0AQKVY.GT4FegxJvn4ND93acAWU_5TYb0WLhCjffo2udJ0GVu59NM.RiRDNHUda9Gt6sfgL4klKq.BlZQy8oblZX_CCKvD</sessionId>
        </SessionHeader>
    </env:Header>
    <env:Body>
        <m:retrieve xmlns:m="http://soap.sforce.com/2006/04/metadata" xmlns:sobj="null">
            <m:retrieveRequest>
                <m:apiVersion>29.0</m:apiVersion>
                <m:singlePackage>false</m:singlePackage>
                <m:unpackaged xsi:type="m:Package">
                    <m:types>
                        <m:members>*</m:members>
                        <m:name>CustomObject</m:name>
                    </m:types>
                    <m:version>29.0</m:version>
                </m:unpackaged>
            </m:retrieveRequest>
        </m:retrieve>
    </env:Body>
</env:Envelope>
*/