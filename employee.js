
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "employee") {
      alert("Please login as employee.");
      window.location.href = "login.html";
    }

    window.onload = () => {
      document.getElementById("username").value = user.username;
      document.getElementById("email").value = user.email;
      document.getElementById("password").value = user.password;
      document.getElementById("dob").value = user.dob;
      document.getElementById("gender").value = user.gender;
    };

    function logout() {
      localStorage.removeItem("user");
      alert("✅ Logged out");
      window.location.href = "login.html";
    }

    function updateProfile() {
      const updated = {
        id: user.id_number,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        dob: document.getElementById("dob").value,
        gender: document.getElementById("gender").value
      };

      fetch("http://localhost:3000/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      })
      .then(res => res.json())
      .then(data => {
        document.getElementById("profileStatus").innerText = data.success ? "✅ Updated" : "❌ Failed";
      });
    }

    function loadTasks() {
      fetch(`http://localhost:3000/tasks/${user.id_number}`)
        .then(res => res.json())
        .then(tasks => {
          const list = document.getElementById("taskList");
          list.innerHTML = tasks.length === 0 ? "No tasks found." : "";
          tasks.forEach(task => {
            const div = document.createElement("div");
            div.innerHTML = `
              <strong>ID:</strong> ${task.id}<br>
              <strong>Task:</strong> ${task.task_desc}<br>
              <strong>Status:</strong> ${task.status || 'Assigned'}<br>
              <strong>Progress:</strong> ${task.progress || 0}%<hr>`;
            list.appendChild(div);
          });
        });
    }

    function updateProgress() {
      const taskId = document.getElementById("taskId").value;
      const progress = document.getElementById("progress").value;

      fetch("http://localhost:3000/update-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empId: user.id_number, taskId, progress })
      })
      .then(res => res.json())
      .then(data => {
        alert(data.success ? "✅ Progress updated" : "❌ Failed");
        loadTasks();
      });
    }

    function markTaskFinished() {
      const taskId = document.getElementById("taskId").value;
      fetch("http://localhost:3000/mark-task-finished", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId })
      })
      .then(res => res.json())
      .then(data => {
        alert(data.success ? "✅ Task marked finished" : "❌ Failed");
        loadTasks();
      });
    }

    function submitReport() {
      const formData = new FormData();
      formData.append("empId", user.id_number);
      formData.append("reportText", document.getElementById("reportText").value);
      const file = document.getElementById("reportFile").files[0];
      if (file) formData.append("reportFile", file);

      fetch("http://localhost:3000/submit-report", {
        method: "POST",
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        alert(data.success ? "✅ Report submitted" : "❌ Failed");
        loadReports();
      });
    }

    function loadReports() {
      fetch(`http://localhost:3000/reports/${user.id_number}`)
        .then(res => res.json())
        .then(data => {
          const list = document.getElementById("reportList");
          list.innerHTML = "";
          if (!data.success || data.reports.length === 0) {
            list.innerHTML = "No reports.";
            return;
          }

          data.reports.forEach(report => {
            const div = document.createElement("div");
            div.innerHTML = `
              <strong>ID:</strong> ${report.id}<br>
              <strong>Text:</strong> ${report.report_text || "-"}<br>
              <strong>File:</strong> ${report.file_path 
                ? `<a href="http://localhost:3000/uploads/${report.file_path}" target="_blank">View</a>` 
                : "None"}<br>
              <strong>Status:</strong> ${report.status || "Pending"}<br>
              <small>${new Date(report.created_at).toLocaleString()}</small><hr>`;
            list.appendChild(div);
          });
        });
    }

    function getSalary() {
      fetch(`http://localhost:3000/get-salary/${user.id_number}`)
        .then(res => res.json())
        .then(data => {
          const info = document.getElementById("salaryInfo");
          info.innerHTML = data.success
            ? `<strong>Salary:</strong> ₹${data.salary}<br><strong>Status:</strong> ${data.claimed ? 'Claimed' : 'Not claimed'}`
            : "❌ Unable to fetch salary.";
        });
    }

    function claimSalary() {
      fetch("http://localhost:3000/claim-salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empId: user.id_number, amount: 0 })
      })
      .then(res => res.json())
      .then(data => {
        alert(data.success ? "✅ Salary claimed" : `❌ ${data.message || 'Failed'}`);
        getSalary();
      });
    }

    function markLogin() {
      fetch("http://localhost:3000/attendance/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empId: user.id_number })
      }).then(() => alert("🕓 Logged In"));
    }

    function markLogout() {
      fetch("http://localhost:3000/attendance/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empId: user.id_number })
      }).then(() => alert("🕓 Logged Out"));
    }