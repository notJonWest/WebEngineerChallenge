const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");
const qs = require("querystring");

const PORT = 8080;

const DEFAULT_FILE = "index.html";
const ROOTDIR = "./public";
const ERRDIR = "./private/errorpages";
const DATADIR = "./private/data";

const extToMIME = {
	".css": "text/css",
	".html": "text/html",
	".htm": "text/html",
	".js": "application/javascript",
	".json": "application/json",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".pdf": "application/pdf",
	".png": "image/png",
	".svg": "image/svg+xml",
	".ttf": "font/ttf",
	".txt": "text/plain",
	".ico": "image/x-icon",
	".xml": "text/xml"
};

const statusMsgs = {
	200: "OK",
	400: "Bad Request",
	404: "Not Found",
	406: "Not Acceptable",
	415: "Unsupported Media Type",
	416: "Range not satisfiable",
	500: "Internal Server Error",
	520: "Writing Error",
};

http.createServer((req, res) =>
{
    let statusCode = 200;
    let content = "";
    let contentType = extToMIME[".txt"];

	let urlObj = url.parse(req.url, true);
	let filePath = path.parse(urlObj.pathname);
	let fullDir = path.join(ROOTDIR, filePath.dir);

    let finishResponse = (sCode = statusCode, cType = contentType, cont = content, _res = res) =>
	{
		//Make variables consistent
		statusCode = sCode;
		contentType = cType;
		content = cont;
		sendResponse(_res, sCode, cont, cType);
	};

	let newUrlPath = (...newUrl) =>
	{
		urlObj = url.parse(path.join(...newUrl), true);
		filePath = path.parse(urlObj.pathname);
		fullDir = path.join(filePath.dir);
	};
	
	let readFile = () =>
	{
		fs.readFile(path.join(fullDir, filePath.base), (err, data) =>
		{
			if (statusCode !== 200)
				finishResponse();
			else if (err)
			{
				if (err.code === "ENOENT")
					if (filePath.base === "favicon.ico")
						res.end(); //End response if favicon.ico does not exist
					else
						statusCode = 404;
				else
				{
					console.log(err.code);
					statusCode = 500;
				}
				finishResponse();
			} //if (err)
			else //if 200 and no err
			{
				contentType = extToMIME[filePath.ext];
				content = data;
				finishResponse();
			} //No err in readFile
		}); //fs.readFile
	};
    
    if (filePath.ext === '')
    {
		if (filePath.dir.substring(1, 5) === "json")
			newUrlPath(DATADIR, filePath.base + ".json");
		else
        	newUrlPath(ROOTDIR, filePath.dir, filePath.base, DEFAULT_FILE);
	}
	
	if (extToMIME[filePath.ext] === undefined)
	{
		finishResponse(404);
	}
	else
	{
		readFile();
	}
}).listen(PORT);

let sendResponse = (res, sCode, cont, cType) =>
{
	if (sCode !== 200)
	{
		let errorCont = cont;
		fs.readFile(path.join(ERRDIR, `${sCode}.html`), (err, data) =>
		{
			if (err) {
				cType = extToMIME[".txt"];
				cont = `${sCode}: ${statusMsgs[sCode]}`;
			}
			else {
				cType = extToMIME[".html"];
				cont = data;
			}

			res.writeHead(sCode, {
				"Content-Type": cType,
				"Failed-Content": errorCont,
				"Accept-Ranges": "none"
			});
			res.end(cont);
		});
	}
	else
	{
		res.writeHead(sCode, {
			"Content-Type": cType
		});
		res.end(cont);
	}
}; //sendResponse