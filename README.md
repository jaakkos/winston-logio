# winston-loggly

A [Log.io][0] transport for [winston][1].

## Usage
``` js
  var winston = require('winston');

  //
  // Requiring `winston-logio` will expose
  // `winston.transports.Logio`
  //
  require('winston-logio');

  winston.add(winston.transports.Logio, {
    port: 28777,
    node_name: 'my node name',
    host: '127.0.0.1'
  });
```

## Inspiration
[winston-loggly][2]

## Run Tests

```
  npm test
```

#### Author: [Jaakko Suutarla](https://github.com/jaakkos)
#### License: MIT

[0]: http://logio.org/
[1]: https://github.com/flatiron/winston
[2]: https://github.com/indexzero/winston-loggly