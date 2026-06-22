// src/scripts/deleteVideoSolutionField.js
import 'dotenv/config';
import mongoose from 'mongoose';

async function deleteVideoSolutionField() {
  try {
    await mongoose.connect(process.env.DB_CONNECT_STRING);

    // Use raw MongoDB collection instead of Mongoose model
    const db = mongoose.connection.db;
    const problemsCollection = db.collection('problems');

    // Count how many problems have the videoSolution field
    const countBefore = await problemsCollection.countDocuments({
      videoSolution: { $exists: true }
    });

    if (countBefore === 0) {
      await mongoose.disconnect();
      return;
    }

    // Remove the videoSolution field from ALL documents
    await problemsCollection.updateMany(
      {},  // Match all documents
      { $unset: { videoSolution: "" } }  // Remove the field
    );

    // Verify deletion
    const countAfter = await problemsCollection.countDocuments({
      videoSolution: { $exists: true }
    });

    await mongoose.disconnect();
  } catch (error) {
    process.exit(1);
  }
}

deleteVideoSolutionField();
