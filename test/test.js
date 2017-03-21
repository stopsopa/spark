'use strict';

require("glob").sync(__dirname + '/**/test*.js').forEach(require);