/**
 * @license
 * Everything in this repo is MIT License unless otherwise specified.
 *
 * Copyright (c) Addy Osmani, Sindre Sorhus, Pascal Hartig, Stephen  Sawchuk, Google, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

    // set up ========================
  var ao = require('appoptics');
  ao.sampleMode = 'always';
	var express  = require('express');
	var app      = express(); 								// create our app w/ express
	var mongoose = require('mongoose'); 					// mongoose for mongodb
	var morgan = require('morgan'); 			// log requests to the console (express4)
	var bodyParser = require('body-parser'); 	// pull information from HTML POST (express4)
	var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
  var argv = require('optimist').argv;
  var http = require('http')
  var url = require('url')

  //
  // configuration and options =================
  //

  // mongo DB
  var mongoHost = typeof argv.be_ip === 'string' ? argv.be_ip : '127.0.0.1:27017'
  if (!~mongoHost.indexOf(':')) mongoHost += ':27017'


  var mOpts = {
    reconnectTries: 10,
    reconnectInterval: 2000
  }

  mongoose.connect('mongodb://' + mongoHost + '/my_database', mOpts)

  // web server
  var webServerHost = argv.fe_ip || '0.0.0.0:8088'
  if (!~webServerHost.indexOf(':')) webServerHost += ':8088'

  var rate = 'rate' in argv ? +argv.rate : 1000000
  // also allow shorthand -r which does 0-100 (for percents)
  if ('r' in argv) rate = +argv.r * 10000
  ao.sampleRate = rate

  // log headers to console
  var show = argv.s || argv['show-headers']

  // host to log requests to. don't log if not present
  var logHost = argv.log_ip || ''

  //
  // app configuration ===============
  //

  // taken from appoptics test suite.
  var options = {
    key: "-----BEGIN RSA PRIVATE KEY-----\nMIICXQIBAAKBgQCsJU2dO/K3oQEh9wo60VC2ajCZjIudc8cqHl9kKNKwc9lP4Rw9\nKWso/+vHhkp6Cmx6Cshm6Hs00rPgZo9HmY//gcj0zHmNbagpmdvAmOudK8l5Npzd\nQwNROKN8EPoKjlFEBMnZj136gF5YAgEN9ydcLtS2TeLmUG1Y3RR6ADjgaQIDAQAB\nAoGBAJTD9/r1n5/JZ+0uTIzf7tx1kGJh7xW2xFtFvDIWhV0wAJDjfT/t10mrQNtA\n1oP5Fh2xy9YC+tZ/cCtw9kluD93Xhzg1Mz6n3h+ZnvnlMb9E0JCgyCznKSS6fCmb\naBz99pPJoR2JThUmcuVtbIYdasqxcHStYEXJH89Ehr85uqrBAkEA31JgRxeuR/OF\n96NJFeD95RYTDeN6JpxJv10k81TvRCxoOA28Bcv5PwDALFfi/LDya9AfZpeK3Nt3\nAW3+fqkYdQJBAMVV37vFQpfl0fmOIkMcZKFEIDx23KHTjE/ZPi9Wfcg4aeR4Y9vt\nm2f8LTaUs/buyrCLK5HzYcX0dGXdnFHgCaUCQDSc47HcEmNBLD67aWyOJULjgHm1\nLgIKsBU1jI8HY5dcHvGVysZS19XQB3Zq/j8qMPLVhZBWA5Ek41Si5WJR1EECQBru\nTUpi8WOpia51J1fhWBpqIbwevJ2ZMVz0WPg85Y2dpVX42Cf7lWnrkIASaz0X+bF+\nTMPuYzmQ0xHT3LGP0cECQQCqt4PLmzx5KtsooiXI5NVACW12GWP78/6uhY6FHUAF\nnJl51PB0Lz8F4HTuHhr+zUr+P7my7X3b00LPog2ixKiO\n-----END RSA PRIVATE KEY-----",
    cert: "-----BEGIN CERTIFICATE-----\nMIICWDCCAcGgAwIBAgIJAPIHj8StWrbJMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV\nBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX\naWRnaXRzIFB0eSBMdGQwHhcNMTQwODI3MjM1MzUwWhcNMTQwOTI2MjM1MzUwWjBF\nMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50\nZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKB\ngQCsJU2dO/K3oQEh9wo60VC2ajCZjIudc8cqHl9kKNKwc9lP4Rw9KWso/+vHhkp6\nCmx6Cshm6Hs00rPgZo9HmY//gcj0zHmNbagpmdvAmOudK8l5NpzdQwNROKN8EPoK\njlFEBMnZj136gF5YAgEN9ydcLtS2TeLmUG1Y3RR6ADjgaQIDAQABo1AwTjAdBgNV\nHQ4EFgQUTqL/t/yOtpAxKuC9zVm3PnFdRqAwHwYDVR0jBBgwFoAUTqL/t/yOtpAx\nKuC9zVm3PnFdRqAwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOBgQBn1XAm\nAsVdXKr3aiZIgOmw5q+F1lKNl/CHtAPCqwjgntPGhW08WG1ojhCQcNaCp1yfPzpm\niaUwFrgiz+JD+KvxvaBn4pb95A6A3yObADAaAE/ZfbEA397z0RxwTSVU+RFKxzvW\nyICDpugdtxRjkb7I715EjO9R7LkSe5WGzYDp/g==\n-----END CERTIFICATE-----"
  }



  app.use('/js', express.static(__dirname + '/js'));
  app.use('/bower_components', express.static(__dirname + '/bower_components'));
  // log every request to the console
  app.use(morgan('dev'));
  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({'extended':'true'}));
  // parse application/json
  app.use(bodyParser.json());
  // parse application/vnd.api+json as json
	app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
	app.use(methodOverride());

  //
  // define mongo model =================
  //
	var Todo = mongoose.model('Todo', {
		title : String,
		completed: Boolean
	});

  //
  // routes ======================================================================
  //

	// api ---------------------------------------------------------------------
	// get all todos
	app.get('/api/todos', function(req, res) {
    show && console.log(req.headers)
		// use mongoose to get all todos in the database
		Todo.find(function(err, todos) {

      // if there is an error retrieving, send the error.
      // nothing after res.send(err) will execute
			if (err)
				res.send(err)

			res.json(todos); // return all todos in JSON format
		});
	});

	// create todo and send back all todos after creation
	app.post('/api/todos', function(req, res) {
    show && console.log(req.headers)

		// create a todo, information comes from AJAX request from Angular
		Todo.create({
			title : req.body.title,
			completed : false
		}, function(err, todo) {
			if (err)
				res.send(err);

			// get and return all the todos after you create another
			Todo.find(function(err, todos) {
				if (err)
					res.send(err)
				res.json(todos);
			});
		});

	});

	app.put('/api/todos/:todo_id', function (req, res) {
    show && console.log(req.headers)
	  return Todo.findById(req.params.todo_id, function(err, todo) {
	    todo.title = req.body.title;
	    todo.completed = req.body.completed;
	    return todo.save(function(err) {
	      if (err) {
	        res.send(err);
	      }
	      return res.send(todo);
	    });
	  });
	});

	// delete a todo
	app.delete('/api/todos/:todo_id', function (req, res) {
    show && console.log(req.headers)
		Todo.remove({
			_id : req.params.todo_id
		}, function(err, todo) {
			if (err)
				res.send(err);

			// get and return all the todos after you create another
			Todo.find(function(err, todos) {
				if (err)
					res.send(err)
				res.json(todos);
			});
		});
  });

  // do a transaction to another server
  app.get('/downstream/:url', function (req, res) {
    show && console.log(req.headers)

    var options = {
      protocol: 'http:',
      port: 8881,
      hostname: 'localhost',
      method: 'post',
      path: (req.params.url ? '/' + req.params.url : '/'),
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const oreq = http.request(options, function (ires) {
      body = ''
      ires.on('data', function (d) {
        body += d
      })
      // and on end log it
      ires.on('end', function () {
        res.send(body)
      })
      ires.on('error', function (e) {
        console.log('GOT ERROR', e)
      })
    })

    oreq.on('error', function (err) {
      console.log('got error', err)
    })
    oreq.write(JSON.stringify({url: options.path}))
    oreq.end()

  })

  //
  // now make a chained URL
  //
  app.get('/chain', function (req, res) {
    show && console.log(req.headers)

    var q = req.query.target

    function makePrefix (URL) {
      return '--- response from ' + URL + ' ---\nheaders: '
    }

    if (!q) {
      res.send('this is the end!\n')
      return
    }

    var options = url.parse(q)
    if (req.headers['X-Trace']) {
      options.headers = {'X-Trace': req.headers['X-Trace']}
    }

    // now do the outbound request and get the inbound response
    const oreq = http.request(options, function (ires) {
      var body = ''
      ires.on('data', function (d) {
        body += d
      })
      // on end return it along with the headers
      ires.on('end', function () {
        var p = makePrefix(q)
        var h = JSON.stringify(ires.headers)
        res.send(p + h + '\nbody: ' + body + '\n')
      })
      ires.on('error', function (e) {
        console.log('GOT ERROR', e)
      })
    })

    // if the outbound request failed send the error
    oreq.on('error', function (err) {
      console.log('got error', err)
      res.statusCode = 422
      res.send(JSON.stringify(err))
      oreq.end()
    })
    oreq.end('')

  })

	// application -------------------------------------------------------------
	app.get('/', function(req, res) {
    // load the single view file (angular will handle the page changes on the front-end)
		res.sendfile('index.html');
  });

  var host = webServerHost.split(':')
  var port = +host[1]
  host = host[0]

	// listen (start app with node server.js) ======================================
  app.listen(port, host)
  app.listen(8443, host)
  var tty = require('tty')
  var text = tty.isatty(process.stdout.fd) ? 'on a tty' : 'not a tty'
	console.log('App listening on', webServerHost, 'sample rate', ao.sampleRate, text)
