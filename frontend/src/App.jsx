import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [students, setStudents] = useState([]);

  // useEffect calls backend
  useEffect(() => {
    getStudents();
  }, []);
  const APP_URL=import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Calls backend and gets data
  const getStudents = async () => {
    try {
      // Fetch students and today's attendance simultaneously
      const [studentsRes, attendanceRes] = await Promise.all([
        //fetch("http://localhost:3000/students"),
        fetch(`${APP_URL}/students`),
        //fetch("http://localhost:3000/attendance/today")
        fetch(`${APP_URL}/attendance`),
      ]);

      const studentsData = await studentsRes.json();
      const attendanceData = await attendanceRes.json();

      const attendanceMap = {};
      attendanceData.forEach(record => {
        const sId = record.studentId._id || record.studentId;
        attendanceMap[sId] = record.status;
      });

      const updatedStudents = studentsData.map(student => ({
        ...student,
        attendance: attendanceMap[student._id] || "" 
      }));

      setStudents(updatedStudents);
    } catch (err) {
      console.log("Error fetching data:", err);
    }
  };

  // Save attendance in MongoDB
  const saveAttendance = async (studentId, status) => {
    try {
      await fetch(
        `$(APP_URL)/attendance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            studentId,
            status,
            date: new Date().toISOString().split("T")[0]
          })
        }
      );
      console.log("Attendance Saved");
    } catch (err) {
      console.log("Error saving attendance:", err);
    }
  };

  // Update UI immediately
  const markAttendance = (id, status) => {
    setStudents(
      students.map(student =>
        student._id === id
          ? { ...student, attendance: status }
          : student
      )
    );
  };

  // Present count
  const presentCount = students.filter(
    student => student.attendance === "P"
  ).length;

  // Absent count
  const absentCount = students.filter(
    student => student.attendance === "A"
  ).length;

  // Reset button
  const resetAttendance = async () => {
    try {
      // 1. Tell the database to delete today's records
      const response = await fetch(`${APP_URL}/attendance/today`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete records from the database");
      }

      console.log("Database successfully reset for today.");

      // 2. Only wipe the UI state AFTER the database confirms deletion
      setStudents(
        students.map(student => ({
          ...student,
          attendance: ""
        }))
      );
    } catch (err) {
      console.log("Error resetting attendance:", err);
      alert("Could not reset attendance. Please check your connection.");
    }
  };

  return (
    <div className="container">
      <h1>Attendance Management System</h1>

      <div className="summary">
        {/* Linked Summary Cards to CSS */}
        <h3 className="card present-card">
          Total Present : {presentCount}
        </h3>

        <h3 className="card absent-card">
          Total Absent : {absentCount}
        </h3>

        {/* Linked Reset Button to CSS */}
        <button className="reset-btn" onClick={resetAttendance}>
          Reset All
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Name</th>
            <th>Actions</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No Students Found
              </td>
            </tr>
          ) : (
            students.map(student => (
              <tr key={student._id}>
                <td>{student.rollNo}</td>
                <td>{student.name}</td>
                <td>
                  {/* Dynamic Present Button UI toggling */}
                  <button
                    className={`present-btn ${student.attendance === "P" ? "active-p" : ""}`}
                    onClick={() => {
                      markAttendance(student._id, "P");
                      saveAttendance(student._id, "P");
                    }}
                  >
                    P
                  </button>

                  {/* Dynamic Absent Button UI toggling */}
                  <button
                    className={`absent-btn ${student.attendance === "A" ? "active-a" : ""}`}
                    onClick={() => {
                      markAttendance(student._id, "A");
                      saveAttendance(student._id, "A");
                    }}
                  >
                    A
                  </button>
                </td>
                <td>
                  {/* Styled Status Badge UI wrapping */}
                  <span
                    className={`status ${
                      student.attendance === "P"
                        ? "status-p"
                        : student.attendance === "A"
                        ? "status-a"
                        : "status-none"
                    }`}
                  >
                    {student.attendance || "-"}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;