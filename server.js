const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// Database Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '2005',
  database: 'employee_portal'
});


db.connect(err => {
  if (err) throw err;
  console.log('✅ Connected to MySQL Database');
});

// ------------------ Multer for file uploads ------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// ------------------ Routes ------------------

// Register
app.post('/register', (req, res) => {
  const { id, username, password, email, dob, gender, role } = req.body;
  if (!id || !username || !password || !email || !dob || !gender || !role)
    return res.json({ success: false, message: 'Missing fields' });

  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) return res.status(500).json({ success: false });
    if (results.length > 0) return res.json({ success: false, message: 'Username exists' });

    db.query(
      'INSERT INTO users (id_number, username, password, email, dob, gender, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, username, password, email, dob, gender, role],
      err => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
      }
    );
  });
});

// Login
app.post('/login', (req, res) => {
  const { username, password, role } = req.body;
  db.query('SELECT * FROM users WHERE username = ? AND password = ? AND role = ?', [username, password, role], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length > 0) {
      const user = results[0];
      res.json({ success: true, user });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  });
});

// View all employees
app.get('/employees', (req, res) => {
  db.query("SELECT * FROM users WHERE role = 'employee'", (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(results);
  });
});

// Fire employee
app.delete('/fire/:id', (req, res) => {
  db.query('DELETE FROM users WHERE id_number = ?', [req.params.id], err => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, message: 'Employee fired' });
  });
});

// Submit report
app.post('/submit-report', upload.single('reportFile'), (req, res) => {
  const { empId, reportText } = req.body;
  const filePath = req.file ? req.file.filename : null;
  db.query('INSERT INTO reports (emp_id, report_text, file_path) VALUES (?, ?, ?)', [empId, reportText, filePath], err => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

// Update salary
app.post('/update-salary', (req, res) => {
  const { empId, amount } = req.body;
  db.query('UPDATE users SET salary = ?, claimed = false WHERE id_number = ?', [amount, empId], err => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

// Claim salary
app.post('/claim-salary', (req, res) => {
  const { empId, amount } = req.body;
  db.query('SELECT salary, claimed FROM users WHERE id_number = ?', [empId], (err, results) => {
    if (err) return res.status(500).json({ success: false });
    if (results.length === 0) return res.json({ success: false, message: 'Not found' });

    const { salary, claimed } = results[0];
    if (claimed) return res.json({ success: false, message: 'Already claimed' });

    db.query('INSERT INTO salary_claims (emp_id, amount, status) VALUES (?, ?, "Pending")', [empId, amount], err => {
      if (err) return res.status(500).json({ success: false });
      db.query('UPDATE users SET claimed = true WHERE id_number = ?', [empId]);
      res.json({ success: true });
    });
  });
});

// Get salary
app.get('/get-salary/:empId', (req, res) => {
  db.query('SELECT salary, claimed FROM users WHERE id_number = ?', [req.params.empId], (err, results) => {
    if (err) return res.status(500).json({ success: false });
    if (results.length === 0) return res.json({ success: false });
    res.json({ success: true, salary: results[0].salary, claimed: results[0].claimed });
  });
});

// Assign task
app.post('/assign-task', (req, res) => {
  const { task, teamMembers } = req.body;
  const members = teamMembers.split(',').map(id => id.trim());
  const values = members.map(empId => [empId, task]);
  db.query('INSERT INTO tasks (emp_id, task_desc) VALUES ?', [values], err => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

// Get tasks
app.get('/tasks/:empId', (req, res) => {
  db.query('SELECT * FROM tasks WHERE emp_id = ?', [req.params.empId], (err, results) => {
    if (err) return res.status(500).json({ success: false });
    res.json(results);
  });
});

// Update progress
app.post('/update-progress', (req, res) => {
  const { empId, taskId, progress } = req.body;
  db.query('UPDATE tasks SET progress = ? WHERE emp_id = ? AND id = ?', [progress, empId, taskId], err => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

// Reports: employee view
app.get('/reports/:empId', (req, res) => {
  db.query('SELECT id, report_text, file_path, status, created_at FROM reports WHERE emp_id = ?', [req.params.empId], (err, results) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, reports: results });
  });
});

// Reports: manager view
app.get('/all-reports', (req, res) => {
  db.query(`
    SELECT reports.id, reports.emp_id, users.username, report_text, file_path, reports.status, reports.created_at
    FROM reports
    JOIN users ON reports.emp_id = users.id_number
    ORDER BY reports.created_at DESC
  `, (err, results) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, reports: results });
  });
});

// Approve / Reject report
app.post('/update-report-status', (req, res) => {
  const { reportId, status } = req.body;
  db.query('UPDATE reports SET status = ? WHERE id = ?', [status, reportId], err => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

// Attendance login
app.post('/attendance/login', (req, res) => {
  const { empId } = req.body;
  const now = new Date();
  db.query(`
    INSERT INTO attendance (emp_id, login_time, date)
    VALUES (?, ?, CURDATE())
    ON DUPLICATE KEY UPDATE login_time = VALUES(login_time)
  `, [empId, now], err => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

// Attendance logout
app.post('/attendance/logout', (req, res) => {
  const { empId } = req.body;
  db.query(`
    UPDATE attendance
    SET logout_time = NOW(),
        hours_logged = TIMESTAMPDIFF(MINUTE, login_time, NOW()) / 60
    WHERE emp_id = ? AND logout_time IS NULL
    ORDER BY login_time DESC
    LIMIT 1
  `, [empId], err => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

// View attendance
app.get('/attendance', (req, res) => {
  db.query(`
    SELECT a.emp_id, u.username, a.login_time, a.logout_time, ROUND(a.hours_logged, 2) AS duration
    FROM attendance a
    JOIN users u ON u.id_number = a.emp_id
    ORDER BY a.login_time DESC
  `, (err, results) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, records: results });
  });
});

// Auto delete rejected reports
setInterval(() => {
  const timeLimit = new Date(Date.now() - 5 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  db.query(`SELECT id, file_path FROM reports WHERE status = 'Rejected' AND created_at < ?`, [timeLimit], (err, results) => {
    if (err || results.length === 0) return;
    results.forEach(report => {
      if (report.file_path) {
        fs.unlink(path.join(__dirname, 'uploads', report.file_path), () => {});
      }
      db.query(`DELETE FROM reports WHERE id = ?`, [report.id]);
    });
  });
}, 60000);
// Get employee profile
app.get('/user/:id', (req, res) => {
  const empId = req.params.id;
  db.query('SELECT username, email, dob, gender, password FROM users WHERE id_number = ?', [empId], (err, results) => {
    if (err || results.length === 0) return res.json({ success: false });
    res.json({ success: true, user: results[0] });
  });
});

// Update employee profile
app.post('/user/update', (req, res) => {
  const { id, email, dob, gender, password } = req.body;
  db.query(
    'UPDATE users SET email = ?, dob = ?, gender = ?, password = ? WHERE id_number = ?',
    [email, dob, gender, password, id],
    err => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true });
    }
  );
});
// Mark task as finished
app.post('/mark-task-finished', (req, res) => {
  const { taskId } = req.body;
  db.query('UPDATE tasks SET status="Pending Review" WHERE id=?', [taskId], err => {
    if (err) return res.json({ success: false });
    res.json({ success: true });
  });
});

// Get all pending tasks
app.get('/finished-tasks', (req, res) => {
  const sql = `
    SELECT t.*, u.username 
    FROM tasks t 
    JOIN users u ON u.id_number = t.emp_id 
    WHERE t.status = 'Pending Review'
  `;
  db.query(sql, (err, results) => {
    if (err) return res.json({ success: false });
    res.json({ success: true, tasks: results });
  });
});

// Approve task
app.post('/approve-task', (req, res) => {
  const { taskId } = req.body;
  db.query('DELETE FROM tasks WHERE id = ?', [taskId], err => {
    if (err) return res.json({ success: false, message: "Error approving task." });
    res.json({ success: true, message: "✅ Task approved and removed!" });
  });
});

// Reject task
app.post('/reject-task', (req, res) => {
  const { taskId } = req.body;
  db.query('UPDATE tasks SET status="Assigned" WHERE id=?', [taskId], err => {
    if (err) return res.json({ success: false, message: "Error rejecting task." });
    res.json({ success: true, message: "❌ Task rejected. Reassigned to employee." });
  });
});


// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
