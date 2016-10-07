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

const cwd = process.cwd()

glob(path.join(cwd, process.argv.pop()), {}, (er, files) => {
  const filesList = files
  .map(f => `${(cwd + '/').grey}${path.relative(cwd, f).cyan}`)
  .join('\n')
  console.log('\nTest files:\n\n'.cyan + filesList)

  const html = getHTML(getTestScripts(files))

  const server = createServer([
    [
      matchPath(/mocha\.js$/),
      staticFile(path.resolve(cwd, 'node_modules/mocha/mocha.js'))
    ],
    [
      matchPath(/mocha\.css$/),
      staticFile(path.resolve(cwd, 'node_modules/mocha/mocha.css'))
    ],
    [matchPath(/\.es6$/), rollupResponse],
    [matchPath(/^\/$/), (o) => response(o, 200, html)],
    [always, (o) => response(o, 404, 'not found')]
  ])

  server.listen(3000, () => {
    console.log('\nlistening on'.grey, 'localhost:3000\n'.green)
  })
})

const createServer = (routes) => {
  const router = when(routes)
  const server = http.createServer((req, res) => {
    const path = url.parse(req.url)
    router({req, res, path})
  })

  return server
}

const log = (req, status, color) => {
  console.log(`${String(status)[color]} ${req.method.cyan} ${String(req.url).grey}`)
}

const statusColor = when([
  [s => s < 300, s => 'green'],
  [s => s < 400, s => 'yellow'],
  [always, s => 'red']
])

const response = ({req, res}, status, data, mode) => {
  log(req, status, statusColor(status))
  if (status === 500 && data.message) {
    console.log(String(data.message).red)
    console.log(String(data.message.stack).grey)
  }

  res.writeHead(status)
  res.write(data, mode)
  res.end()
}

const getTestScripts = (files) => {
  return files.map((f) => {
    const relativePath = path.relative(cwd, f)
    return `<script src='/${relativePath}' type='text/javascript'></script>`
  }).join('')
}

const matchPath = pattern => ({path}) => pattern.test(path.pathname)

const staticFile = filepath => (o) => {
  fs.readFile(filepath, 'binary', (err, file) =>
    err
      ? response(o, 500, err)
      : response(o, 200, file, 'binary')
  )
}

const rollupResponse = (o) => {
  rollup({
    entry: `${cwd}/${o.path.pathname}`,
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

    response(o, 200, result.code)
  }).catch((err) => {
    response(o, 500, err)
  })
}

const getHTML = (scripts) =>
  `
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
        ${scripts}
        <script>
          mocha.checkLeaks()
          mocha.run()
        </script>
      </body>
    </html>
  `
