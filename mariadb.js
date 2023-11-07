/** @license
 * 4ft <https://github.com/blueorange589/4ft>
 * Author: Ozgur Arslan | MIT License
 * v0.1 (2023/10/07)
 */

require('dotenv').config()
const mariadb = require('mariadb');
const pool = mariadb.createPool({
     host: process.env.MARIADB_HOST, 
     database: process.env.MARIADB_DB, 
     user:process.env.MARIADB_USER, 
     password: process.env.MARIADB_PASS,
     connectionLimit: 5
});

const dbquery = async(q) => {
  // console.log(q)
  const conn = await pool.getConnection();
  let qt = ""
  let params = []

  if (q.run === "select") {
    const sel = q.select ? q.select.join(',') : '*'
    qt = `SELECT ${sel} FROM ${q.from}`
  }

  if (q.run === "insert") {
    const cols = Object.keys(q.data).join(', ')
    const marks = Object.keys(q.data).map((v,i) => { return '?'})
    const mlist = marks.join(', ')
    qt = `INSERT INTO ${q.from} (${cols}) VALUES (${mlist})`
    params = Object.values(q.data)
  }

  if (q.run === "update") {
    const vals = Object.keys(q.data).map((v,i) => { return v+'=?'})
    qt = `UPDATE ${q.from} SET ${vals}`
    params = Object.values(q.data)
  }

  if (q.run === "delete") {
    qt = `DELETE FROM ${q.from}`
  }

  // matchers
  let where = false
  if (q.eq) { 
    if(!where) { qt += ' WHERE '; where = true }
    const keys = Object.keys(q.eq)
    qt += keys.length>1 ? keys.join('=?, ') : `${keys[0]} = ?`
    const vals = Object.values(q.eq)
    params = [...params, ...vals]
  }
  if(q.match) { 
    if(!where) { qt += ' WHERE '; where = true }
    const keys = Object.keys(q.match)
    qt += keys.length>1 ? keys.join('=? AND ')+'=?' : `${keys[0]} = ?`
    const vals = Object.values(q.match)
    params = [...params, ...vals]
  }
  if (q.gt) { 
    if(!where) { qt += ' WHERE '; where = true }
    const keys = Object.keys(q.gt)
    qt += keys.length>1 ? keys.join('>?, ') : `${keys[0]} > ?`
    const vals = Object.values(q.gt)
    params = [...params, ...vals]
  }
  if (q.lt) { 
    if(!where) { qt += ' WHERE '; where = true }
    const keys = Object.keys(q.lt)
    qt += keys.length>1 ? keys.join('<?, ') : `${keys[0]} < ?`
    const vals = Object.values(q.lt)
    params = [...params, ...vals]  
  }

  // sorting
  if (q.order) {
    qt += ' ORDER BY ';
    const cols = Object.keys(q.order)
    const os = cols.map((col,i) => { 
      const dir = q.order[col]
      return `${col} ${dir}`
    })
    qt += os.join(',')
  }

  // limit
  if (q.limit) {
    qt += ' LIMIT ';
    qt += q.limit.join(',')
  }

  if (q.single) {
    //cl.single()
  }

  let error = {}, data = {}
  const res = await conn.query(qt, params);
  // console.log(Object.entries(res, ['affectedRows', 'warningStatus']))

  if(typeof(res.affectedRows) !== 'undefined') {
    data.affectedRows = res.affectedRows
  } else {
    data = res
  }

  if (conn) { conn.end() }
  return { data, error }
};

module.exports = {dbquery};