/**
 * SECTION 1: SESSION MANAGEMENT (Singleton Pattern)
 * Ensures only one session exists throughout the application.
 */
class SessionManager {
    constructor() {
        // If an instance already exists, return it instead of creating a new one
        if (SessionManager.instance) return SessionManager.instance;
        this.user = null;
        this.role = null;
        SessionManager.instance = this;
    }
    // Stores user credentials and role in the session
    login(user, role) {
        this.user = user;
        this.role = role;
        localStorage.setItem('currentUserRole', role); // Persist role for messaging
    }
    getUser() { return this.user; }
    getRole() { return this.role; }
}
const session = new SessionManager();
/*** SECTION 2: NAVIGATION PROXY
 * Controls access to different dashboards based on user roles.*/
class DashboardProxy {
    open(role) {
        if (!role) {
            showError("Access Denied!");
            return;
        }
        // Redirect logic based on specific roles
        const routes = {
            "employee": "EmployeeDashboard.html",
            "manager": "ManagerDashboard.html",
            "hr": "HRDashboard.html"
        };
        if (routes[role]) {
            window.location.href = routes[role];
        } else {
            showError("Invalid Role!");
        }
    }
}
const proxy = new DashboardProxy();

/*** SECTION 3: AUTHENTICATION LOGIC*/
/*** Handles Login Validation for hardcoded accounts and dynamic employees */

function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    hideError();

    // Validation for empty fields
    if (username === "" || password === "") {
        showError("Please fill all fields.");
        return;
    }

    let role = null;

    // 1. Check Hardcoded Admin/Staff Credentials
    if (username === "employee" && password === "1111") role = "employee";
    else if (username === "manager" && password === "2222") role = "manager";
    else if (username === "hr" && password === "3333") role = "hr";
    
    // 2. Check Dynamic Employee Database (stored in localStorage)
    if (!role) {
        const foundEmp = employees.find(e => e.id === username);
        if (foundEmp && password === "1111") { // Default password for registered users
            role = "employee";
            localStorage.setItem('currentUserId', foundEmp.id);
        }
    }

    if (role) {
        session.login(username, role);
        proxy.open(role); // Use proxy to navigate
    } else {
        showError("Wrong username or password!");
    }
}

/**
 * SECTION 4: EMPLOYEE DATABASE & HR ACTIONS
 * Logic for managing employee records, registration, and deletions.
 */

// Initialize data from localStorage or use default mock data
let employees = JSON.parse(localStorage.getItem('employees')) || [
    { id: "EMP101", name: "Farhana", dept: "CSE", score: 88, attendance: 94, status: "Excellent" },
    { id: "EMP204", name: "Afrin", dept: "HR", score: 95, attendance: 98, status: "Top" },
    { id: "EMP155", name: "Nahin", dept: "Sales", score: 73, attendance: 85, status: "Review" }
];

// HR: Adds a new employee to the system
function registerEmployee() {
    const id = document.getElementById('newEmpID').value.trim();
    const name = document.getElementById('newEmpName').value.trim();
    const dept = document.getElementById('newEmpDept').value.trim();

    if (!id || !name) return alert("ID and Name are required");
    if (employees.some(e => e.id === id)) return alert("ID already exists!");

    employees.push({ id, name, dept, score: 0, attendance: 100, status: "New Joiner" });
    saveAndRefresh("Employee Registered!");
}

// HR: Permanently removes an employee record
function removeEmployee(empId) {
    if (confirm("Are you sure you want to remove this employee?")) {
        employees = employees.filter(emp => emp.id !== empId);
        saveAndRefresh("Employee Removed.");
    }
}

/**
 * SECTION 5: PERFORMANCE & PROMOTIONS
 * Logic for submitting scores and approving career advancements.
 */

// Manager: Updates employee scores and calculates promotion eligibility
function submitReview() {
    const id = document.getElementById('reviewEmpID').value;
    const score = parseInt(document.getElementById('reviewScore').value);

    if (!id || isNaN(score)) return alert("Please enter ID and Score");

    let emp = employees.find(e => e.id === id);
    if (emp) {
        emp.score = score;
        // Logic: Eligibility requires high score AND high attendance
        if (score >= 85 && emp.attendance >= 90) {
            emp.status = "Eligible";
        } else if (score < 60) {
            emp.status = "Under Review";
        } else {
            emp.status = "Satisfactory";
        }
        saveAndRefresh(`Review for ${emp.name} updated.`);
    } else {
        alert("Employee not found!");
    }
}

// HR: Finalizes the promotion of an eligible employee
function approvePromotion(empId) {
    const empIndex = employees.findIndex(e => e.id === empId);
    if (empIndex !== -1) {
        employees[empIndex].status = "Promoted";
        employees[empIndex].dept += " (Senior)"; 
        saveAndRefresh(`${employees[empIndex].name} Promoted!`);
    }
}

/**
 * SECTION 6: UI UPDATES & DASHBOARD LOGIC
 * Functions to refresh table data and dynamic UI elements.
 */

function updateHRPage() {
    const approvalTable = document.getElementById('hrApprovalTable');
    const empList = document.getElementById('hrEmployeeList');

    if (!approvalTable || !empList) return;

    approvalTable.innerHTML = "";
    empList.innerHTML = "";

    employees.forEach(emp => {

        // Employee list (clean right-aligned remove button)
        empList.innerHTML += `
            <li style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span>${emp.id} - ${emp.name}</span>
                <button class="btn-delete" onclick="removeEmployee('${emp.id}')">Remove</button>
            </li>
        `;

        // Promotion table
        if (emp.status === "Eligible") {
            approvalTable.innerHTML += `
                <tr>
                    <td>${emp.id}</td>
                    <td>${emp.name}</td>
                    <td>${emp.score}</td>
                    <td>
                        <button class="btn-action" onclick="approvePromotion('${emp.id}')">
                            Approve
                        </button>
                    </td>
                </tr>
            `;
        }
    });
}
function updateEmployeeDashboard() {
    const statusElement = document.getElementById('employeeStatus');
    const currentUserId = localStorage.getItem('currentUserId'); 
    const me = employees.find(e => e.id === currentUserId);
    if (me && statusElement) {
        statusElement.innerText = me.status;
        if (me.status === "Promoted") statusElement.style.color = "green";
    }
}

/**
 * SECTION 7: MESSAGING SYSTEM
 * Handles inter-role communication using localStorage.
 */
function sendMessage() {
    const to = document.getElementById('msgRecipient').value;
    const text = document.getElementById('msgText').value;
    const from = localStorage.getItem('currentUserRole') || "User";

    if (!to || !text) return alert("Fill fields!");

    let messages = JSON.parse(localStorage.getItem('messages')) || [];
    messages.push({ to, from, text, time: new Date().toLocaleTimeString(), read: false });
    localStorage.setItem('messages', JSON.stringify(messages));
    alert("Sent!");
    loadMessages();
}

/**
 * SECTION 8: UTILITIES
 * Global helper functions.
 */

function showError(text) {
    const msg = document.getElementById("message");
    if (msg) { msg.innerText = text; msg.style.display = "block"; }
}

function hideError() {
    const msg = document.getElementById("message");
    if (msg) msg.style.display = "none";
}

function saveAndRefresh(alertText) {
    localStorage.setItem('employees', JSON.stringify(employees));
    alert(alertText);
    location.reload();
}

function logout() {
    localStorage.removeItem("currentUserRole");
    localStorage.removeItem("currentUserId");
    window.location.href = "Login.html";
}

// Auto-run on load
window.onload = function() {
    updateEmployeeDashboard();

    if (typeof updateHRPage === "function") {
        updateHRPage();
    }

    if (typeof updateManagerTable === "function") {
        updateManagerTable();
    }

    if (typeof loadMessages === "function") {
        loadMessages();
    }
};
function loadEmployeeCharts() {

    // Get canvas elements for employee dashboard charts
    const trendCanvas = document.getElementById("employeeTrendChart");
    const pieCanvas = document.getElementById("attendancePieChart");

    // If either chart canvas is missing, stop execution
    if (!trendCanvas || !pieCanvas) return;

    
    // LINE CHART (Performance Trend)
    
    new Chart(trendCanvas, {
        type: 'line',
        data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], // X-axis labels
            datasets: [{
                label: "Performance %", // Chart label
                data: [70, 75, 80, 85, 88, 90], // Performance data points
                borderColor: "#003b46", // Line color
                tension: 0.4, // Curve smoothness
                fill: false // No area fill under line
            }]
        }
    });


    // PIE CHART (Attendance Breakdown)

    new Chart(pieCanvas, {
    type: 'pie',
    data: {
        labels: ["Present", "Absent"],
        datasets: [{
            data: [94, 6],
            backgroundColor: ["#003b46", "#ff4d4f"]
        }]
    },
    options: {
    responsive: true,
    maintainAspectRatio: true
}
});
}
// MANAGER DASHBOARD CHARTS

function loadManagerCharts() {

    // Get canvas elements for manager charts
    const progress = document.getElementById("teamProgressChart");
    const compare = document.getElementById("teamCompareChart");

    // Stop if canvas is missing
    if (!progress || !compare) return;


    // LINE CHART (Team Progress)
    new Chart(progress, {
        type: 'line',
        data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri"], // Days of week
            datasets: [{
                label: "Team Progress",
                data: [60, 70, 75, 80, 85], // Progress values
                borderColor: "#006769", // Line color
                tension: 0.4
            }]
        }
    });
    // BAR CHART (Score Comparison)

    new Chart(compare, {
        type: 'bar',
        data: {
            labels: ["EMP101", "EMP204", "EMP155"], // Employee IDs
            datasets: [{
                label: "Scores",
                data: [88, 95, 73], // Scores
                backgroundColor: "#003b46" // Bar color
            }]
        }
    });
}
// HR CHARTS (NOT IMPLEMENTED YET)

function loadHRCharts() {
    console.log("HR charts loaded"); // Placeholder function
}
// MANAGER TABLE UPDATE

function updateManagerTable() {

    // Get table body element
    const body = document.getElementById("managerTableBody");

    // Stop if table not found
    if (!body) return;

    // Clear existing rows before updating
    body.innerHTML = "";
    // Loop through employees and create table rows
    employees.forEach(emp => {
        body.innerHTML += `
            <tr>
                <td>${emp.id}</td>
                <td>${emp.name}</td>
                <td>${emp.score}</td>
                <td>${emp.status}</td>
            </tr>
        `;
    });
}

// MESSAGE SYSTEM (INBOX)
function loadMessages() {

    // Get inbox container
    const inbox = document.getElementById("messageInbox");

    // Stop if inbox not found
    if (!inbox) return;

    // Get current user role from localStorage
    const currentRole = localStorage.getItem("currentUserRole");

    // Get saved messages or empty array
    const messages = JSON.parse(localStorage.getItem("messages")) || [];

    // Filter messages for current user or broadcast messages
    const filtered = messages.filter(m => m.to === currentRole || m.to === "all");

    // Display messages or show empty state
    inbox.innerHTML = filtered.length
        ? filtered.map(m => `
            <p><b>${m.from}:</b> ${m.text} <small>(${m.time})</small></p>
        `).join("")
        : "<p style='color:#999;'>No messages</p>";
}

// AUTO INITIALIZATION

document.addEventListener("DOMContentLoaded", function () {
    loadEmployeeCharts(); // Load employee charts when page loads
    loadManagerCharts();  // Load manager charts when page loads
});