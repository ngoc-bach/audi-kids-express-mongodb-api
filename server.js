// server.js
require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
const { ObjectId } = require("mongodb");

// enable your service for CORS which is cross origin resource sharing
const cors = require("cors");
const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

const app = express();
const port = 3001;

// MongoDB connection
const uri = process.env.DB_URI || ""; // Update with your MongoDB connection string
const client = new MongoClient(uri);

app.use(express.json());
app.use(cors(corsOptions)); // Use this after the variable declaration

// Retrieve all documents OR one from the collection
app.get("/api/v1/books", async (req, res) => {
  // destructure page and limit and set default values
  const { page = 1, limit = 10 } = req.query;
  try {
    await client.connect();
    const database = client.db("sample_books"); // Replace with your database name
    const collection = database.collection("books"); // Replace with your collection name
    let searchText = req.query.searchText;
    let books = [];
    if (searchText) {
      books = await collection
        .find({
          $or: [
            { title: { $regex: new RegExp(searchText, "i") } },
            { author: { $regex: new RegExp(searchText, "i") } },
            { narrator: { $regex: new RegExp(searchText, "i") } },
          ],
        })
        .toArray();
    } else {
      books = await collection
        .find({})
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .toArray();
    }
    const count = await collection.countDocuments();
    res.json({
      books,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Retrieve feature documents from the collection
app.get("/api/v1/featuredbooks", async (req, res) => {
  try {
    await client.connect();
    const database = client.db("sample_books"); // Replace with your database name
    const collection = database.collection("books"); // Replace with your collection name
    let featuredBooks = [];
    featuredBooks = await collection.find({ rating: { $gt: 4.5 } }).toArray();
    res.json(featuredBooks);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Read one document
app.get("/api/v1/books/:id", async (req, res) => {
  try {
    await client.connect();
    const database = client.db("sample_books"); // Replace with your database name
    const collection = database.collection("books"); // Replace with your collection name
    const { id } = req.params;
    let book = [];
    book = await collection.find({ _id: new ObjectId(id) }).toArray();
    res.json(book);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Create a new document
app.post("/api/v1/books", async (req, res) => {
  try {
    await client.connect();
    const database = client.db("sample_books"); // Replace with your database name
    const collection = database.collection("books"); // Replace with your collection name

    const newData = req.body;
    const result = await collection.insertOne(newData);
    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Update an existing document
app.put("/api/v1/books/:id", async (req, res) => {
  try {
    await client.connect();
    const database = client.db("sample_books"); // Replace with your database name
    const collection = database.collection("books"); // Replace with your collection name

    const { id } = req.params;
    const updatedData = req.body;
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Delete a document
app.delete("/api/v1/books/:id", async (req, res) => {
  try {
    await client.connect();
    const database = client.db("sample_books"); // Replace with your database name
    const collection = database.collection("books"); // Replace with your collection name

    const { id } = req.params;
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
