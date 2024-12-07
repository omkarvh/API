import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import multer from 'multer';
import path from 'path';
import dotenv from "dotenv";
dotenv.config();


const app = express();
const port = 4000;

// PostgreSQL Client Setup
const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});
db.connect();

// Middleware Setup
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public")); // For serving static files (images)
// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });
app.use('/uploads', express.static('uploads'));

app.set('view engine', 'ejs');

//creating 
app.post("/submit-project", upload.single("image"), async (req, res) => {
    const { title, description, link, languages_used } = req.body;
    const image = req.file ? req.file.buffer.toString("base64") : null; // Convert uploaded file to Base64 string

    try {
        await db.query(
            "INSERT INTO projects (title, description, link, languages_used, image) VALUES ($1, $2, $3, $4, $5)",
            [title, description, link, languages_used, image]
        );
        res.status(201).send("Project added successfully!");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving project data");
    }
});

//Read - fetching projects
app.get("/", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM projects");
        res.render("index", { projects: result.rows }); // Pass data to the index page
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching project data");
    }
});


// Update route with image handling
app.post("/update-project/:id", upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { title, description, link, languages_used } = req.body;
    let imagePath = req.file ? req.file.path : null;  // Image path if uploaded

    try {
        await db.query(
            "UPDATE projects SET title = $1, description = $2, link = $3, languages_used = $4, image = $5 WHERE id = $6",
            [title, description, link, languages_used, imagePath, id]
        );
        res.redirect("/"); // Redirect to homepage
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating project");
    }
});




//delete 

app.post('/delete', (req, res) => {
    const item_id = req.body.id;
    console.log("Deleted successfully id" + item_id);

    try {
        db.query(
            "DELETE FROM projects WHERE id = $1", 
            [item_id]  // Correct the variable here
        );
        res.redirect("/"); // Redirect to homepage
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting project");
    }
});




// Start the server
app.listen(port, () => {
    console.log(`Server running on localhost:${port}`);
});
