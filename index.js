const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI)

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
})
const exerciseSchema = new mongoose.Schema({
  userId: {
    type: Object,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: Date
})

const User = mongoose.model('user', userSchema)
const Exercise = mongoose.model('exercise', exerciseSchema)

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

app.get('/api/test', (req, res) => {
  User.findById('66205c88b4f994e9ddf128e3')
    .then((result) => {
      res.json({
        _id: result._id,
        username: result.username
      })
    })
})

app.route('/api/users')
  .get((req, res) => {
    User.find({})
      .then(results => {
        res.json(results)
      })
  })
  .post((req, res) => {
    try {
      User.findOne({ username: req.body.username })
        .then((results, err) => {
          if (err) throw err

          if (results == null) {
            const newUser = new User({ username: req.body.username })
            newUser.save()
              .then((user) => {
                res.json({
                  username: user.username,
                  _id: user._id
                })
              })
          } else {
            res.json({ error: `Username ${req.body.username} already exists in the database.` })
          }
        })
    } catch (error) {
      res.json({ error: error })
    }
  })

app.route('/api/users/:_id/exercises')
  .post((req, res) => {
    const exerciseDoc = new Exercise({
      userId: req.params._id,
      description: req.body.description,
      duration: req.body.duration,
      date: (req.body.date) ? new Date(req.body.date) : new Date()
    })

    exerciseDoc.save()
      .then((exercise) => {
        User.findById(req.params._id)
          .then((result) => {
            res.json({
              username: result.username,
              description: exercise.description,
              duration: exercise.duration,
              date: exercise.date.toDateString(),
              _id: result._id
            })
          })
      })
  })

app.route('/api/users/:_id/logs')
  .get((req, res) => {
    User.findById(req.params._id)
      .then((user) => {
        Exercise.find({
          userId: req.params._id,
          date: {
            $gte: (req.query.from) ? new Date(req.query.from) : new Date(0),
            $lte: (req.query.to) ? new Date(req.query.to) : new Date()
          }
        })
          .select('description duration date -_id')
          .limit(req.query.limit)
          .then((exercises) => {
            res.json({
              username: user.username,
              count: exercises.length,
              _id: user._id,
              log: exercises.map((obj) => {
                return {
                  description: obj.description,
                  duration: obj.duration,
                  date: obj.date.toDateString()
                }
              })
            })
          })
      })
  })

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
