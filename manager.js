 window.onload = () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || user.role !== "manager") {
        alert("Please login as manager.");
        window.location.href = "login.html";
        return;
      }
      loadManagerProfile(user.id_number);
    };

    function logout() {
      localStorage.removeItem("user");
      alert("✅ Logged out.");
      window.location.href = "login.html";
    }

    function viewEmployees() {
      fetch("http://localhost:3000/employees")
        .then(res => res.json())
        .then(data => {
          const list = document.getElementById("employeeList");
          list.innerHTML = data.length === 0 ? "No employees found." : "";
          data.forEach(emp => {
            const div = document.createElement("div");
            div.innerHTML = `
              <strong>ID:</strong> ${emp.id_number}<br>
              <strong>Name:</strong> ${emp.username}<br>
              <strong>Email:</strong> ${emp.email}<br>
              <strong>DOB:</strong> ${emp.dob}<br>
              <strong>Gender:</strong> ${emp.gender}<br><hr>`;
            list.appendChild(div);
          });
        });
    }

    function fireEmployee() {
      const id = document.getElementById("fireEmpId").value.trim();
      if (!id) return alert("Please enter employee ID");
      fetch(`http://localhost:3000/fire/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          alert(data.message);
          viewEmployees();
        });
    }

    function updateSalary() {
      const id = document.getElementById("salaryEmpId").value.trim();
      const amount = document.getElementById("salaryAmount").value;
      if (!id || amount <= 0) return alert("Enter valid inputs");

      fetch("http://localhost:3000/update-salary", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empId: id, amount })
      })
      .then(res => res.json())
      .then(data => {
        alert(data.success ? "✅ Salary updated" : "❌ Failed to update salary");
      });
    }

    function assignTask() {
      const members = document.getElementById("teamMembers").value.trim();
      const task = document.getElementById("taskDescription").value.trim();
      if (!members || !task) return alert("Please fill all fields");

      fetch("http://localhost:3000/assign-task", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamMembers: members, task })
      })
      .then(res => res.json())
      .then(data => {
        alert(data.success ? "✅ Task assigned" : "❌ Failed to assign task");
      });
    }

    function loadAllReports() {
      fetch("http://localhost:3000/all-reports")
        .then(res => res.json())
        .then(data => {
          const container = document.getElementById("reportReviewList");
          container.innerHTML = "";

          if (!data.success || data.reports.length === 0) {
            container.innerHTML = "<p>No reports submitted.</p>";
            return;
          }

          data.reports.forEach(report => {
            const div = document.createElement("div");
            div.style.border = "1px solid #ccc";
            div.style.marginBottom = "10px";
            div.style.padding = "10px";
            div.innerHTML = `
              <strong>Report ID:</strong> ${report.id}<br>
              <strong>Employee:</strong> ${report.username} (ID: ${report.emp_id})<br>
              <strong>Text:</strong> ${report.report_text || "-"}<br>
              <strong>File:</strong> ${report.file_path 
                ? `<a href="http://localhost:3000/uploads/${report.file_path}" target="_blank">View</a>` 
                : "None"}<br>
              <strong>Status:</strong> ${report.status || "Pending"}<br>
              <small><i>Submitted: ${new Date(report.created_at).toLocaleString()}</i></small><br><br>
              <button onclick="updateReportStatus(${report.id}, 'Approved')">✅ Approve</button>
              <button onclick="updateReportStatus(${report.id}, 'Rejected')">❌ Reject</button>
            `;
            container.appendChild(div);
          });
        });
    }

    function updateReportStatus(reportId, status) {
      fetch("http://localhost:3000/update-report-status", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status })
      })
      .then(res => res.json())
      .then(data => {
        alert(data.success ? `✅ Marked as ${status}` : "❌ Failed to update");
        loadAllReports();
      });
    }

    function viewAttendance() {
      fetch("http://localhost:3000/attendance")
        .then(res => res.json())
        .then(data => {
          const container = document.getElementById("attendanceList");
          container.innerHTML = "";

          if (!data.success || data.records.length === 0) {
            container.innerHTML = "<p>No attendance records.</p>";
            return;
          }

          data.records.forEach(entry => {
            const div = document.createElement("div");
            div.innerHTML = `
              <strong>Employee ID:</strong> ${entry.emp_id}<br>
              <strong>Name:</strong> ${entry.username}<br>
              <strong>Login:</strong> ${new Date(entry.login_time).toLocaleString()}<br>
              <strong>Logout:</strong> ${entry.logout_time ? new Date(entry.logout_time).toLocaleString() : '<span style="color:green;">🟢 Online</span>'}<br>
              <strong>Duration:</strong> ${entry.duration || '-'}<br><hr>
            `;
            container.appendChild(div);
          });
        });
    }

    function loadFinishedTasks() {
      fetch("http://localhost:3000/finished-tasks")
        .then(res => res.json())
        .then(data => {
          const container = document.getElementById("finishedTasksList");
          container.innerHTML = "";

          if (!data.success || data.tasks.length === 0) {
            container.innerHTML = "<p>No finished tasks.</p>";
            return;
          }

          data.tasks.forEach(task => {
            const div = document.createElement("div");
            div.innerHTML = `
              <strong>Task ID:</strong> ${task.id}<br>
              <strong>Employee:</strong> ${task.username} (ID: ${task.emp_id})<br>
              <strong>Task:</strong> ${task.task_desc}<br>
              <strong>Progress:</strong> ${task.progress || 0}%<br><br>
              <button onclick="approveTask(${task.id})">✅ Approve</button>
              <button onclick="rejectTask(${task.id})">❌ Reject</button>
              <hr>`;
            container.appendChild(div);
          });
        });
    }

    function approveTask(taskId) {
      fetch("http://localhost:3000/approve-task", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        loadFinishedTasks();
      });
    }

    function rejectTask(taskId) {
      fetch("http://localhost:3000/reject-task", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        loadFinishedTasks();
      });
    }

    function loadManagerProfile(managerId) {
      fetch(`http://localhost:3000/user/${managerId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const mgr = data.user;
            document.getElementById("profileUsername").value = mgr.username;
            document.getElementById("profileEmail").value = mgr.email;
            document.getElementById("profilePassword").value = mgr.password;
            document.getElementById("profileGender").value = mgr.gender;
          } else {
            document.getElementById("profileStatus").innerText = "❌ Failed to load profile.";
          }
        });
    }

    function updateProfile() {
      const user = JSON.parse(localStorage.getItem("user"));
      const updated = {
        id: user.id_number,
        email: document.getElementById("profileEmail").value,
        password: document.getElementById("profilePassword").value,
        gender: document.getElementById("profileGender").value
      };

      fetch("http://localhost:3000/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      })
      .then(res => res.json())
      .then(data => {
        const status = document.getElementById("profileStatus");
        status.innerText = data.success ? "✅ Profile updated!" : "❌ Update failed.";
      });
    }