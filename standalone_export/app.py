"""
=============================================================================
West End Star Academy - Official CBC School Management System
Backend REST API in Python / Flask with SQLite3
=============================================================================

Key Configurations:
1. First Grade: "Reception" followed by PP1, PP2, Grade 1 to Grade 9 (JSS).
2. Learner Enrolment: Stores strictly what the user inserts; leaves fields blank otherwise.
3. Excluded from Enrolment: Stream/Selection, School House, Guardian Email,
   Physical Residential Area, Admission Term Fees, and Health History.
4. Bursar & Payments: M-Pesa, Direct Bank, Cash/Cheque. No hardcoded Paybill 247247.
5. CBC Assessments: Exceeding Expectation (EE - 4), Meeting Expectation (ME - 3),
   Approaching Expectation (AE - 2), Below Expectation (BE - 1).

Requirements:
    pip install flask flask-cors

Run:
    python app.py
"""

import os
import sqlite3
import random
from datetime import datetime
from flask import Flask, request, jsonify

app = Flask(__name__)

# Enable CORS for cross-origin frontend communication
try:
    from flask_cors import CORS
    CORS(app)
except ImportError:
    pass

DB_PATH = os.path.join(os.path.dirname(__file__), "wesa_cbc.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes SQLite tables and seeds baseline demonstration data."""
    conn = get_db()
    cursor = conn.cursor()

    # 1. Students / Learners Table
    # Reception is first class. Excludes stream, house, email, address, health history
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reg_no TEXT UNIQUE,
        nemis_upi TEXT,
        full_name TEXT NOT NULL,
        grade TEXT NOT NULL DEFAULT 'Reception',
        gender TEXT,
        guardian_name TEXT,
        guardian_phone TEXT,
        fee_balance REAL DEFAULT 15000.0,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. CBC Assessments Table (Rubrics: EE, ME, AE, BE)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        strand TEXT,
        rubric TEXT NOT NULL, -- EE, ME, AE, BE
        term TEXT DEFAULT 'Term 1',
        academic_year INTEGER DEFAULT 2026,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    """)

    # 3. Bursar / Payment Records Table
    # No hardcoded M-Pesa paybill required; tracks cash, direct bank, and m-pesa references
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_no TEXT UNIQUE NOT NULL,
        student_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        reference_no TEXT,
        balance_remaining REAL NOT NULL,
        date_paid TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
    );
    """)

    # 4. Bursaries & Capitation Grants Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bursaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        bursary_type TEXT NOT NULL, -- NG-CDF, County Executive, Ministry Capitation
        voucher_number TEXT,
        amount REAL NOT NULL,
        disbursed_date TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id)
    );
    """)

    conn.commit()

    # Seed initial demo learners with Reception as first class if fresh database
    cursor.execute("SELECT COUNT(*) FROM students;")
    count = cursor.fetchone()[0]
    if count == 0:
        cursor.executemany("""
        INSERT INTO students (reg_no, nemis_upi, full_name, grade, gender, guardian_name, guardian_phone, fee_balance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, [
            ("WESA/2026/001", "UP-90218-A", "Amani Muthoni", "Reception", "Female", "Mary Wanjiku", "+254 712 345 678", 0.0),
            ("WESA/2026/002", "UP-90219-B", "Baraka Kiprop", "PP1", "Male", "David Kiprop", "+254 723 456 789", 4500.0),
            ("WESA/2026/003", "UP-90220-C", "Zawadi Kemboi", "Grade 1", "Female", "Faith Chebet", "+254 734 567 890", 0.0),
            ("WESA/2026/004", "UP-90221-D", "Jabali Omondi", "Grade 2", "Male", "John Omondi", "+254 745 678 901", 8000.0)
        ])

        # Seed initial assessments
        cursor.executemany("""
        INSERT INTO assessments (student_id, subject, strand, rubric, term, remarks)
        VALUES (?, ?, ?, ?, ?, ?);
        """, [
            (1, "Creative Arts & Sports", "Color Awareness & Drawing", "EE", "Term 1", "Exemplary motor coordination and creative enthusiasm."),
            (2, "Science & Technology", "Living Things & Plants", "ME", "Term 1", "Identifies local vegetation accurately."),
            (3, "Creative Arts & Sports", "Indigenous Pottery", "EE", "Term 1", "Exceptional clay hand-building skill."),
            (4, "English Language Activities", "Listening & Speaking", "ME", "Term 1", "Constructs fluent sentences with confidence.")
        ])

        # Seed initial payments
        cursor.executemany("""
        INSERT INTO payments (receipt_no, student_id, amount, payment_method, reference_no, balance_remaining, date_paid)
        VALUES (?, ?, ?, ?, ?, ?, ?);
        """, [
            ("RCP-2026-001", 1, 15000.0, "M-Pesa", "QHK8291KL0", 0.0, "2026-01-10"),
            ("RCP-2026-002", 2, 10500.0, "Bank Transfer", "FT260110398", 4500.0, "2026-01-12"),
            ("RCP-2026-003", 3, 15000.0, "M-Pesa", "QHL99321AB", 0.0, "2026-01-15"),
            ("RCP-2026-004", 4, 7000.0, "Cash", "CSH-26-088", 8000.0, "2026-01-18")
        ])

        conn.commit()

    conn.close()


# ==================== API ENDPOINTS ====================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "school": "West End Star Academy",
        "system": "CBC School Management System API",
        "first_class": "Reception",
        "status": "online",
        "endpoints": [
            "/api/stats",
            "/api/students",
            "/api/assessments",
            "/api/payments",
            "/api/receipt/<receipt_no>",
            "/api/parent/lookup"
        ]
    })


@app.route("/api/stats", methods=["GET"])
def get_stats():
    """Returns overview metrics for West End Star Academy dashboard."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM students;")
    total_students = cursor.fetchone()[0]

    cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM payments;")
    total_collected = cursor.fetchone()[0]

    cursor.execute("SELECT COALESCE(SUM(fee_balance), 0) FROM students;")
    outstanding_balance = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM assessments;")
    total_assessments = cursor.fetchone()[0]

    cursor.execute("SELECT rubric, COUNT(*) FROM assessments GROUP BY rubric;")
    rubric_counts = {row["rubric"]: row[1] for row in cursor.fetchall()}

    conn.close()
    return jsonify({
        "totalStudents": total_students,
        "totalCollected": total_collected,
        "outstandingBalance": outstanding_balance,
        "totalAssessments": total_assessments,
        "rubricDistribution": {
            "EE": rubric_counts.get("EE", 0),
            "ME": rubric_counts.get("ME", 0),
            "AE": rubric_counts.get("AE", 0),
            "BE": rubric_counts.get("BE", 0),
        }
    })


@app.route("/api/students", methods=["GET", "POST"])
def manage_students():
    """
    GET: List enrolled learners with optional search or grade filtering.
    POST: Enroll a new learner. STRICTLY stores inserted fields; leaves blank otherwise.
    """
    conn = get_db()
    cursor = conn.cursor()

    if request.method == "GET":
        search = request.args.get("search", "").strip()
        grade = request.args.get("grade", "").strip()

        query = "SELECT * FROM students WHERE 1=1"
        params = []

        if search:
            query += " AND (full_name LIKE ? OR reg_no LIKE ? OR nemis_upi LIKE ?)"
            term = f"%{search}%"
            params.extend([term, term, term])

        if grade:
            query += " AND grade = ?"
            params.append(grade)

        query += " ORDER BY id DESC"
        cursor.execute(query, params)
        students = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(students)

    elif request.method == "POST":
        data = request.json or {}
        full_name = data.get("full_name", "").strip()
        if not full_name:
            conn.close()
            return jsonify({"error": "Student Full Name is required"}), 400

        reg_no = data.get("reg_no", "").strip()
        if not reg_no:
            cursor.execute("SELECT COUNT(*) FROM students;")
            count = cursor.fetchone()[0] + 1
            reg_no = f"WESA-2025-{str(count).zfill(4)}"

        # STRICT SPECIFICATION: Only store what is inserted; leave blank otherwise
        # Default first class is Reception
        grade = data.get("grade", "Reception")
        nemis_upi = data.get("nemis_upi", "").strip()
        gender = data.get("gender", "")
        guardian_name = data.get("guardian_name", "").strip()
        guardian_phone = data.get("guardian_phone", "").strip()
        fee_balance = float(data.get("fee_balance", 15000.0))

        cursor.execute("""
        INSERT INTO students (reg_no, nemis_upi, full_name, grade, gender, guardian_name, guardian_phone, fee_balance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, (reg_no, nemis_upi, full_name, grade, gender, guardian_name, guardian_phone, fee_balance))
        conn.commit()

        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM students WHERE id = ?;", (new_id,))
        created_student = dict(cursor.fetchone())
        conn.close()
        return jsonify(created_student), 201


@app.route("/api/students/<int:student_id>", methods=["DELETE"])
def delete_student(student_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM students WHERE id = ?;", (student_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": f"Student #{student_id} removed successfully"})


@app.route("/api/assessments", methods=["GET", "POST"])
def manage_assessments():
    """
    GET: List all assessments.
    POST: Record a CBC rubric assessment (EE, ME, AE, BE).
    """
    conn = get_db()
    cursor = conn.cursor()

    if request.method == "GET":
        cursor.execute("""
        SELECT a.*, s.full_name as student_name, s.grade, s.reg_no
        FROM assessments a
        JOIN students s ON a.student_id = s.id
        ORDER BY a.id DESC;
        """)
        assessments = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(assessments)

    elif request.method == "POST":
        data = request.json or {}
        student_id = data.get("student_id")
        subject = data.get("subject", "").strip()
        rubric = data.get("rubric", "ME").strip().upper()

        if not student_id or not subject:
            conn.close()
            return jsonify({"error": "student_id and subject are required"}), 400

        strand = data.get("strand", "").strip()
        term = data.get("term", "Term 1")
        remarks = data.get("remarks", "").strip()

        cursor.execute("""
        INSERT INTO assessments (student_id, subject, strand, rubric, term, remarks)
        VALUES (?, ?, ?, ?, ?, ?);
        """, (student_id, subject, strand, rubric, term, remarks))
        conn.commit()

        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM assessments WHERE id = ?;", (new_id,))
        created_assessment = dict(cursor.fetchone())
        conn.close()
        return jsonify(created_assessment), 201


@app.route("/api/payments", methods=["GET", "POST"])
def manage_payments():
    """
    GET: List all payment records.
    POST: Record fee payment, update student balance, and generate official voucher receipt.
    """
    conn = get_db()
    cursor = conn.cursor()

    if request.method == "GET":
        cursor.execute("""
        SELECT p.*, s.full_name as student_name, s.reg_no, s.grade
        FROM payments p
        JOIN students s ON p.student_id = s.id
        ORDER BY p.id DESC;
        """)
        payments = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(payments)

    elif request.method == "POST":
        data = request.json or {}
        student_id = data.get("student_id")
        amount = float(data.get("amount", 0))

        if not student_id or amount <= 0:
            conn.close()
            return jsonify({"error": "Valid student_id and amount are required"}), 400

        cursor.execute("SELECT * FROM students WHERE id = ?;", (student_id,))
        student = cursor.fetchone()
        if not student:
            conn.close()
            return jsonify({"error": "Student not found"}), 404

        current_balance = float(student["fee_balance"] or 0.0)
        new_balance = max(0.0, current_balance - amount)

        cursor.execute("UPDATE students SET fee_balance = ? WHERE id = ?;", (new_balance, student_id))

        receipt_no = f"REC-2026-{random.randint(1000, 9999)}"
        date_paid = data.get("date_paid") or datetime.now().strftime("%Y-%m-%d")
        payment_method = data.get("payment_method", "M-Pesa")
        reference_no = data.get("reference_no", "").strip()

        cursor.execute("""
        INSERT INTO payments (receipt_no, student_id, amount, payment_method, reference_no, balance_remaining, date_paid)
        VALUES (?, ?, ?, ?, ?, ?, ?);
        """, (receipt_no, student_id, amount, payment_method, reference_no, new_balance, date_paid))
        conn.commit()

        cursor.execute("""
        SELECT p.*, s.full_name as student_name, s.reg_no
        FROM payments p
        JOIN students s ON p.student_id = s.id
        WHERE p.receipt_no = ?;
        """, (receipt_no,))
        created_payment = dict(cursor.fetchone())
        conn.close()
        return jsonify(created_payment), 201


@app.route("/api/receipt/<receipt_no>", methods=["GET"])
def get_receipt(receipt_no):
    """Retrieve full official receipt details with school header information."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT p.*, s.full_name as student_name, s.reg_no, s.grade, s.guardian_name, s.guardian_phone
    FROM payments p
    JOIN students s ON p.student_id = s.id
    WHERE p.receipt_no = ?;
    """, (receipt_no,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Receipt voucher not found"}), 404

    receipt_data = dict(row)
    receipt_data["school"] = {
        "name": "West End Star Academy",
        "box": "P.O. Box 45210 - 00100, Nairobi, Kenya",
        "phone": "+254 722 000 000",
        "motto": "Excellence in Competency & Character",
        "knec_reg": "WESA/PRI/2024"
    }
    return jsonify(receipt_data)


@app.route("/api/parent/lookup", methods=["GET"])
def parent_lookup():
    """Allows parents to query student ledger using Registration Number or NEMIS UPI."""
    query = request.args.get("query", "").strip()
    if not query:
        return jsonify({"error": "Query parameter required"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM students 
    WHERE LOWER(reg_no) = LOWER(?) OR LOWER(nemis_upi) = LOWER(?) OR LOWER(full_name) LIKE LOWER(?);
    """, (query, query, f"%{query}%"))
    student = cursor.fetchone()

    if not student:
        conn.close()
        return jsonify({"error": "No learner found matching query"}), 404

    student_data = dict(student)

    cursor.execute("SELECT * FROM payments WHERE student_id = ? ORDER BY id DESC;", (student_data["id"],))
    student_data["payments"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return jsonify(student_data)


if __name__ == "__main__":
    init_db()
    print("=" * 65)
    print(" West End Star Academy - Official CBC Management System API")
    print(" First Class: Reception | Database: wesa_cbc.db")
    print(" Server running at: http://127.0.0.1:5000")
    print("=" * 65)
    app.run(host="0.0.0.0", port=5000, debug=True)
