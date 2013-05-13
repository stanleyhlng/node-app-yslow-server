"use strict";

var express = require("express"),
    execFile = require("child_process").execFile,
    app = express(),
    port = process.argv[2] || process.env.app_port || 8080,
    isTrue = /^(true|1|yes)$/i,

    getContentType = function(format) {
        var contentType = "";
        switch(format) {
            case 'xml':
                contentType = 'text/xml';
                break;
            case 'plain':
                contentType = 'text/plain';
                break;
            default:
                contentType = 'application/json';
        }
        return contentType;
    },

    help = function(url) {
        return {
            help: {
                usage: url + '?[options][&url=<URL to run yslow>]',
                options: [
                    'h | help:                 output usage information',
                    'f | format <format>:      specify the output results format (json|xml|plain) [json]'
                ],
                examples: [
                    url + '?url=http%3A%2F%2Fwww.google.com'
                ]
            }
        };
    };

// configuration
app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.errorHandler());
});

// main route
app.all('/', function (req, res) {
    var url, context, output;

    try {
        url = req.param('url', '');
        context = {
            req: req,
            res: res,
            // YSlow options
            info: req.param('info', req.param('i', 'basic')),
            ruleset: req.param('ruleset', req.param('r', 'ydefault')),
            format: req.param('format', req.param('f', 'json')),
            dict: isTrue.test(req.param('dict', req.param('d', ''))),
            verbose: isTrue.test(req.param('verbose', req.param('v', '')))
        };

        // help
        if (isTrue.test(req.param('help', req.param('h', '')))) {
            output = help('http://' + req.header('host') + req.route.path);
            output = JSON.stringify(output);
            res.contentType(getContentType(context.format));
            res.send(output);
            return;
        }

        if (url.length > 0) {
            execFile('phantomjs', ['yslow.js', '-f', context.format, '-t', '90', url], null, function(err, stdout, stderr) {
                res.contentType(getContentType(context.format));
                res.send(stdout);
            });
        } else {
            output = help('http://' + req.header('host') + req.route.path);
            output = JSON.stringify(output);
            res.contentType(getContentType(context.format));
            res.send(output);
            return;
        }
         
    } catch (err) {
        res.send(err);
    }
});

if (!module.parent) {
    app.listen(port, function() {
        console.log(this.address().address, 'port', this.address().port);
    });
}
