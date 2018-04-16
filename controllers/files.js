var FileModel = require("../models/files");
var fs = require("fs");
const path = require('path');
var http = require('http');

var uploadFile = (req, res) => {
    var file = req.files.dokument;
    file.mv(__dirname + "/../uploads/" + file.name, (err) => {
        if(err){
            console.error('Could not upload file!');
            return;
        }
        var fileData = {
            file_name: file.name,
            object_name: file.md5 + "_" +file.name,
            mime: file.mimetype,
            md5: file.md5
        };
        FileModel.addFile(fileData);
    });
    res.send("ok");
}

var getAllFiles = (req, res) => {
    FileModel.getAllFiles((err, data) => {
        if(err){
            res.status(500);
            res.send("Internal server error");
            return;
        }
        res.status(200);
        res.json(data);
    });
}

var getOneFile = (req, res) => {
    FileModel.getOneFile(req.params.id, (err, data) => {
        if (err) {
            res.status(500);
            res.send("Internal server error");
            return;
        }
        res.status(200);
        res.json(data);
    });
}

var deleteFile = (req, res) => {
    FileModel.getOneFile(req.params.id, (err, data) => {
        if(err) {
            res.status(500);
            res.send("Internal server error. Could not get file name.");
            return;
        }
        fs.unlink(path.join(__dirname, "/../uploads/", data.object_name), (err) => {
            if(err){
                res.status(500);
                res.send("Internal server error. Could not remove file from filesystem.");
                return;
            }
            FileModel.deleteFile(req.params.id, (err) => {
                if(err){
                    res.status(500);
                    res.send("Internal server error. Could not remove file from database.");
                    return; 
                }
                res.status(200);
                res.send("OK");
                return; 
            });
        });
    });
}

var downloadFile = (req, res) => {
    FileModel.getOneFile(req.params.id, (err, data) => {
        if(err)
        {
            res.status(500);
            res.send("Internal server error. Could not get file with this Id.");
            return;
        }
        var filePath = path.join(__dirname , "/../uploads/" , data.file_name);
        //varijanta, direkt stream nisto ne se cuva vo memorija, direktno userot go dobiva od disk
        fs.exists(filePath, function(exists){
            if (exists) {     
              // Content-type is very interesting part that guarantee that
              // Web browser will handle response in an appropriate manner.
              res.writeHead(200, {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": "attachment; filename=" + data.file_name
              });
              fs.createReadStream(filePath).pipe(res);
            } 
            else {
              res.writeHead(400, {"Content-Type": "text/plain"});
              res.end("ERROR File does not exist");
            }
        });

        /*
        //Varijanta so citanje na fajl, pa prakjanje vo response
        //Se prevzema vo memorija, pa se prakja do user-ot
        fs.readFile(filePath, function (err, content) {
            if (err) {
                res.status(500);
                res.send("Internal server error. Could not open the file!");
                return;
            } else {
                //specify Content will be an attachment
                res.setHeader('Content-disposition', 'attachment; filename='+data.file_name);
                res.end(content);
            }
        });
        */
    });
}

module.exports = {
    uploadFile,
    getAllFiles,
    deleteFile,
    getOneFile,
    downloadFile
};