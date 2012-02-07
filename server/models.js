var Schema = require('mongoose').Schema;
var ObjectId = Schema.ObjectId;
/**
  * Model: Note
  */
var Note = new Schema({
  'created_at': {
    'type': Date,
    'default': Date.now
  },
  'content': String
});
/**
  * Model: Task
  */
var Task = new Schema({
  'checked': {
    'type': Boolean,
    'default': false
  },
  'created_at': {
    'type': Date,
    'default': Date.now
  },
  'priority': {
    'type': Number,
    'default': 0
  },
  'notes': [Note],
  'hidden': {
    'type': Boolean,
    'default': false
  },
  'content': {
    'type': String,
    'required': true
  },
  'user_id': String
});
/**
  * Model: TaskArchive
  */
var TaskArchive = new Schema({
  'user_id': String,
  'date_text': String,
  'created_at': {
    'type': Date,
    'default': Date.now
  },
  'task': {
    'type': ObjectId,
    'ref': 'Task'
  }
});
/**
  * Model: TasksCurrent
  */
var TasksCurrent = new Schema({
  'user_id': String,
  'task': {
    'type': ObjectId,
    'ref': 'Task'
  }
});
/**
  * Model: User
  */
var User = new Schema({
  '_id': {
    type: String,
    index: true,
    unique: true
  },
  'name': String,
  'profile_image_url': String,
  'created_time': {
    'type': Date,
    'default': Date.now
  },
  'access_token': String
});
var nameToSchemaMap = {
  Task: Task,
  TaskArchive: TaskArchive,
  TasksCurrent: TasksCurrent,
  User: User
};
module.exports = function(db, modelName) {
  var schema = nameToSchemaMap[modelName];
  if (!schema) {
    throw Error('Model unknown');
  }
  return db.model(modelName, schema);
};