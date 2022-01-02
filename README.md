# Cypress Profiler
Make Cypress automated tests run faster.

The number of times Cypress retries commands during assertions is measured
to provide you a profiling report.

Analyze and optimize assertion command retries to speed up tests without compromising reliability.

## How does it work?
### Command retry-ability and chaining
Retry-ability is a Cypress feature that makes testing dynamic js apps easy.
Consider the following example:
```js
cy.get('button').should('be.visible')
```
When you run this test, Cypress retries `should()` command until the button becomes visible or timeout expires.
During this time Cypress makes subsequent commands wait.

There may be various reasons why DOM doesn't reach the expected state instantly, and assertions have to be retried:
* Network requests
* Animations
* Other asynchronous operations (eg. `setTimeout()`)

Profiler measures the number of command retries in order to detect slow assertions.

### Guards and Test Reliability
Modern js apps are highly dynamic, and bring more challenges to writing reliable tests.
Test failure may occur when a test script modifies app state, based on a wrong assumption about the actual current state.

Cypress assertions often have two functions: making an assertion, and being a guard, preventing next action from being executed,
until app reaches a known state.

If we consider a web app's under test state as a shared resource between app logic and test spec logic,
then the process of testing looks like:
```
- Invoke app logic
- Wait until app reaches a known state
- Wait until DOM reflects app state change
- Invoke next action.
```
Test speed can be increased if next action could be invoked as early as app has reached a known state, and
automated test can detect the transition.

### False-positive assertions
Profiler makes it possible to interpolate app transitioning from previous to the expected state, and invoke next 
automated test action earlier by skipping assertion guards.

This is achieved with the help of false positive assertions. Profiler plugin
overwrites `should()` command so that assertion's condition can be evaluated
against intermediate target values or skipped completely.

For example: if animation changes style of an element, assertion can be passed
in the beginning of the animation by comparing current DOM value to an intermediate target.

### Assertion retries optimization
Measuring retries:

* Install a plugin and start Cypress in the interactive mode
* Open Profiler App
* Click `Start Profiling` button
* Run test specs in Cypress App
* Check profiling results in the Profiler App

If you notice that a command retried more than once, use Profiler App
to make a false positive assertion and simulate skipping a guard.

* Click `Optimize` in a context menu
* Navigate to the test under optimization
* Open `Fixture` tab and select a "slow" assertion.
* Turn on `Simulate skipping assertion retries` to make assertion skip-able.
* Each time you re-run tests in a Cypress App, profiler will "switch off"
various combinations of assertions.
* Find and save combinations of skipped assertions that don't cause test failures

It is possible not to skip assertion completely, but let it pass
when assertion with intermediate target arguments is true.
For example: an element changes text from `0` to `2`, and we know that once it becomes `1`
application has reached a known state. We can set assertion to compare value to `1`
and stop retrying earlier than when the value reaches `2`.

* Open `Fixture` tab and select a "slow" assertion
* Click `+` button on `Argument Options` toolbar
* Enter and save arguments for intermediate state assertion.

### Configuring random sampling
If some combinations of skipped assertions are not possible, navigate
to the `Invariants` tab in the Profiler App and exclude them with the help
of conditional statements.

If you expect that a particular combination of skipped, early triggered, and original assertions 
consistently reflects a stable app state, add this combination on the `States` tab.
This will make optimizer to get values similar to a reference state more often.

## Installation
```
npm install --save-dev @constellation-cloud/core
```

Add the following lines to `cypress/plugins/index.js`

```javascript
const constellation = require('@constellation-cloud/core')

module.exports = (on, config) => {
    return constellation.plugin(on, config)
}
```

Add the following line to `cypress/support/index.js`
```javascript
require('@constellation-cloud/core/support')
```

To start a profiler, run cypress in the interactive mode:

```npx cypress open```

and open the [Profiler App](https://www.constellation.xyz/).  