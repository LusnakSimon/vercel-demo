const { deleteSessionBySid } = require('../../lib/sessions');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  
  try {
    // Parse sid from cookie
    const cookieHeader = req.headers && (req.headers.cookie || req.headers.Cookie || '');
    const cookies = cookieHeader.split(';').map(s=>s.trim()).reduce((acc,c)=>{ const [k,v]=c.split('='); acc[k]=v; return acc; },{});
    const sid = cookies && cookies.sid;
    
    if (sid) {
      await deleteSessionBySid(sid);
    }
    
    // Clear cookie
    res.setHeader('Set-Cookie', 'sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
};
