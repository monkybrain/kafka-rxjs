Rx = require 'rxjs'
R = require 'ramda'
isJSON = require 'is-json'
kafka = require 'kafka-node'

### PRIVATE ###

# Helpers
makeTopicArray = (topics) ->
  fn = (topic) ->
    if not topic.topic? then topic: topic
    else topic
  R.map fn, topics

setOffsets = (consumer, topics) ->
  fn = (topic) ->
    if topic.offset?
      partition = if topic.partition? then topic.partition else 0
      consumer.setOffset topic.topic, partition, topic.offset
  R.forEach fn, topics

parseMessage = (message) ->
  topic: message.topic
  offset: message.offset
  key: message.key.toString()
  value: if isJSON(message.value) then JSON.parse(message.value) else message.value

# State handlers
consumers = []

### PUBLIC ###
exports.consume = (options) ->

  Rx.Observable.create (observer) ->

    # Register consumer
    client = new kafka.Client options.connectionString || 'localhost:2181'
    topics = makeTopicArray options.topics
    kafkaNodeTopics = R.clone topics
    kafkaNodeOptions =
      groupId: options.groupId || 'kafka-rxjs'
      autoCommit: true
    consumer = new kafka.HighLevelConsumer client, kafkaNodeTopics, kafkaNodeOptions

    # Push consumer to consumer array
    consumers.push consumer

    # On 'registered' -> set offsets
    consumer.on 'registered', ->
      consumer.once 'done', ->
        setOffsets(consumer, topics)

    # On 'message' -> push to stream
    consumer.on 'message', (message) ->
      observer.next parseMessage(message)

# Exit gracefully on KILL signals
exitGracefully = (signal) ->
  process.on signal, ->
    close = (consumer) ->
      new Promise (resolve, reject) ->
        consumer.commit (err, data) ->
          consumer.close true, ->
            resolve()

    Promise.all R.map(close, consumers)
    .then -> process.exit()

signals = ['SIGINT', 'SIGTERM']
R.forEach exitGracefully, signals
