/** @license
 * 4ft <https://github.com/blueorange589/4ft>
 * Author: Ozgur Arslan | MIT License
 * v0.1 (2023/10/07)
 */
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)


const query = async(q) => {
  // console.log(q)
  
  let cl = {}

  if (q.run === "select") {
    const sel = q.select ? q.select.join(',') : '*'
    cl = supabase.from(q.from).select(sel)
  }

  if (q.run === "insert") {
    cl = supabase.from(q.from).insert(q.data)
  }

  if (q.run === "update") {
    cl = supabase.from(q.from).update(q.data)
  }

  if (q.run === "delete") {
    cl = supabase.from(q.from).delete()
  }

  // matchers
  if (q.eq) { 
    Object.keys(q.eq).forEach(col => {
      console.log(col, q.eq[col])
      cl.eq(col, q.eq[col])
    })
  }
  if(q.match) { cl.match(q.match) }
  if (q.gt) { cl.gt(q.gt) }
  if (q.lt) { cl.lt(q.lt) }

  // sorting
  if (q.order) {
    const cols = Object.keys(q.order)
    cols.forEach(col => {
      const ascending = q.order[col] === 'asc' ? true : false
      cl.order(col, { ascending })
    })
  }

  if (q.single) {
    cl.single()
  }

  const { data, error } = await cl
  // console.log(data, error)
  return { data, error }
};

const auth = {
  getSession: async() => {
    const { data, error } = await supabase.auth.getSession()
    //const session = supabase.auth.session()
    return { data, error }
  },
  refreshSession: async() => {
    // using refresh token
    const { data, error } = await supabase.auth.refreshSession({ refresh_token })

    // create new session
    // const { data, error } = await supabase.auth.refreshSession()
    return { data, error }
  },
  signIn: async(params) => {
    console.log(params)
    const { data, error } = await supabase.auth.signInWithPassword(params)
    return { data, error }
  },
  signInSocial: async(params) => {
    // {provider: 'github'}
    const { data, error } = await supabase.auth.signInWithOAuth(params)
    return { data, error }
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },
  signUp: async (params) => {
    // login: email, password
    // data: columns
    const { data, error } = await supabase.auth.signUp(params.login, params.data)
    return { data, error }
  },
  resetPassword: async (params) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(params.email, {
      redirectTo: 'https://example.com/update-password',
    })
    return { data, error }
  },
  setSession: async() => {
    // const session = auth.getSession()
    // const { user, error } = await supabase.auth.setAuth(session.access_token)
    // return { user, error }

    const { data, error } = supabase.auth.setSession({access_token, refresh_token})
    return { data, error }
  },
  getUserFromSession: async() => {
    const session = auth.getSession()
    const { data, error } = await supabase.auth.getUser() 

    // using jwt
    // const { user, error } = await supabase.auth.getUser(jwt) 

    return { data, error }
  },
  getUser: async() => {
    const user = await supabase.auth.user()
    return { user }
  }
}

const storage = () => {
  return supabase.storage
}

module.exports = {query, auth, storage};