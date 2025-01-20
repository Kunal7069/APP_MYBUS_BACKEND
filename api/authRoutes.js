require('dotenv').config();

const express = require("express");
const jwt = require('jsonwebtoken');
const router = express.Router();
const axios = require("axios");

module.exports = (db) => {
    
  // Signup API
  router.post('/signup', async (req, res) => {
    const { name, gender, email, phone } = req.body;
    const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
    const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (phone.length < 10) {
      return res.status(400).json({ error: 'Mobile number must be at least 10 digits' });
    }

    try {
      const existingEmail = await db.collection("USERS").findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ error: 'User already exists with this Email' });
      }
      const existingPhone = await db.collection("USERS").findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ error: 'User already exists with this Phone Number' });
      }
      const newUser = {
        name,
        gender,
        email,
        phone,
      };

      const result = await db.collection("USERS").insertOne(newUser);
      // Generate access token (expires in 1 hour)
      const accessToken = jwt.sign({ userId: result._id }, ACCESS_TOKEN_SECRET, { expiresIn: '7d' });

        // Generate refresh token (expires in 7 days)
      const refreshToken = jwt.sign({ userId: result._id }, REFRESH_TOKEN_SECRET, { expiresIn: '1440h' });
      res.status(201).json({ message: 'User registered successfully', userId: result.insertedId,accessToken,
            refreshToken });
    } catch (error) {
      console.error('Error signing up:', error);
      res.status(500).json({ error: 'Error registering user' });
    }
  });


  router.post('/login', async (req, res) => {
    const { phone } = req.body;
    const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
    const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
    // Validate phone number
    if (!phone || phone.length < 10) {
        return res.status(400).json({ error: 'Mobile number must be at least 10 digits' });
    }

    try {
        // Check if user exists with the provided phone number
        const user = await db.collection("USERS").findOne({ phone });
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please sign up first.' });
        }

        // Generate access token (expires in 1 hour)
        const accessToken = jwt.sign({ userId: user._id }, ACCESS_TOKEN_SECRET, { expiresIn: '7d' });

        // Generate refresh token (expires in 7 days)
        const refreshToken = jwt.sign({ userId: user._id }, REFRESH_TOKEN_SECRET, { expiresIn: '1440h' });

        
        return res.status(200).json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                gender: user.gender,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Error logging in user' });
    }
});


router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;

  // Check if the refresh token is provided
  if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
  }

  // Verify the refresh token
  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) {
          console.error('Refresh token verification error:', err.stack);
          return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      // Generate a new access token
      const newAccessToken = jwt.sign({ userId: decoded.userId }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

      return res.status(200).json({
          message: 'Access token refreshed successfully',
          accessToken: newAccessToken
      });
  });
});

router.post('/otp',async  (req, res) => {
  try {
    const { name, gender, email,phone } = req.body;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (phone.length < 10) {
      return res.status(400).json({ error: 'Mobile number must be at least 10 digits' });
    }

  
      const existingEmail = await db.collection("USERS").findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ error: 'User already exists with this Email' });
      }
      const existingPhone = await db.collection("USERS").findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ error: 'User already exists with this Phone Number' });
      }

      const otp = Math.floor(1000 + Math.random() * 9000); // Ensures 4 digits

      // Send the OTP in the response
      res.status(200).json({
          message: 'OTP generated successfully',
          otp: otp
      });
  } catch (error) {
      console.error('Error generating OTP:', error);
      res.status(500).json({ error: 'Failed to generate OTP' });
  }
});  

router.post('/login-otp',async  (req, res) => {
  try {
    const { phone } = req.body;
    if (phone.length < 10) {
      return res.status(400).json({ error: 'Mobile number must be at least 10 digits' });
    }
    const existingPhone = await db.collection("USERS").findOne({ phone });
     if (existingPhone) {
       const otp = Math.floor(1000 + Math.random() * 9000); // Ensures 4 digits

      // Send the OTP in the response
      res.status(200).json({
          message: 'OTP generated successfully',
          otp: otp,
          existingPhone:existingPhone
      });
      }
      else{
           res.status(200).json({
          message: 'Mobile Number Not Registered'
      });
      }
          

      
  } catch (error) {
      console.error('Error generating OTP:', error);
      res.status(500).json({ error: 'Failed to generate OTP' });
  }
});  


  return router;  

}