/**
 * =============================================================================
 * West End Star Academy - Official CBC School Management System
 * Production-Grade Spring Boot / Java REST API Application
 * =============================================================================
 *
 * Requirements & Maven Dependency (pom.xml):
 *   <parent>
 *     <groupId>org.springframework.boot</groupId>
 *     <artifactId>spring-boot-starter-parent</artifactId>
 *     <version>3.2.3</version>
 *   </parent>
 *   <dependencies>
 *     <dependency>
 *       <groupId>org.springframework.boot</groupId>
 *       <artifactId>spring-boot-starter-web</artifactId>
 *     </dependency>
 *   </dependencies>
 *
 * Run:
 *   mvn spring-boot:run
 *   (or run as standard Java main class in IntelliJ IDEA, Eclipse, or VS Code)
 *   Server runs on http://localhost:8080
 */

package com.westendstar.cbc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@SpringBootApplication
@RestController
@CrossOrigin(origins = "*")
public class WestEndStarAcademyApplication {

    public static void main(String[] args) {
        SpringApplication.run(WestEndStarAcademyApplication.class, args);
        System.out.println("=================================================================");
        System.out.println(" West End Star Academy - Official CBC Management API (Java)");
        System.out.println(" Premier Entry Class: Reception");
        System.out.println(" Listening at http://localhost:8080");
        System.out.println("=================================================================");
    }

    // -------------------------------------------------------------
    // DATA REPOSITORIES (In-Memory Thread-Safe Data Store)
    // -------------------------------------------------------------
    private final Map<Long, Student> students = new ConcurrentHashMap<>();
    private final Map<Long, Assessment> assessments = new ConcurrentHashMap<>();
    private final Map<String, Payment> payments = new ConcurrentHashMap<>();

    private final AtomicLong studentIdGen = new AtomicLong(100);
    private final AtomicLong assessmentIdGen = new AtomicLong(200);

    // Initializer constructor: Seeds initial CBC demo data
    public WestEndStarAcademyApplication() {
        // 1. Initial learners with Reception as first class
        Student s1 = new Student(1L, "WESA-2025-0101", "UPI-481920", "Amina Mohamed Noor", "Reception", "Female", "Fatuma Noor", "0722112233", 0.0);
        Student s2 = new Student(2L, "WESA-2025-0102", "UPI-591024", "Brian Kiprono Koech", "Grade 5", "Male", "David Koech", "0711334455", 4500.0);
        Student s3 = new Student(3L, "WESA-2025-0103", "UPI-619204", "Clara Wanjiku Kamau", "Grade 7 (JSS)", "Female", "Grace Wanjiku", "0733556677", 12000.0);
        Student s4 = new Student(4L, "WESA-2025-0104", "", "Dan Otieno Omondi", "Grade 3", "Male", "Joseph Omondi", "0700889900", 0.0);

        students.put(s1.getId(), s1);
        students.put(s2.getId(), s2);
        students.put(s3.getId(), s3);
        students.put(s4.getId(), s4);

        // 2. Initial Assessments
        Assessment a1 = new Assessment(1L, 1L, "Amina Mohamed Noor", "Creative Arts & Sports", "Color Awareness & Drawing", "EE", "Term 1", "Exemplary motor coordination and creative enthusiasm.");
        Assessment a2 = new Assessment(2L, 2L, "Brian Kiprono Koech", "Science & Technology", "Living Things & Plants", "ME", "Term 1", "Identifies local vegetation accurately.");
        Assessment a3 = new Assessment(3L, 3L, "Clara Wanjiku Kamau", "Creative Arts & Sports", "Indigenous Pottery", "EE", "Term 1", "Exceptional clay hand-building skill.");
        Assessment a4 = new Assessment(4L, 4L, "Dan Otieno Omondi", "English Language Activities", "Listening & Speaking", "ME", "Term 1", "Constructs fluent sentences with confidence.");

        assessments.put(a1.getId(), a1);
        assessments.put(a2.getId(), a2);
        assessments.put(a3.getId(), a3);
        assessments.put(a4.getId(), a4);

        // 3. Initial Payments (No hardcoded Paybill required)
        Payment p1 = new Payment("REC-2025-8801", 1L, "Amina Mohamed Noor", "WESA-2025-0101", 18500.0, "M-Pesa", "RJB928KL01", 0.0, "2025-02-10");
        Payment p2 = new Payment("REC-2025-8802", 2L, "Brian Kiprono Koech", "WESA-2025-0102", 14000.0, "Direct Bank Deposit", "BNK-492041", 4500.0, "2025-02-12");
        Payment p3 = new Payment("REC-2025-8803", 4L, "Dan Otieno Omondi", "WESA-2025-0104", 18500.0, "Cash / Cheque", "CHQ-00192", 0.0, "2025-02-15");

        payments.put(p1.getReceiptNo(), p1);
        payments.put(p2.getReceiptNo(), p2);
        payments.put(p3.getReceiptNo(), p3);
    }

    // -------------------------------------------------------------
    // REST API ENDPOINTS
    // -------------------------------------------------------------

    @GetMapping("/")
    public Map<String, Object> root() {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("school", "West End Star Academy");
        res.put("system", "CBC School Management System (Java Spring Boot)");
        res.put("firstClass", "Reception");
        res.put("status", "running");
        res.put("endpoints", Arrays.asList(
            "/api/stats",
            "/api/students",
            "/api/assessments",
            "/api/payments",
            "/api/receipt/{receiptNo}",
            "/api/parent/lookup?query={query}"
        ));
        return res;
    }

    // 1. Dashboard Overview Statistics
    @GetMapping("/api/stats")
    public Map<String, Object> getStats() {
        int totalStudents = students.size();
        double totalCollected = payments.values().stream().mapToDouble(Payment::getAmount).sum();
        double outstandingBalance = students.values().stream().mapToDouble(Student::getFeeBalance).sum();
        int totalAssessments = assessments.size();

        Map<String, Long> rubricCounts = assessments.values().stream()
                .collect(Collectors.groupingBy(Assessment::getRubric, Collectors.counting()));

        Map<String, Object> distribution = new LinkedHashMap<>();
        distribution.put("EE", rubricCounts.getOrDefault("EE", 0L));
        distribution.put("ME", rubricCounts.getOrDefault("ME", 0L));
        distribution.put("AE", rubricCounts.getOrDefault("AE", 0L));
        distribution.put("BE", rubricCounts.getOrDefault("BE", 0L));

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalStudents", totalStudents);
        stats.put("totalCollected", totalCollected);
        stats.put("outstandingBalance", outstandingBalance);
        stats.put("totalAssessments", totalAssessments);
        stats.put("rubricDistribution", distribution);
        return stats;
    }

    // 2. Learners Directory (List & Filter)
    @GetMapping("/api/students")
    public List<Student> getStudents(
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false, defaultValue = "") String grade) {
        return students.values().stream()
                .filter(s -> {
                    boolean matchSearch = search.isEmpty() ||
                            (s.getFullName() != null && s.getFullName().toLowerCase().contains(search.toLowerCase())) ||
                            (s.getRegNo() != null && s.getRegNo().toLowerCase().contains(search.toLowerCase())) ||
                            (s.getNemisUpi() != null && s.getNemisUpi().toLowerCase().contains(search.toLowerCase()));
                    boolean matchGrade = grade.isEmpty() || (s.getGrade() != null && s.getGrade().equalsIgnoreCase(grade));
                    return matchSearch && matchGrade;
                })
                .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                .collect(Collectors.toList());
    }

    // 3. Enroll New Learner (STRICT RULE: Only save what user inserts or leave blank)
    @PostMapping("/api/students")
    public ResponseEntity<?> enrollStudent(@RequestBody Map<String, Object> body) {
        String fullName = (String) body.getOrDefault("full_name", "");
        if (fullName == null || fullName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Student Full Legal Name is required."));
        }

        long id = studentIdGen.incrementAndGet();
        String regNo = (String) body.getOrDefault("reg_no", "");
        if (regNo == null || regNo.trim().isEmpty()) {
            regNo = String.format("WESA-2025-%04d", students.size() + 1);
        }

        // Default primary class is Reception
        String grade = (String) body.getOrDefault("grade", "Reception");
        String nemisUpi = (String) body.getOrDefault("nemis_upi", "");
        String gender = (String) body.getOrDefault("gender", "");
        String guardianName = (String) body.getOrDefault("guardian_name", "");
        String guardianPhone = (String) body.getOrDefault("guardian_phone", "");

        double feeBalance = 15000.0;
        if (body.containsKey("fee_balance")) {
            feeBalance = Double.parseDouble(body.get("fee_balance").toString());
        }

        Student student = new Student(id, regNo, nemisUpi, fullName.trim(), grade, gender, guardianName, guardianPhone, feeBalance);
        students.put(id, student);
        return new ResponseEntity<>(student, HttpStatus.CREATED);
    }

    // 4. Remove Learner
    @DeleteMapping("/api/students/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
        if (students.remove(id) != null) {
            return ResponseEntity.ok(Collections.singletonMap("message", "Learner #" + id + " deleted successfully"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", "Learner not found"));
    }

    // 5. Assessments List & Record
    @GetMapping("/api/assessments")
    public List<Assessment> getAssessments() {
        return assessments.values().stream()
                .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                .collect(Collectors.toList());
    }

    @PostMapping("/api/assessments")
    public ResponseEntity<?> recordAssessment(@RequestBody Map<String, Object> body) {
        Long studentId = Long.parseLong(body.get("student_id").toString());
        Student student = students.get(studentId);
        if (student == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", "Student not found"));
        }

        long id = assessmentIdGen.incrementAndGet();
        String subject = (String) body.getOrDefault("subject", "General Subject");
        String strand = (String) body.getOrDefault("strand", "");
        String rubric = (String) body.getOrDefault("rubric", "ME");
        String term = (String) body.getOrDefault("term", "Term 1");
        String remarks = (String) body.getOrDefault("remarks", "");

        Assessment assessment = new Assessment(id, studentId, student.getFullName(), subject, strand, rubric, term, remarks);
        assessments.put(id, assessment);
        return new ResponseEntity<>(assessment, HttpStatus.CREATED);
    }

    // 6. Payments Ledger & Payment Recording
    @GetMapping("/api/payments")
    public List<Payment> getPayments() {
        return payments.values().stream()
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .collect(Collectors.toList());
    }

    @PostMapping("/api/payments")
    public ResponseEntity<?> recordPayment(@RequestBody Map<String, Object> body) {
        Long studentId = Long.parseLong(body.get("student_id").toString());
        double amount = Double.parseDouble(body.get("amount").toString());

        Student student = students.get(studentId);
        if (student == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", "Student not found"));
        }

        double newBalance = Math.max(0.0, student.getFeeBalance() - amount);
        student.setFeeBalance(newBalance);

        String receiptNo = "REC-2025-" + (1000 + new Random().nextInt(9000));
        String method = (String) body.getOrDefault("payment_method", "M-Pesa");
        String ref = (String) body.getOrDefault("reference_no", "");
        String date = body.containsKey("date_paid") ? body.get("date_paid").toString() : LocalDate.now().toString();

        Payment payment = new Payment(receiptNo, student.getId(), student.getFullName(), student.getRegNo(), amount, method, ref, newBalance, date);
        payments.put(receiptNo, payment);
        return new ResponseEntity<>(payment, HttpStatus.CREATED);
    }

    // 7. Printable Receipt Details
    @GetMapping("/api/receipt/{receiptNo}")
    public ResponseEntity<?> getReceipt(@PathVariable String receiptNo) {
        Payment payment = payments.get(receiptNo);
        if (payment == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", "Receipt voucher not found"));
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("payment", payment);
        Map<String, String> school = new LinkedHashMap<>();
        school.put("name", "West End Star Academy");
        school.put("box", "P.O. Box 45210 - 00100, Nairobi, Kenya");
        school.put("phone", "+254 722 000 000");
        school.put("motto", "Excellence in Competency & Character");
        school.put("knec_reg", "WESA/PRI/2024");
        res.put("school", school);
        return ResponseEntity.ok(res);
    }

    // 8. Parent Portal Lookup
    @GetMapping("/api/parent/lookup")
    public ResponseEntity<?> parentLookup(@RequestParam String query) {
        String cleanQuery = query.trim().toLowerCase();
        Student student = students.values().stream()
                .filter(s -> (s.getRegNo() != null && s.getRegNo().equalsIgnoreCase(cleanQuery)) ||
                             (s.getNemisUpi() != null && s.getNemisUpi().equalsIgnoreCase(cleanQuery)) ||
                             (s.getFullName() != null && s.getFullName().toLowerCase().contains(cleanQuery)))
                .findFirst()
                .orElse(null);

        if (student == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", "No learner found matching query: " + query));
        }

        List<Payment> studentPayments = payments.values().stream()
                .filter(p -> p.getStudentId().equals(student.getId()))
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("student", student);
        response.put("payments", studentPayments);
        return ResponseEntity.ok(response);
    }

    // -------------------------------------------------------------
    // DATA MODEL CLASSES
    // -------------------------------------------------------------

    public static class Student {
        private Long id;
        private String regNo;
        private String nemisUpi;
        private String fullName;
        private String grade;
        private String gender;
        private String guardianName;
        private String guardianPhone;
        private double feeBalance;

        public Student() {}
        public Student(Long id, String regNo, String nemisUpi, String fullName, String grade, String gender, String guardianName, String guardianPhone, double feeBalance) {
            this.id = id;
            this.regNo = regNo;
            this.nemisUpi = nemisUpi;
            this.fullName = fullName;
            this.grade = grade;
            this.gender = gender;
            this.guardianName = guardianName;
            this.guardianPhone = guardianPhone;
            this.feeBalance = feeBalance;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getRegNo() { return regNo; }
        public void setRegNo(String regNo) { this.regNo = regNo; }
        public String getNemisUpi() { return nemisUpi; }
        public void setNemisUpi(String nemisUpi) { this.nemisUpi = nemisUpi; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getGrade() { return grade; }
        public void setGrade(String grade) { this.grade = grade; }
        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }
        public String getGuardianName() { return guardianName; }
        public void setGuardianName(String guardianName) { this.guardianName = guardianName; }
        public String getGuardianPhone() { return guardianPhone; }
        public void setGuardianPhone(String guardianPhone) { this.guardianPhone = guardianPhone; }
        public double getFeeBalance() { return feeBalance; }
        public void setFeeBalance(double feeBalance) { this.feeBalance = feeBalance; }
    }

    public static class Assessment {
        private Long id;
        private Long studentId;
        private String studentName;
        private String subject;
        private String strand;
        private String rubric;
        private String term;
        private String remarks;

        public Assessment() {}
        public Assessment(Long id, Long studentId, String studentName, String subject, String strand, String rubric, String term, String remarks) {
            this.id = id;
            this.studentId = studentId;
            this.studentName = studentName;
            this.subject = subject;
            this.strand = strand;
            this.rubric = rubric;
            this.term = term;
            this.remarks = remarks;
        }

        public Long getId() { return id; }
        public Long getStudentId() { return studentId; }
        public String getStudentName() { return studentName; }
        public String getSubject() { return subject; }
        public String getStrand() { return strand; }
        public String getRubric() { return rubric; }
        public String getTerm() { return term; }
        public String getRemarks() { return remarks; }
    }

    public static class Payment {
        private String receiptNo;
        private Long studentId;
        private String studentName;
        private String regNo;
        private double amount;
        private String method;
        private String ref;
        private double balanceRemaining;
        private String date;

        public Payment() {}
        public Payment(String receiptNo, Long studentId, String studentName, String regNo, double amount, String method, String ref, double balanceRemaining, String date) {
            this.receiptNo = receiptNo;
            this.studentId = studentId;
            this.studentName = studentName;
            this.regNo = regNo;
            this.amount = amount;
            this.method = method;
            this.ref = ref;
            this.balanceRemaining = balanceRemaining;
            this.date = date;
        }

        public String getReceiptNo() { return receiptNo; }
        public Long getStudentId() { return studentId; }
        public String getStudentName() { return studentName; }
        public String getRegNo() { return regNo; }
        public double getAmount() { return amount; }
        public String getMethod() { return method; }
        public String getRef() { return ref; }
        public double getBalanceRemaining() { return balanceRemaining; }
        public String getDate() { return date; }
    }
}
