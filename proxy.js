var http = require("http");
var url = require("url");

const startProxy = (port = 301, cb) => {
  const proxy = http.createServer(function(req, res) {
    const request = url.parse(req.url);
    console.log("[PROXY]: request hostname", request.hostname);
    console.log("[PROXY]: request port", request.port);
    console.log("[PROXY]: request path", request.path);
    const options = {
      protocol: request.protocol || 'http',
      host: request.hostname || "http://devpaperpads.piosoft.org",
      port: request.port || 8003,
      pathname: request.pathname,
      path: request.path,
      method: req.method,
      search: request.search,
      query: request.query,
      headers: req.headers
    };

    console.log("options", options);
    // console.log(`${options.method} http://${options.host}${options.path}`);

    var backend_req = http.request(options, function(backend_res) {
      console.log("[PROXY]: backend_res");
      res.writeHead(backend_res.statusCode, backend_res.headers);

      backend_res.on("data", function(chunk) {
        console.log("[PROXY]: data with chunk");
        res.write(chunk);
      });

      backend_res.on("end", function() {
        res.end();
      });
    });

    req.on("data", function(chunk) {
      console.log("[PROXY]: data");
      backend_req.write(chunk);
    });

    req.on("end", function() {
      backend_req.end();
    });
  });

  proxy.listen(port);
  cb();
};

module.exports = startProxy;
