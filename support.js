
beforeEach( function () {
    const spec = Cypress._.get(Cypress.spec, 'relative')
    const titlePath = Cypress._.get(Cypress.currentTest, 'titlePath')
    return cy.task('constellation:fixture', { spec, titlePath }).then(resp => {
        const _constellationContext = {
            chainId: 0,
            fixture: null,
            stats: {},
            assertions: [],
            profileName: null,
            noData: false
        }
        if (resp.data) {
            _constellationContext.fixture = resp.data
            _constellationContext.profileName = resp.profileName
        }
        if (resp.noData) {
            _constellationContext.noData = true
        }
        cy.wrap(_constellationContext).as('_constellationContext')
    })
})

Cypress.Commands.overwrite('should',function (originalFn, subject, assertion, ...args) {
    if (!this || !this._constellationContext) {
        return originalFn(subject, assertion, ...args)
    }
    const contains = this._constellationContext.contains
    if ((subject.selector && subject.selector.startsWith(':cy-contains')) || contains) {
        subject.selector = contains
        delete this._constellationContext.contains
    }
    if (subject.selector) {
        if (Cypress._.isFunction(assertion)) {
            console.log('assertion is a function')
        } else {
            const index = Cypress._.findIndex(this._constellationContext.assertions, rec =>
                rec.command === 'should' &&
                rec.selector === subject.selector &&
                rec.assertion === assertion &&
                Cypress._.isEqual(rec.value, args) &&
                rec.chainId === this._constellationContext.chainId
            )
            if (index < 0) {
                this._constellationContext.assertions.push({
                    command: 'should',
                    selector: subject.selector,
                    assertion,
                    value: args,
                    chainId: this._constellationContext.chainId
                })
            }
            let same = 0
            for (const rec of this._constellationContext.assertions) {
                if (rec.command === 'should' &&
                    rec.selector === subject.selector &&
                    rec.assertion === assertion) {
                    same++
                }
            }
            let key = `should/${assertion}/${subject.selector}`
            if (same > 1) {
                key = `should/${assertion}/${subject.selector}/${same - 1}`
            }
            if (!(key in this._constellationContext.stats)) {
                this._constellationContext.stats[key] = 1
            } else {
                this._constellationContext.stats[key]++
            }
            if (this._constellationContext.fixture && (key in this._constellationContext.fixture)) {
                if (null === this._constellationContext.fixture[key]) {
                    return Promise.resolve(subject)
                } else {
                    const result = (async () => {
                        try {
                            return await originalFn(subject, assertion, ...this._constellationContext.fixture[key])
                        } catch (e) {
                            return await originalFn(subject, assertion, ...args)
                        } finally {
                        }
                    })()
                    return result
                }
            }
        }
    }
    return originalFn(subject, assertion, ...args)
})

Cypress.Commands.overwrite('get', function (originalFn, subject, a, b) {
    if (this && this._constellationContext) {
        this._constellationContext.chainId++
        delete this._constellationContext.contains
    }
    return originalFn(subject, a, b)
})

Cypress.Commands.overwrite('contains', function(originalFn, subject, text) {
    if (this && this._constellationContext) {
        this._constellationContext.contains = `${subject ? subject.selector : ''} contains "${text}"`
    }
    return originalFn(subject, text)
})

Cypress.Commands.overwrite('and', function (originalFn, subject, assertion, ...args) {
    if (!this || !this._constellationContext) {
        return originalFn(subject, assertion, ...args)
    }
    const contains = this._constellationContext.contains
    if ((subject.selector && subject.selector.startsWith(':cy-contains')) || contains) {
        subject.selector = contains
        delete this._constellationContext.contains
    }
    if (subject.selector) {
        if (Cypress._.isFunction(assertion)) {
            console.log('assertion is a function')
        } else {
            const index = Cypress._.findIndex(this._constellationContext.assertions, rec =>
                rec.command === 'and' &&
                rec.selector === subject.selector &&
                rec.assertion === assertion &&
                Cypress._.isEqual(rec.value, args) &&
                rec.chainId === this._constellationContext.chainId
            )
            if (index < 0) {
                this._constellationContext.assertions.push({
                    command: 'and',
                    selector: subject.selector,
                    assertion,
                    value: args,
                    chainId: this._constellationContext.chainId
                })
            }
            let same = 0
            for (const rec of this._constellationContext.assertions) {
                if (rec.command === 'and' &&
                    rec.selector === subject.selector &&
                    rec.assertion === assertion) {
                    same++
                }
            }
            let key = `should/${assertion}/${subject.selector}`
            if (same > 1) {
                key = `should/${assertion}/${subject.selector}/${same - 1}`
            }
            if (!(key in this._constellationContext.stats)) {
                this._constellationContext.stats[key] = 1
            } else {
                this._constellationContext.stats[key]++
            }
            if (this._constellationContext.fixture && (key in this._constellationContext.fixture)) {
                if (null === this._constellationContext.fixture[key]) {
                    return Promise.resolve(subject)
                } else {
                    const result = (async () => {
                        try {
                            return await originalFn(subject, assertion, ...this._constellationContext.fixture[key])
                        } catch (e) {
                            return await originalFn(subject, assertion, ...args)
                        } finally {
                        }
                    })()
                    return result
                }
            }
        }
    }
    return originalFn(subject, assertion, ...args)
})

afterEach( function () {
    let spec = Cypress._.get(Cypress.spec, 'relative')
    let titlePath = Cypress._.get(Cypress.currentTest, 'titlePath')
    const data = {
        profileName: this._constellationContext.profileName,
        stats: this._constellationContext.stats,
        spec,
        titlePath,
        assertions: this._constellationContext.assertions
    }

    if (this._constellationContext.noData) {
        data.noFixture = true
    } else {
        data.noFixture = false
        data.fixture = this._constellationContext.fixture
    }

    const body = JSON.stringify(data)

    cy.task('constellation:reportStats', data)
})
