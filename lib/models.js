function defineModels(mongoose, fn) {
  var Schema = mongoose.Schema;
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

  mongoose.model('Task', Task);
  mongoose.model('TasksArchive', TasksArchive);
  mongoose.model('TasksCurrent', TasksCurrent);
  mongoose.model('User', User);

  fn();
}

exports.defineModels = defineModels;