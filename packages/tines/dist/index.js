
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./tines.cjs.production.min.js')
} else {
  module.exports = require('./tines.cjs.development.js')
}
