const AttendanceManager = artifacts.require("AttendanceManager");
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const admin = accounts[0];
    const professor = accounts[1];
    const students = accounts.slice(2);
    
    const instance = await AttendanceManager.deployed();
    
    console.log("--- SEEDING ON-CHAIN DATA ---");
    
    // 1. Onboard Professor
    try {
      await instance.onboard("Dr. Alan Turing", "PROFESSOR", "", { from: professor });
    } catch(e) {}
    
    // 2. Onboard Students
    const studentNames = ["Ada Lovelace", "Grace Hopper", "John von Neumann", "Claude Shannon", "Linus Torvalds", "Tim Berners-Lee", "Margaret Hamilton", "Donald Knuth"];
    for (let i = 0; i < students.length; i++) {
      try {
        await instance.onboard(studentNames[i] || `Student ${i}`, "STUDENT", "", { from: students[i] });
      } catch(e) {}
    }
    
    const courses = [
      { id: "CS101", name: "Intro to Cryptography" },
      { id: "MAT202", name: "Discrete Mathematics" },
      { id: "BIO303", name: "Bioinformatics" }
    ];
    
    const enrollments = [];
    const now = Date.now();
    
    for (const course of courses) {
      for (let s = 1; s <= 3; s++) {
        const tx = await instance.openSession(course.id, `${course.name} - Session #${s}`, 60, { from: professor });
        // Get the actual session ID from events
        const sessionId = tx.logs.find(l => l.event === "SessionOpened").args.sessionId.toNumber();
        
        console.log(`Opened & Activating Session ${sessionId} for ${course.id}`);
        await instance.activateSession(sessionId, "Demo Location", { from: professor });
        
        for (let i = 0; i < students.length; i++) {
          const studentAddr = students[i];
          if (s === 1) {
            enrollments.push({
              id: crypto.randomUUID(),
              studentAddress: studentAddr,
              studentName: studentNames[i] || `Student ${i}`,
              courseId: course.id,
              courseName: course.name,
              professorAddress: professor,
              status: "APPROVED",
              appliedAt: now,
              updatedAt: now
            });
          }
          
          let probability = 0.5;
          if (i === 0 || i === 1) probability = 1.0;
          if (i === 4) probability = 0.2;
          if (i === 2 || i === 3) probability = 0.6;
          
          if (Math.random() < probability) {
            await instance.checkIn(sessionId, "0x", { from: studentAddr });
          }
        }
        
        // LEAVE ONE SESSION ACTIVE FOR DEMO PURPOSES
        if (s === 3) {
          console.log(`  Leaving Session ${sessionId} ACTIVE for student demo`);
        } else {
          await instance.closeSession(sessionId, { from: professor });
        }
      }
    }
    
    const enrollPath = path.join(__dirname, "../server/data/enrollments.json");
    fs.writeFileSync(enrollPath, JSON.stringify(enrollments, null, 2));
    console.log("--- SEEDING COMPLETE ---");
    callback();
  } catch (err) {
    console.error(err);
    callback(err);
  }
}
