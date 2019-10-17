var http = require("http");
var url = require("url");

const startProxy = (port = 301, cb) => {
  const proxy = http.createServer(function(req, res) {
    const request = url.parse(req.url);
    console.log("request hostname", request.hostname);
    const options = {
      // protocol: request.protocol || 'http',
      host: request.hostname || "https://dev.piosoft.org",
      port: request.port || 80,
      pathname: request.pathname,
      method: req.method,
      search: request.search,
      query: request.query,
      headers: req.headers
    };

    // console.log("options", options);
    // console.log(`${options.method} http://${options.host}${options.path}`);

    var backend_req = http.request(options, function(backend_res) {
      console.log("backend_res");
      res.writeHead(backend_res.statusCode, backend_res.headers);

      backend_res.on("data", function(chunk) {
        console.log("chunk");
        res.write(chunk);
      });

      backend_res.on("end", function() {
        res.end();
      });
    });

    req.on("data", function(chunk) {
      console.log('data');
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
