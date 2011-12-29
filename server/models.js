
module.exports = function(db, modelName) {
  var Schema = db.Schema;
  var ObjectId = Schema.ObjectId;

  /**
    * Model: Task
    */
  var Task = new Schema({
    'percent': Number,
    'priority': Number,
    'notes': [{
      'time': {
        type: Date,
        default: Date.now
      },
      'content': String
    }],
    'hidden': Boolean,
    'content': String,
    'user_id': String
  });

  /**
    * Model: TasksArchive
    */
  var TasksArchive = new Schema({
    'dateText': String,
    'user_id': String,
    'sessions': [{
      'taskId': ObjectId,
      'start': Number,
      'end': Number,
      'created_at': {
        type: Date,
        default: Date.now
      }
    }]
  });

  /**
    * Model: TasksCurrent
    */
  var TasksCurrent = new Schema({
    'user_id': String,
    'tasks': [ObjectId]
  });

  /**
    * Model: User
    */
  var User = new Schema({
    '_id': {type: String, index: true},
    'name': String,
    'profile_image_url': String,
    'created_time': {
      type: Date,
      default: Date.now
    },
    'access_token': String
  });

  /**
    * Model: TasksCurrent
    */
  var TasksCurrent = new Schema({
    'task_id': ObjectId
  });

  db.model('Task', Task);
  db.model('TasksArchive', TasksArchive);
  db.model('TasksCurrent', TasksCurrent);
  db.model('User', User);

  return db.model(modelName);
}