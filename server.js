const express = require('express')
const cors = require('cors')
const http = require('http')

const app = express();
const server = http.createServer(app);

const _ = require('lodash')

const PLUGIN_VERSION = 1

app.use(cors())
app.use(express.json())

let started = false

const context = {
    fixtures: [],
    tests: [],
    waitUpdate: null
}
module.exports.serverContext = context

module.exports.startServer = (cypressConfig) => {
    if (started) {
        return
    }

    let port = 3264
    if (cypressConfig.env && cypressConfig.env.constellation_port && _.isNumber(cypressConfig.env.constellation_port)) {
        port = _.toNumber(cypressConfig.env.constellation_port)
    }

    server.on('error', (error) => {
        if (error.code !== 'EADDRINUSE') {
            console.error('http error', error)
        }
    })
    server.listen(port, '127.0.0.1', () => {
        started = true
        console.log(`Constellation plugin server is listening on port ${port}. Visit https://www.constellation.xyz/ to open Profiler App.`)
    })
}

module.exports.stopServer = async () => {
    server.close()
}

module.exports.reportStats = (params) => {
    const { stats, spec, assertions, titlePath, profileName, noFixture, fixture } = params
    const newTest = {
        stats,
        spec,
        profileName,
        titlePath,
        assertions,
        noFixture,
        fixture
    }
    context.tests.push(newTest)
    if (context.notify) {
        context.notify(false)
        context.waitUpdate = new Promise (resolve => {
            context.notify = (isInterrupted) => {
                resolve(isInterrupted)
            }
        })
    }
    return {}
}

app.post('/setFixtures', async (req, resp) => {
    const { data, profileName , fixtureName, spec, titlePath } = req.body
    const index = _.findIndex(context.fixtures, f => f.fixtureName === fixtureName)
    if (index < 0) {
        context.fixtures.push({
            fixtureName, data, profileName, spec, titlePath
        })
    } else {
        context.fixtures[index] = {
            fixtureName, data, profileName, spec, titlePath
        }
    }
    resp.sendStatus(200)
})

app.post('/unsetFixtures', async (req, resp) => {
    const { fixtureNames, unsetFixtureName } = req.body
    if (unsetFixtureName) {
        _.remove(context.fixtures, f => f.fixtureName === unsetFixtureName)
    }
    if (fixtureNames) {
        _.remove(context.fixtures, f => !_.includes(fixtureNames, f.fixtureName))
    }
    resp.sendStatus(200)
})

app.post('/getStats', async (req, resp) => {
    if (context.waitUpdate) {
        context.notify(true)
        context.waitUpdate = new Promise (resolve => {
            context.notify = (interrupt) => {
                resolve(interrupt)
            }
        })
    }
    if (_.isEmpty(context.tests)) {
        if (!context.waitUpdate) {
            context.waitUpdate = new Promise (resolve => {
                context.notify = (interrupt) => {
                    resolve(interrupt)
                }
            })
        } else {
            const isInterrupted = await context.waitUpdate
            if (isInterrupted) {
                await resp.json({ isInterrupted })
                return
            }
        }
    }
    await resp.json(context.tests)
})

app.post('/resetStats', async (req, resp) => {
    const { fixtures } = req.body
    _.remove(context.tests, test => {
        for (const fixture of fixtures) {
            if (_.isEqual(fixture.titlePath, test.titlePath) && _.isEqual(fixture.spec, test.spec)) {
                return true
            }
        }
        return false
    })
    resp.sendStatus(200)
})

app.get('/getPluginVersion', async (req, resp) => {
    resp.json({ version: PLUGIN_VERSION })
})