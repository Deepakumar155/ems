async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;
  const status = document.getElementById("loginStatus");

  status.innerText = "";
  status.style.color = "red";

  if (!username || !password) {
    status.innerText = "⚠️ Please enter both username and password.";
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });

    const result = await response.json();

    if (result.success) {
      localStorage.setItem("user", JSON.stringify(result.user));
      status.style.color = "green";
      status.innerText = "✅ Login successful. Redirecting...";

      setTimeout(() => {
        window.location.href = role === "manager" ? "manager.html" : "employee.html";
      }, 1200);
    } else {
      status.innerText = "❌ " + result.message;
    }
  } catch (error) {
    console.error("Login error:", error);
    status.innerText = "❌ Error connecting to server.";
  }
}
