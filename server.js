const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/user');

// MongoDB connection
require('./db');

// Student model
const Student = require('./models/Student');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send("Smart Attendance Backend Running Successfully");
});

app.get('/test-route', (req, res) => {
    res.send("Route is working");
});


// Add student
app.post('/add-student', authMiddleware,adminOnly, async (req, res) => {
    try {
       const { name, roll, dept, year } = req.body;

       const student = new Student({
             name,
             roll,
             dept,
             year
       });

        await student.save();

        res.send("Student added successfully");
    } catch (error) {
        res.status(500).send("Error adding student");
    }
});


// Mark attendance (present)
app.post('/mark-attendance/:id', authMiddleware, async (req, res) => {
    try {
        const studentId = req.params.id;

        await Student.findByIdAndUpdate(studentId, {
            $inc: {
                total_classes: 1,
                attended_classes: 1
            }
        });

        res.send("Attendance marked successfully");
    } catch (error) {
        res.status(500).send("Error marking attendance");
    }
});

//Mark attendance (Absent)
app.post('/mark-absent/:id', authMiddleware, async (req, res) => {
    try {
        const studentId = req.params.id;

        await Student.findByIdAndUpdate(studentId, {
            $inc: {
                total_classes: 1
            }
        });

        res.send("Absent marked successfully");
    } catch (error) {
        res.status(500).send("Error marking absent");
    }
});


// Attendance report
app.get('/attendance/:id', authMiddleware, async (req, res) => {
    try {
        const studentId = req.params.id;

        const student = await Student.findById(studentId);

        let percentage = 0;

        if (student.total_classes > 0) {
            percentage =
                (student.attended_classes / student.total_classes) * 100;
        }

        let prediction =
            percentage < 75
                ? "Warning: Attendance below 75%"
                : "Safe Attendance";

        res.json({
            name: student.name,
            total_classes: student.total_classes,
            attended_classes: student.attended_classes,
            percentage: percentage.toFixed(2),
            prediction
        });

    } catch (error) {
        res.status(500).send("Error fetching data");
    }
});

//low attendence student
app.get('/low-attendance', authMiddleware, async (req, res) => {
    try {
        const students = await Student.find();

        const lowStudents = students.filter(student => {
            if (student.total_classes === 0) return false;
            return (
                (student.attended_classes / student.total_classes) * 100 < 75
            );
        });

        res.json(lowStudents);
    } catch (error) {
        res.status(500).send("Error fetching low attendance students");
    }
});


// Get all students
app.get('/students', authMiddleware, async (req, res) => {
    try {
        const students = await Student.find();
        res.json(students);
    } catch (error) {
        res.status(500).send("Error fetching students");
    }
});

//update student
app.put('/update-student/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const studentId = req.params.id;
        const { name } = req.body;

        await Student.findByIdAndUpdate(studentId, { name });

        res.send("Student updated successfully");
    } catch (error) {
        res.status(500).send("Error updating student");
    }
});

//delete student
app.delete('/delete-student/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const studentId = req.params.id;

        await Student.findByIdAndDelete(studentId);

        res.send("Student deleted successfully");
    } catch (error) {
        res.status(500).send("Error deleting student");
    }
});

const PORT = 3000;

//for creating user id of techer and student
app.post('/create-user', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { name, userId, password, role } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            userId,
            password: hashedPassword,
            role
        });

        await user.save();

        res.send("User created successfully");
    } catch (error) {
        res.status(500).send("Error creating user");
    }
});

//login user
app.post('/login', async (req, res) => {
    try {
        const { userId, password } = req.body;

        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(400).send("User not found");
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).send("Invalid password");
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            "secretkey",
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful",
            token,
            role: user.role
        });

    } catch (error) {
        res.status(500).send("Login failed");
    }
});

//authorization access control
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).send("Access denied");
    }

    try {
        const verified = jwt.verify(token, "secretkey");
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).send("Invalid token");
    }
}

//admin access control
function adminOnly(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).send("Admin access only");
    }
    next();
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});