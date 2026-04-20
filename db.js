const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://samarmohd8024_db_user:FJO2E63NgsaJzoNF@cluster0.ifq0u1f.mongodb.net/smart_attendance')
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.log('Error connecting to MongoDB:', err);
    });