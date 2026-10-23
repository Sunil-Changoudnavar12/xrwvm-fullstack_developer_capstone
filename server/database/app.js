
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = Number(process.env.PORT || 3030);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const reviews_data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'reviews.json'), 'utf8'));
const dealerships_data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'dealerships.json'), 'utf8'));

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/dealershipsDB");

const Reviews = require('./review');
const Dealerships = require('./dealership');

// Load initial data into MongoDB
mongoose.connection.once('open', async () => {
  try {
    if (await Reviews.estimatedDocumentCount() === 0) await Reviews.insertMany(reviews_data.reviews);
    if (await Dealerships.estimatedDocumentCount() === 0) await Dealerships.insertMany(dealerships_data.dealerships);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
});

// Home route
app.get('/', async (req, res) => {
  res.send("Welcome to the Mongoose API");
});

// Fetch all reviews
app.get('/fetchReviews', async (req, res) => {
  try {
    const documents = await Reviews.find();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Fetch reviews for a particular dealer
app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    const documents = await Reviews.find({
      dealership: Number(req.params.id)
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Fetch all dealerships
app.get('/fetchDealers', async (req, res) => {
  try {
    const documents = await Dealerships.find();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dealerships' });
  }
});

// Fetch dealerships by state
app.get('/fetchDealers/:state', async (req, res) => {
  try {
    const documents = await Dealerships.find({
      state: req.params.state
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dealerships' });
  }
});

// Fetch one dealership by ID
app.get('/fetchDealer/:id', async (req, res) => {
  try {
    const document = await Dealerships.findOne({
      id: Number(req.params.id)
    });

    if (!document) {
      return res.status(404).json({
        error: 'Dealership not found'
      });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dealership' });
  }
});

// Insert a review
app.post('/insert_review', async (req, res) => {
  try {
    const data = req.body;
    const required = ['name', 'review', 'purchase_date', 'car_make', 'car_model'];
    if (!data || required.some((field) => !String(data[field] || '').trim()) ||
        !Number.isInteger(Number(data.dealership)) ||
        !Number.isInteger(Number(data.car_year)) || Number(data.car_year) < 2015 || Number(data.car_year) > 2023) {
      return res.status(400).json({ error: 'Complete review details and provide a vehicle year from 2015 to 2023' });
    }

    const documents = await Reviews.find().sort({ id: -1 }).limit(1);
    const new_id = documents.length > 0 ? documents[0].id + 1 : 1;

    const review = new Reviews({
      id: new_id,
      name: data['name'],
      dealership: data['dealership'],
      review: data['review'],
      purchase: data['purchase'],
      purchase_date: data['purchase_date'],
      car_make: data['car_make'],
      car_model: data['car_model'],
      car_year: data['car_year']
    });

    const savedReview = await review.save();
    res.status(201).json(savedReview);
  } catch (error) {
    console.error('Error inserting review:', error);
    const status = error.name === 'ValidationError' || error instanceof SyntaxError ? 400 : 500;
    res.status(status).json({ error: status === 400 ? 'Invalid review data' : 'Error inserting review' });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
