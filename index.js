const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// Creating server
const app = express();

//Configure DOTENV
require("dotenv").config();
const PORT = process.env.PORT;
const HOSTNAME = process.env.HOSTNAME;
const DB_URI = process.env.DB_URL + process.env.DB_NAME;
//console.log(DB_URI)

// Server Started
app.listen(PORT, () => {
  console.log(`Server started at http://${HOSTNAME}:${PORT}`);
});

// Database Connection

mongoose
  .connect(DB_URI)
  .then((response) => {
    console.log("Database Connected Successfully");
  })
  .catch((error) => console.log(error));

// Creating Schema for Mentor and Student
const mentorSchema = new mongoose.Schema(
  {
    name: String,
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Students",
      },
    ],
  },
  { versionKey: false }
);

const studentSchema = new mongoose.Schema(
  {
    name: String,
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
    },
  },
  { versionKey: false }
);

// Creating Models -> Consist of Collection Name & Schema
const Mentor = mongoose.model("Mentor", mentorSchema);
const Student = mongoose.model("Student", studentSchema);

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send(" <h1> 🎇😎 Welcome to the student and mentors page 🤩🎆</h1> ");
});

// 1. Write API to create Mentor

app.post("/api/mentors", async (req, res) => {
  try {
    const mentor = new Mentor(req.body);
    await mentor.save();
    res.status(201).json({
      message: "Mentor created successfully",
      mentor:mentor
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

// 2. Write API to create Student

app.post("/api/students", async (req, res) => {
  try {
    const { mentorId, name } = req.body;

    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    const student = new Student({
      name,
      mentor: mentorId,
    });

    await student.save();

    mentor.students.push(student);
    await mentor.save();

    res.status(201).json({ message: "Student created successfully", student });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

//3. Write API to Assign a student to Mentor

app.post("/api/assign-mentor", async (req, res) => {
  try {
    const { mentorId, studentIds } = req.body;

    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    const students = await Student.find({ _id: { $in: studentIds } });

    mentor.students.push(...students);
    await mentor.save();

    students.forEach(async (student) => {
      student.mentor = mentor;
      await student.save();
    });

    res
      .status(200)
      .json({ message: "Students assigned to mentor successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Select one mentor and Add multiple Student

// A student who has a mentor should not be shown in List

// 4. Write API to Assign or Change Mentor for particular Student

app.put("/api/assign-mentor/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const { mentorId } = req.body;

    const student = await Student.findById(studentId);
    const mentor = await Mentor.findById(mentorId);

    if (!student || !mentor) {
      return res.status(404).json({ message: "Student or Mentor not found" });
    }

    student.mentor = mentor;
    await student.save();

    res
      .status(200)
      .json({ message: "Student assigned to mentor successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

//Select One Student and Assign one Mentor

// 5. Write API to show all students for a particular mentor

app.get("/api/mentor-students/:mentorId", async (req, res) => {
  try {
    const { mentorId } = req.params;
    const mentor = await Mentor.findById(mentorId).populate("students");

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    res.status(200).json({
      message: "Students fetched successfully",
      students: mentor.students,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

//6. Write an API to show the previously assigned mentor for a particular student

app.get("/api/student-mentor/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId).populate("mentor");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res
      .status(200)
      .json({ message: "Mentor fetched successfully", mentor: student.mentor });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});
