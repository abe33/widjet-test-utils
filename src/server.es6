import 'colors'
import fs from 'fs'
import url from 'url'
import path from 'path'
import glob from 'glob'
import http from 'http'
import {rollup} from 'rollup'
import {when, always} from 'widjet-utils'

import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import includePaths from 'rollup-plugin-includepaths'

const createServer = (routes) => {
  const router = when(routes)
  const server = http.createServer((req, res) => {
    const path = url.parse(req.url)
    router({req, res, path})
  })

  return server
}

const log = (req, status, color) => {
  console.log(`${status.toString()[color]} ${req.method.cyan} ${String(req.url).grey}`)
}

const cwd = process.cwd()

const getTestScripts = (files) => {
  return files.map((f) => {
    const relativePath = path.relative(cwd, f)
    return `<script src='/${relativePath}' type='text/javascript'></script>`
  }).join('')
}

const matchPath = pattern => ({path}) => pattern.test(path.pathname)

const staticFile = filepath => ({req, res}) => {
  fs.readFile(filepath, 'binary', (err, file) => {
    if (err) {
      log(req, '500', 'red')
      res.writeHead(500, {'Content-Type': 'text/plain'})
      res.write(err + '\n')
      res.end()
      return
    }

    log(req, '200', 'green')
    res.writeHead(200)
    res.write(file, 'binary')
    res.end()
  })
}

const rollupResponse = ({req, res, path}) => {
  const localPath = `.${path.path}`

  rollup({
    entry: localPath,
    external: [
      'mocha-jsdom',
      'expect.js',
      'sinon'
    ],
    plugins: [
      includePaths({paths: ['test/'], extensions: [ '.js', '.json', '.es6' ]}),
      nodeResolve({jsnext: true, main: true}),
      commonjs()
    ]
  }).then((bundle) => {
    const result = bundle.generate({
      format: 'iife',
      globals: {
        'mocha-jsdom': 'jsdom',
        'expect.js': 'expect',
        'sinon': 'sinon'
      }
    })

    log(req, '200', 'green')
    res.writeHead(200)
    res.write(result.code)
    res.end()
  }).catch((err) => {
    log(req, '500', 'red')
    console.log(String(err.message).red)
    console.log(String(err.message.stack).grey)
  })
}
glob(path.join(cwd, process.argv.pop()), {}, (er, files) => {
  console.log('\nTest files:\n\n'.cyan + files.map(f => {
    const relativePath = path.relative(cwd, f)

    return `${(cwd + '/').grey}${relativePath.cyan}`
  }).join('\n'))

  const server = createServer([
    [matchPath(/mocha\.js$/), staticFile('./node_modules/mocha/mocha.js')],
    [matchPath(/mocha\.css$/), staticFile('./node_modules/mocha/mocha.css')],

    [matchPath(/\.es6$/), rollupResponse],
    [
      matchPath(/^\/$/), ({req, res}) => {
        const html = `
          <!doctype html>
          <html>
            <head>
              <meta charset='utf-8'>
              <link href='/mocha.css' rel='stylesheet'>
            </head>

            <body>
              <div id="mocha"></div>
              <div id="mocha-container"></div>
              <script type='text/javascript' src='/mocha.js'></script>
              <script src="https://cdn.rawgit.com/Automattic/expect.js/0.3.1/index.js"></script>
              <script src="http://cdnjs.cloudflare.com/ajax/libs/sinon.js/1.7.3/sinon-min.js"></script>
              <script>
                mocha.setup('bdd')
                window.jsdom = function(){}
              </script>
              ${getTestScripts(files)}
              <script>
                mocha.checkLeaks()
                mocha.run()
              </script>
            </body>
          </html>
        `
        log(req, '200', 'green')
        res.writeHead(200)
        res.end(html)
      }
    ],
    [always, ({req, res}) => {
      log(req, '404', 'red')
      res.writeHead(404)
      res.end('404 not found')
    }]
  ])

  server.listen(3000, () => {
    console.log('\nlistening on'.grey, 'localhost:3000\n'.green)
  })
})
