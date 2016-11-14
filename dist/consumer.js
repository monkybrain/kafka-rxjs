var Promise, R, Rx, consumers, exitGracefully, isJSON, kafka, makeTopicArray, parseMessage, setOffsets, signals;

Rx = require('rxjs');

R = require('ramda');

Promise = require('promise');

isJSON = require('is-json');

kafka = require('kafka-node');


/* PRIVATE */

makeTopicArray = function(topics) {
  var fn;
  fn = function(topic) {
    if (topic.topic == null) {
      return {
        topic: topic
      };
    } else {
      return topic;
    }
  };
  return R.map(fn, topics);
};

setOffsets = function(consumer, topics) {
  var fn;
  fn = function(topic) {
    var partition;
    if (topic.offset != null) {
      partition = topic.partition != null ? topic.partition : 0;
      return consumer.setOffset(topic.topic, partition, topic.offset);
    }
  };
  return R.forEach(fn, topics);
};

parseMessage = function(message) {
  return {
    topic: message.topic,
    offset: message.offset,
    key: message.key.toString(),
    value: isJSON(message.value) ? JSON.parse(message.value) : message.value
  };
};

consumers = [];


/* PUBLIC */

exports.consume = function(options) {
  return Rx.Observable.create(function(observer) {
    var client, consumer, topics;
    client = new kafka.Client(options.connectionString || 'localhost:2181');
    topics = makeTopicArray(options.topics);
    options = {
      groupId: options.groupId || 'kafka-rxjs'
    };
    consumer = new kafka.HighLevelConsumer(client, topics, options);
    consumers.push(consumer);
    consumer.on('registered', function() {
      return consumer.once('done', function() {
        return setOffsets(consumer, topics);
      });
    });
    return consumer.on('message', function(message) {
      return observer.next(parseMessage(message));
    });
  });
};

exitGracefully = function(signal) {
  return process.on(signal, function() {
    var close;
    close = function(consumer) {
      return new Promise(function(resolve, reject) {
        return consumer.close(true, function() {
          return resolve();
        });
      });
    };
    return Promise.all(R.map(close, consumers)).then(function() {
      return process.exit();
    });
  });
};

signals = ['SIGINT', 'SIGTERM'];

R.forEach(exitGracefully, signals);
