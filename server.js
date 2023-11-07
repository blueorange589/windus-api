/** @license
 * 4ft <https://github.com/blueorange589/4ft>
 * Author: Ozgur Arslan | MIT License
 * v0.1 (2023/10/07)
 */
const express = require('express')
const cors = require('cors')
const session = require('express-session')
const {query, auth} = require('./supabase.js')
const {dbquery} = require('./mariadb.js')
const server = express()
const hostname = '0.0.0.0'
const port = 3000

server.use(cors())
server.use(express.json());
server.use(session({ secret: 'atu19.', resave: false, saveUninitialized: true }))

// middleware to test if authenticated
function isAuthenticated (req, res, next) {
  console.log(req.session)
  if (req.session.user) next()
  else res.send({data:{}, error: {msg: 'auth required'}})
}


// server.post('/api/db/query', isAuthenticated, async(req, res) => {
server.post('/api/db/query', async(req, res) => {
  const result = await dbquery(req.body)
  res.send(result)
})

server.post('/api/sb/query', async(req, res) => {
  const result = await query(req.body)
  res.send(result)
})

const saveSession = (req, res, data) => {
  req.session.save(function (err) {
    if (err) next(err)

    const {access_token, refresh_token, expires_at} = data.session
    // store user information in session, typically a user id
    req.session.user = data.user
    req.session.data = {access_token, refresh_token, expires_at}

    // save the session before redirection to ensure page
    // load does not happen before session is saved
    req.session.save(function (err) {
      if (err) return next(err)
      res.send({user:data.user})
    })
  })
}

const logout = (req) => {
  req.session.user = null
  req.session.data = null
  req.session.save(function (err) {
    if (err) next(err)
    req.session.regenerate(function (err) {
      if (err) next(err)
    })
  })
}

server.post('/api/db/signin', async(req, res) => {
  const {email, password} = req.body
  const now = new Date().toISOString().replace('T',' ').slice(0, -5)
  const result = await dbquery({run:'select', from: 'wd_users', match: {email, password}, select: ['id', 'email', 'fullname', 'role']})
  let data = {}
  if(result.data.length === 1) {
    const user = result.data[0]
    data = {user, session: {}}
    data.session.access_token = '29e09c71-7a86-11ee-971a-ef88ddba0d10'
    data.session.refresh_token = '4aa196b5-7b43-11ee-96b4-ee83c75e7d5a'
    data.session.expires_at = '2024-01-01 00:00:01'
    const upd = await dbquery({run:'update', from: 'wd_users', match: {email, password}, data: {last_login: now}})
    saveSession(req, res, data); 
    return 
  }
  res.send(result)
})

server.post('/api/sb/signin', async (req, res) => {
  const result = await auth.signIn(req.body)
  if(result.data.session) { saveSession(req, res, result.data); return }
  res.send(result)
})

server.post('/api/sb/social', async (req, res) => {
  const result = await auth.signInSocial(req.body)
  res.send(result)
})

server.post('/api/db/signout', async (req, res) => {
  logout(req)
  res.send({success: true})
})

server.post('/api/sb/signout', async (req, res) => {
  const result = await auth.signOut(req.body)
  logout(req)
  res.send(result)
})

server.post('/api/sb/signup', async (req, res) => {
  const result = await auth.signUp(req.body)
  res.send(result)
})

server.post('/api/sb/resetpwd', async (req, res) => {
  const result = await auth.resetPassword(req.body)
  res.send(result)
})

server.post('/api/file/getHtml', async(req, res) => {
  const {name} = req.body
  const result = await fileHandler.read(name)
  res.send({"data":{"html":result}})
})

server.post('/api/file/getJson', async(req, res) => {
  const {name} = req.body
  const result = await fileHandler.read(name)
  res.send(result)
})

server.post('/api/file/getDir', async(req, res) => {
  const {name} = req.body
  const result = await fileHandler.readDir(name)
  res.send({"data": result})
})

server.post('/api/file/save', async(req, res) => {
  const {name, data} = req.body
  const result = await fileHandler.write(name, data)
  res.send({'data': result})
})





server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})


// Export the Express API
module.exports = server;