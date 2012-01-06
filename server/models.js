
module.exports = function(db, modelName) {
  var Schema = db.Schema;
  var ObjectId = Schema.ObjectId;

  /**
    * Model: Task
    */
  var Task = new Schema({
    'progress': {
      'type': Number,
      'default': 0
    },
    'priority': {
      'type': Number,
      'default': 0
    },
    'notes': [{
      'time': {
        'type': Date,
        'default': Date.now
      },
      'content': String
    }],
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
    * Model: TasksArchive
    */
  var TasksArchive = new Schema({
    'dateText': String,
    'user_id': String,
    'sessions': [{
      'task_id': ObjectId,
      'start': Number,
      'end': Number,
      'created_at': {
        'type': Date,
        'default': Date.now
      }
    }]
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

  db.model('Task', Task);
  db.model('TasksArchive', TasksArchive);
  db.model('TasksCurrent', TasksCurrent);
  db.model('User', User);

  return db.model(modelName);
};