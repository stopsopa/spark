'use strict';

require("glob").sync(__dirname + '/**/test*.jsx').forEach(require);