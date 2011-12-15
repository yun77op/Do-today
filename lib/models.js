var Task, TasksArchive;

function defineModels(mongoose, fn) {
  var Schema = mongoose.Schema,
      ObjectId = Schema.ObjectId;

  /**
    * Model: Task
    */
  Task = new Schema({
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
  TasksArchive = new Schema({
    'dateText': String,
    'user_id': String,
    'sessions': [{
      'taskId': ObjectId,
      'start': Number,
      'end': Number,
      'time': {
        type: Date,
        default: Date.now
      }
    }]
  });


  mongoose.model('Task', Task);
  mongoose.model('TasksArchive', TasksArchive);

  fn();
}

exports.defineModels = defineModels; 