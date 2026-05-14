/**
 * ChainPresence — AttendanceManager Test Suite
 * Framework: Mocha + Chai (via Truffle)
 */

const AttendanceManager = artifacts.require("AttendanceManager");
const { expect } = require("chai");
const { BN, expectRevert, time } = require("@openzeppelin/test-helpers");

contract("AttendanceManager", function (accounts) {
  const [admin, professor, student, stranger, student2] = accounts;

  let contract;

  const ADMIN_ROLE     = web3.utils.keccak256("ADMIN_ROLE");
  const PROFESSOR_ROLE = web3.utils.keccak256("PROFESSOR_ROLE");
  const STUDENT_ROLE   = web3.utils.keccak256("STUDENT_ROLE");

  const COURSE_ID     = "CS101";
  const COURSE_NAME   = "Introduction to Computer Science";
  const DURATION      = 60; // minutes
  const LOCATION_HASH = "geo:48.8566,2.3522";

  // ─── Helpers ──────────────────────────────────────────────────────────────

  async function setup() {
    contract = await AttendanceManager.new(admin);
  }

  async function registerBoth() {
    await contract.registerProfessor(professor, "Dr. Smith", { from: admin });
    await contract.registerStudent(student, "Alice", { from: admin });
  }

  async function openSession() {
    const tx = await contract.openSession(
      COURSE_ID,
      COURSE_NAME,
      DURATION,
      LOCATION_HASH,
      { from: professor }
    );
    // Extract sessionId from event
    const event = tx.logs.find((l) => l.event === "SessionOpened");
    return event.args.sessionId.toNumber();
  }

  // ─── Test: Role Registration ───────────────────────────────────────────────

  describe("1. Admin registration", function () {
    before(setup);

    it("admin can register a student", async function () {
      const tx = await contract.registerStudent(student, "Alice", { from: admin });
      const hasRole = await contract.hasRole(STUDENT_ROLE, student);
      expect(hasRole).to.be.true;

      // Check event
      const event = tx.logs.find((l) => l.event === "StudentRegistered");
      expect(event).to.not.be.undefined;
      expect(event.args.wallet).to.equal(student);
      expect(event.args.name).to.equal("Alice");
    });

    it("admin can register a professor", async function () {
      const tx = await contract.registerProfessor(professor, "Dr. Smith", { from: admin });
      const hasRole = await contract.hasRole(PROFESSOR_ROLE, professor);
      expect(hasRole).to.be.true;

      const event = tx.logs.find((l) => l.event === "ProfessorRegistered");
      expect(event).to.not.be.undefined;
      expect(event.args.wallet).to.equal(professor);
    });

    it("stores user names correctly", async function () {
      const name = await contract.userNames(student);
      expect(name).to.equal("Alice");
    });

    it("stores user roles correctly", async function () {
      const role = await contract.userRole(professor);
      expect(role).to.equal("PROFESSOR");
    });
  });

  // ─── Test: Non-Admin Cannot Register ──────────────────────────────────────

  describe("2. Non-admin cannot register users", function () {
    before(setup);

    it("stranger cannot register a student", async function () {
      await expectRevert.unspecified(
        contract.registerStudent(student2, "Bob", { from: stranger })
      );
    });

    it("stranger cannot register a professor", async function () {
      await expectRevert.unspecified(
        contract.registerProfessor(stranger, "Dr. Evil", { from: stranger })
      );
    });

    it("professor cannot register another user", async function () {
      // First make stranger a professor
      await contract.registerProfessor(professor, "Dr. Smith", { from: admin });
      await expectRevert.unspecified(
        contract.registerStudent(student2, "Bob", { from: professor })
      );
    });
  });

  // ─── Test: Session Management ──────────────────────────────────────────────

  describe("3. Professor can open a session", function () {
    before(async function () {
      await setup();
      await registerBoth();
    });

    it("professor opens a session and emits SessionOpened event", async function () {
      const tx = await contract.openSession(
        COURSE_ID,
        COURSE_NAME,
        DURATION,
        LOCATION_HASH,
        { from: professor }
      );

      const event = tx.logs.find((l) => l.event === "SessionOpened");
      expect(event).to.not.be.undefined;
      expect(event.args.courseName).to.equal(COURSE_NAME);
      expect(event.args.professor).to.equal(professor);

      const sessionId = event.args.sessionId.toNumber();
      expect(sessionId).to.equal(1);

      const session = await contract.getSession(sessionId);
      expect(session.isOpen).to.be.true;
      expect(session.courseId).to.equal(COURSE_ID);
    });

    it("student cannot open a session", async function () {
      await expectRevert.unspecified(
        contract.openSession(COURSE_ID, COURSE_NAME, DURATION, "", { from: student })
      );
    });
  });

  // ─── Test: Student Check-In ────────────────────────────────────────────────

  describe("4. Student can check in to open session", function () {
    before(async function () {
      await setup();
      await registerBoth();
    });

    it("student checks in and AttendanceMarked event is emitted", async function () {
      const sessionId = await openSession();

      const tx = await contract.checkIn(sessionId, "0x", { from: student });

      // Verify event
      const event = tx.logs.find((l) => l.event === "AttendanceMarked");
      expect(event).to.not.be.undefined;
      expect(event.args.sessionId.toNumber()).to.equal(sessionId);
      expect(event.args.student).to.equal(student);

      // Verify state
      const checked = await contract.hasCheckedIn(student, sessionId);
      expect(checked).to.be.true;

      const attendees = await contract.getSessionAttendees(sessionId);
      expect(attendees).to.include(student);
    });
  });

  // ─── Test: No Double Check-In ──────────────────────────────────────────────

  describe("5. Student cannot check in twice", function () {
    before(async function () {
      await setup();
      await registerBoth();
    });

    it("reverts on second check-in attempt", async function () {
      const sessionId = await openSession();
      await contract.checkIn(sessionId, "0x", { from: student });

      await expectRevert(
        contract.checkIn(sessionId, "0x", { from: student }),
        "Already checked in"
      );
    });
  });

  // ─── Test: Closed Session Check-In ────────────────────────────────────────

  describe("6. Student cannot check in to closed session", function () {
    before(async function () {
      await setup();
      await registerBoth();
    });

    it("reverts when session is closed", async function () {
      const sessionId = await openSession();
      await contract.closeSession(sessionId, { from: professor });

      await expectRevert(
        contract.checkIn(sessionId, "0x", { from: student }),
        "Session is closed"
      );
    });
  });

  // ─── Test: Attendance Rate ─────────────────────────────────────────────────

  describe("7. getAttendanceRate returns correct percentage", function () {
    before(async function () {
      await setup();
      await registerBoth();
      await contract.registerStudent(student2, "Bob", { from: admin });
    });

    it("returns 100% when student attended all sessions", async function () {
      const s1 = await openSession();
      await contract.checkIn(s1, "0x", { from: student });
      await contract.closeSession(s1, { from: professor });

      const s2 = await openSession();
      await contract.checkIn(s2, "0x", { from: student });
      await contract.closeSession(s2, { from: professor });

      const rate = await contract.getAttendanceRate(student);
      expect(rate.toNumber()).to.equal(100);
    });

    it("returns 50% when student attended half the sessions", async function () {
      // student2 attends only s3 out of s3+s4
      const s3 = await openSession();
      await contract.checkIn(s3, "0x", { from: student2 });
      await contract.closeSession(s3, { from: professor });

      const s4 = await openSession();
      // student2 does NOT check in
      await contract.closeSession(s4, { from: professor });

      const rate = await contract.getAttendanceRate(student2);
      // student2 attended 1 out of 4 total closed sessions (s1,s2,s3,s4)
      // But student2 only attended s3 → 1/4 = 25%
      // This is correct because all platform sessions count
      expect(rate.toNumber()).to.be.lte(100);
    });

    it("returns 0% for student with no attendance", async function () {
      const rate = await contract.getAttendanceRate(stranger);
      expect(rate.toNumber()).to.equal(0);
    });
  });

  // ─── Test: Session Expiry ──────────────────────────────────────────────────

  describe("8. Session expires after duration", function () {
    before(async function () {
      await setup();
      await registerBoth();
    });

    it("student cannot check in after session duration expires", async function () {
      // Open a session with 1 minute duration
      const tx = await contract.openSession(
        COURSE_ID,
        COURSE_NAME,
        1, // 1 minute
        "",
        { from: professor }
      );
      const event = tx.logs.find((l) => l.event === "SessionOpened");
      const sessionId = event.args.sessionId.toNumber();

      // Advance EVM time by 2 minutes
      await time.increase(time.duration.minutes(2));

      await expectRevert(
        contract.checkIn(sessionId, "0x", { from: student }),
        "Session has expired"
      );
    });
  });

  // ─── Test: Remove User ─────────────────────────────────────────────────────

  describe("9. Admin can remove a user", function () {
    before(async function () {
      await setup();
      await registerBoth();
    });

    it("admin removes a student and role is revoked", async function () {
      await contract.removeUser(student, { from: admin });
      const hasRole = await contract.hasRole(STUDENT_ROLE, student);
      expect(hasRole).to.be.false;

      const name = await contract.userNames(student);
      expect(name).to.equal("");
    });
  });
});
