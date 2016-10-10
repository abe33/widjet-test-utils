#!/usr/bin/env node

import 'colors'
import fs from 'fs'
import url from 'url'
import path from 'path'
import glob from 'glob'
import http from 'http'
import {rollup} from 'rollup'
import {when, always, merge, asPair} from 'widjet-utils'
import * as babel from 'babel-core'
import program from 'commander'

import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import includePaths from 'rollup-plugin-includepaths'

program
.version(require('./package.json').version)
.usage('[options] <globs ...>')
.option('-p, --port <n>', 'Set server port', parseInt)
.parse(process.argv)

const cwd = process.cwd()
const port = program.port || 8888

const getTestFiles = () =>
  Promise.all(program.args.map(globFiles))
  .then((files) => files.reduce((memo, f) => memo.concat(f), []))

const globFiles = (pattern) =>
  new Promise((resolve, reject) => {
    glob(path.join(cwd, pattern), {}, (err, files) => {
      err ? reject(err) : resolve(files)
    })
  })

getTestFiles().then((files) => {
  const filesList = files
  .map(f => `${(cwd + '/').grey}${path.relative(cwd, f).cyan}`)
  .join('\n')
  console.log('\nTest files:\n\n'.cyan + filesList)

  const server = createServer([
    [
      matchPath(/mocha\.js$/),
      staticFile(path.resolve(cwd, 'node_modules/mocha/mocha.js'), {
        'Content-Type': 'application/javascript'
      })
    ],
    [
      matchPath(/mocha\.css$/),
      staticFile(path.resolve(cwd, 'node_modules/mocha/mocha.css'), {
        'Content-Type': 'text/css'
      })
    ],
    [
      matchPath(/^\/ie8-patches.js$/),
      (o) => response(o, 200, getIE8Patches())
    ],
    [
      matchPath(/\.es6$/),
      rollupResponse
    ],
    [
      matchPath(/^\/$/),
      (o) => {
        getTestFiles().then((files) => {
          response(o, 200, getHTML({
            scripts: getScripts(getServerConfig().scripts || {}),
            testScripts: getTestScripts(files)
          }), {'Content-Type': 'text/html'})
        }).catch((err) => {
          response(o, 500, err, {'Content-Type': 'text/plain'})
        })
      }
    ],
    [
      always,
      (o) => response(o, 404, 'not found', {'Content-Type': 'text/plain'})
    ]
  ])

  server.listen(port, () => {
    console.log('\nlistening on'.grey, `localhost:${port}\n`.green)
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

const response = ({req, res}, status, data, headers = {}, mode) => {
  log(req, status, statusColor(status))
  if (status === 500 && data.message) {
    console.log(String(data.message).red)
    console.log(String(data.stack).grey)
  }

  res.writeHead(status, headers)
  res.write(data, mode)
  res.end()
}

const getTestScripts = (files) =>
  files.map(f => getScript('/' + path.relative(cwd, f))).join('')

const ie = (version) => ([key]) => key === `ie${version}`

const scriptsMapper = when([
  [ie(9), ([, scripts]) => getConditionalComment(9, scripts.map(getScript))],
  [ie(8), ([, scripts]) => getConditionalComment(8, scripts.map(getScript))],
  [always, ([, scripts]) => scripts.map(getScript)]
])

const scriptsReducer = (memo, a) => memo.concat(scriptsMapper(a))

const getScripts = (conf) => asPair(conf).reduce(scriptsReducer, []).join('\n')

const getScript = (path) =>
  `<script src='${path}' type='text/javascript'></script>`

const getConditionalComment = (version, content) =>
  [`<!--[if IE ${version}]>`].concat(content).concat(`<![endif]-->`)

const matchPath = pattern => ({path}) => pattern.test(path.pathname)

const staticFile = (filepath, headers) => (o) => {
  fs.readFile(filepath, 'binary', (err, file) =>
    err
      ? response(o, 500, err, {'Content-Type': 'text/plain'})
      : response(o, 200, file, headers, 'binary')
  )
}

const rollupResponse = (o) => {
  const rollupConf = getRollupConfig()
  rollup({
    entry: path.join(cwd, o.path.pathname),
    external: ['mocha-jsdom'].concat(rollupConf.external || []),
    plugins: [
      includePaths({
        paths: [path.join(cwd, 'test')].concat(rollupConf.includePaths || []),
        extensions: ['.js', '.json', '.es6']
      }),
      nodeResolve({jsnext: true, main: true}),
      commonjs()
    ]
  }).then((bundle) =>
    bundle.generate({
      format: rollupConf.format || 'iife',
      globals: merge({'mocha-jsdom': 'jsdom'}, rollupConf.globals || {})
    })
  ).then((result) => {
    const {code} = result
    const js = babel.transform(code, getBabelConfig())

    response(o, 200, js.code, {'Content-Type': 'application/javascript'})
  }).catch((err) => {
    response(o, 500, err, {'Content-Type': 'text/plain'})
  })
}

const getServerConfig = () => {
  const serverConfigPath = path.join(cwd, 'widjet-test-server.json')
  return fs.existsSync(serverConfigPath)
    ? JSON.parse(fs.readFileSync(serverConfigPath))
    : {}
}

const getRollupConfig = () => getServerConfig().rollup || {}

const getBabelConfig = () => {
  const babelRcPath = path.join(cwd, '.babelrc')

  return fs.existsSync(babelRcPath)
    ? JSON.parse(fs.readFileSync(babelRcPath))
    : JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'))).babel
}

const getIE8Patches = () =>
  `
    window.HTMLElement = window.Element
    var createEvent = document.createEvent
    document.createEvent = function (type) { return createEvent('Event') }
  `

const getHTML = ({scripts, testScripts}) =>
  `
    <!doctype html>
    <html>
      <head>
        <meta charset='utf-8'>
        <link href='/mocha.css' rel='stylesheet' type='text/css'>
      </head>

      <body>
        <div id="mocha"></div>
        <div id="mocha-container"></div>
        <script type='text/javascript' src='/mocha.js'></script>
        ${scripts}
        <script>
          mocha.setup('bdd')
          window.jsdom = function(){}
        </script>
        ${testScripts}
        <script>
          mocha.checkLeaks()
          mocha.run()
        </script>
      </body>
    </html>
  `
