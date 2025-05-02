import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // console.log("MongoDB URI:", process.env.URI);
    const conn = await mongoose.connect(process.env.URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection error:", err); // Log the error
  }
};
