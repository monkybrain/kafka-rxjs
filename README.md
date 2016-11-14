# kafka-rxjs

Module for simple Apache Kafka / RxJS integration.

Based on [kafka-node](https://github.com/SOHU-Co/kafka-node).

So far only a simple consumer interface has been implemented

Status: prototype with no proper error handling (you have been warned! :-) )

### Install

`npm install kafka-rxjs`

or

`npm install kafka-rxjs --no-optional`

to prevent [kafka-node](https://github.com/SOHU-Co/kafka-node) from building [snappy](https://github.com/kesla/node-snappy) binaries

### Usage

```
kRx = require 'kafka-rxjs'

kRx.consume({
  connectionString: 'localhost:2181'	# Zookeeper connection string (default: 'localhost:2181')
  topics: [
    {topic: 'topic1'}					# Consume from last commited offset
    {topic: 'topic2', offset: 0}		# Consume from specified offset
    {topic: 'topic2', partition: 1}		# Consume from specified partition (default: 0)
	],
  groupId: 'my-group-id'				# Default: 'kafka-rxjs'
}).subscribe(function(message) {
	console.log(message)
});

// e.g. output:
{
  topic: 'topic1',
  key: 'abc123',
  offset: 0,
  value: {					# Will parse if valid JSON string
    a: 'test'
    b: 0
  }
}
```
