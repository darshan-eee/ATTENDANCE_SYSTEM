import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // Removed the duplicate app.use(express.json())

const PORT = process.env.PORT || 3000;

app.get("/darshan", (req, res) => {
  res.send("Server says Hello darshan");
});

// --- SCHEMAS & MODELS ---
const studentsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true }
});
const Student = mongoose.model("Student", studentsSchema);

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  date: { type: String, required: true },     
  status: { type: String, enum: ["P", "A"], required: true }
});
const Attendance = mongoose.model("Attendance", attendanceSchema);


// --- STUDENT ROUTES ---
app.post("/students", async (req, res) => {
  try {
    const { name, rollNo } = req.body;
    if (!name || !rollNo) {
      return res.status(400).json({ message: "name and rollNo are required" });
    }
    const student = new Student({ name, rollNo });
    const savedStudent = await student.save();
    res.status(201).json({ message: "Student saved successfully", student: savedStudent });
  } catch (error) {
    res.status(500).json({ message: "Failed to save student", error: error.message });
  }
});

app.get("/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch students", error: error.message });
  }
});


// --- ATTENDANCE ROUTES ---

// 1. Save or Update Attendance
app.post("/attendance", async (req, res) => {
  try {
    const { studentId, date, status } = req.body;
    const attendance = await Attendance.findOneAndUpdate(
      { studentId: studentId, date: date },
      { status: status },
      { new: true, upsert: true }
    );
    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Fetch ALL Attendance History
app.get("/attendance", async (req, res) => {
  try {
    const attendance = await Attendance.find().populate("studentId");
    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MISSING FUNCTION 1: Fetch TODAY'S Attendance specifically
app.get("/attendance/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const attendance = await Attendance.find({ date: today }).populate("studentId");
    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MISSING FUNCTION 2: Reset/Delete TODAY'S Attendance
app.delete("/attendance/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    await Attendance.deleteMany({ date: today });
    res.status(200).json({ message: "Today's attendance cleared successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- DATABASE CONNECTION ---
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, () => {
      console.log(`Server is running on PORT ${PORT}`);
    });
  })
  .catch(err => console.error("Database connection error:", err));