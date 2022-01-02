const { serverContext, startServer, stopServer, reportStats } = require('./server')
const _ = require('lodash')

module.exports.plugin = (on, config) => {
    startServer(config)
    on('task', {
        'constellation:fixture': async ({ titlePath, spec }) => {
            if (serverContext && serverContext.fixtures) {
                let found
                for (const fixture of serverContext.fixtures) {
                    if (spec === fixture.spec && _.isEqual(titlePath, fixture.titlePath)) {
                        found = fixture
                    }
                }
                if (found) {
                    return {
                        data: found.data,
                        profileName: found.profileName
                    }
                }
            }
            return {
                noData: true
            }
        },
        'constellation:reportStats': async (params) => {
            return reportStats(params)
        }
    })
    return config
}
