import express from "express";
import admin from "firebase-admin";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: "GET,POST,PATCH,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);
app.use(express.json());

// Home route
app.get("/", async (req, res) => {
  try {
    const visitRef = admin.firestore().collection("stats").doc("visitCount");
    const visitDoc = await visitRef.get();

    if (!visitDoc.exists) {
      await visitRef.set({ count: 1 });
    } else {
      await visitRef.update({ count: admin.firestore.FieldValue.increment(1) });
    }

    res.send("API of the Virtual Herbal Garden");
  } catch (error) {
    console.error("Error incrementing visit count:", error);
    res.status(500).json({ error: "Failed to increment visit count" });
  }
});

// Visit count
app.get("/api/visit-count", async (req, res) => {
  try {
    const visitRef = admin.firestore().collection("stats").doc("visitCount");
    const visitDoc = await visitRef.get();
    res.status(200).json({ visitCount: visitDoc.exists ? visitDoc.data().count : 0 });
  } catch (error) {
    console.error("Error fetching visit count:", error);
    res.status(500).json({ error: "Failed to fetch visit count" });
  }
});

// Users
// app.get("/api/users", async (req, res) => {
//   try {
//     const listUsers = await admin.auth().listUsers();
//     const users = listUsers.users.map((user) => ({
//       uid: user.uid,
//       email: user.email,
//       displayName: user.displayName || "Anonymous",
//     }));
//     res.status(200).json({ totalUsers: users.length, users });
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     res.status(500).json({ error: "Failed to fetch users" });
//   }
// });
// app.get("/api/users", async (req, res) => {
//   try {
//     const snapshot = await realtimeDb.ref("users").once("value");
//     const usersData = snapshot.val();

//     const users = usersData
//       ? Object.entries(usersData).map(([uid, userObj]) => ({
//           uid,
//           ...userObj,
//         }))
//       : [];

//     res.status(200).json({ totalUsers: users.length, users });
//   } catch (error) {
//     console.error("Error fetching users from Realtime Database:", error);
//     res.status(500).json({ error: "Failed to fetch users" });
//   }
// });
app.get("/api/users", async (req, res) => {
  try {
    const allUsers = [];
    let nextPageToken;

    do {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      result.users.forEach((userRecord) => {
        allUsers.push({
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName || "Anonymous",
        });
      });
      nextPageToken = result.pageToken;
    } while (nextPageToken);

    res.status(200).json({ totalUsers: allUsers.length, users: allUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

