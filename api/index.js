const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/User.js");
const Place = require("./models/Place.js");
const Booking = require("./models/Booking.js");
const cookieParser = require("cookie-parser");
const imageDownloader = require("image-downloader");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());

// ✅ Make sure uploads folder exists
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
    console.log("📁 Uploads folder created");
}

// ✅ Serve uploaded images publicly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ CORS
app.use(
    cors({
        credentials: true,
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    })
);

// ✅ MongoDB Connection
mongoose
    .connect(process.env.MONGO_URL)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch((err) => console.log("❌ MongoDB Connection Error:", err.message));

// ✅ Basic route
app.get("/", (req, res) => {
    res.send("✅ Server running...");
});

// ✅ Helper: Get user data from JWT
function getUserDataFromReq(req) {
    return new Promise((resolve, reject) => {
        jwt.verify(req.cookies.token, process.env.SECRET_KEY, {}, (err, userData) => {
            if (err) reject(err);
            resolve(userData);
        });
    });
}

// ✅ Test API
app.get("/api/test", (req, res) => {
    res.json("test ok");
});

// ✅ Register API
app.post("/api/register", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userDoc = await User.create({
            name,
            email,
            password: bcrypt.hashSync(password, 10),
        });

        res.json({ success: true, user: userDoc });
    } catch (error) {
        res.status(422).json(error);
    }
});

// ✅ Login API
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    const userDoc = await User.findOne({ email });
    if (!userDoc) return res.status(404).json("User not found");

    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (!passOk) return res.status(422).json("Incorrect password");

    jwt.sign(
        { email: userDoc.email, id: userDoc._id },
        process.env.SECRET_KEY,
        {},
        (err, token) => {
            if (err) throw err;
            res.cookie("token", token, { httpOnly: true }).json({
                success: true,
                user: userDoc,
            });
        }
    );
});

// ✅ Profile API
app.get("/api/profile", (req, res) => {
    const { token } = req.cookies;
    if (!token) return res.json(null);

    jwt.verify(token, process.env.SECRET_KEY, {}, async (err, userData) => {
        if (err) throw err;

        const user = await User.findById(userData.id);
        res.json({
            name: user.name,
            email: user.email,
            _id: user._id,
        });
    });
});

// ✅ Logout
app.post("/api/logout", (req, res) => {
    res.cookie("token", "").json(true);
});

// ✅ Upload by link
app.post("/api/upload-by-link", async (req, res) => {
    const { link } = req.body;

    try {
        const newName = "photo_" + Date.now() + ".jpg";
        const destination = path.join(__dirname, "uploads", newName);

        await imageDownloader.image({ url: link, dest: destination });

        res.json(`http://localhost:4000/uploads/${newName}`); // ✅ return full URL
    } catch (error) {
        console.log("❌ Image Download Error:", error);
        res.status(500).json({ error: "Failed to download image" });
    }
});

// ✅ Multer Storage
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});

const upload = multer({ storage: multerStorage });

// ✅ Upload from device
app.post("/api/upload", upload.array("photos", 100), (req, res) => {
    if (!req.files) {
        return res.status(400).json({ error: "No files uploaded" });
    }

    const uploadedFiles = req.files.map(
        (file) => `http://localhost:4000/uploads/${file.filename}`
    );

    res.json(uploadedFiles); // ✅ return full URLs
});

// ✅ Create place
app.post("/api/places", async (req, res) => {
    const { token } = req.cookies;

    jwt.verify(token, process.env.SECRET_KEY, {}, async (err, userData) => {
        if (err) throw err;

        const placeDoc = await Place.create({
            owner: userData.id,
            ...req.body,
        });

        res.json(placeDoc);
    });
});

// ✅ Get user places
app.get("/api/user-places", async (req, res) => {
    const { token } = req.cookies;

    jwt.verify(token, process.env.SECRET_KEY, {}, async (err, userData) => {
        if (err) throw err;

        const places = await Place.find({ owner: userData.id });
        res.json(places);
    });
});

// ✅ Get single place
app.get("/api/places/:id", async (req, res) => {
    res.json(await Place.findById(req.params.id));
});

// ✅ Update place
app.put("/api/places", async (req, res) => {
    const { token } = req.cookies;

    jwt.verify(token, process.env.SECRET_KEY, {}, async (err, userData) => {
        if (err) throw err;

        const { id, ...rest } = req.body;
        const placeDoc = await Place.findById(id);

        if (placeDoc.owner.toString() !== userData.id) {
            return res.status(403).json("Unauthorized");
        }

        placeDoc.set(rest);
        await placeDoc.save();
        res.json("ok");
    });
});

// ✅ Fetch all places
// Example in /api/places route
app.get("/api/places", async (req, res) => {
    const places = await Place.find();
    const updatedPlaces = places.map(place => {
        return {
            ...place._doc,
            photos: place.photos.map(photo => `http://localhost:4000/uploads/${photo}`)
        }
    });
    res.json(updatedPlaces);
});

// ✅ Create booking
app.post("/api/bookings", async (req, res) => {
    const userData = await getUserDataFromReq(req);

    Booking.create({
        ...req.body,
        user: userData.id,
    })
        .then((doc) => res.json(doc))
        .catch((err) => console.log(err));
});

// ✅ Fetch bookings
app.get("/api/bookings", async (req, res) => {
    const userData = await getUserDataFromReq(req);
    res.json(await Booking.find({ user: userData.id }).populate("place"));
});

// ✅ Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
