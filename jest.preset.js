const nxPreset = require('@nrwl/jest/preset').default;

module.exports = { ...nxPreset, testEnvironment: 'node', coverageReporters: ['html', 'json'] };
