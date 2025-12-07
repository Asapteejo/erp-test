// C:\Users\HP\Desktop\azmah-frontend\src\pages\LecturerDashboard.jsx
import { useState, useEffect } from "react";
import { useClerkAuth } from '../hooks/useClerkAuth';
import axios from "axios";

function LecturerDashboard() {
  const { user, getToken, logout } = useClerkAuth();
  const [token, setToken] = useState(null);
  
 // === SAFE TOKEN FETCH — WORKS IN DEV + PROD ===
useEffect(() => {
  if (!user) {
    setToken(null);
    return;
  }

  // In dev: use fake token immediately
  if (import.meta.env.DEV) {
    setToken('dev-jwt-12345');
    return;
  }

  // In prod: get real token
  let cancelled = false;
  getToken().then(t => {
    if (!cancelled) setToken(t);
  }).catch(() => {
    if (!cancelled) setToken(null);
  });

  return () => { cancelled = true; };
}, [user, getToken]);

  const [tab, setTab] = useState("materials");
  const [materialForm, setMaterialForm] = useState({ title: "", courseId: "", fileUrl: "" });
  const [assignmentForm, setAssignmentForm] = useState({ title: "", courseId: "", deadline: "", description: "" });
  const [gradeForm, setGradeForm] = useState({ studentId: "", courseId: "", score: "", grade: "" });
  const [feedbackForm, setFeedbackForm] = useState({ studentId: "", assignmentId: "", content: "" });
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [gradeMap, setGradeMap] = useState({});
  const [feedbackMap, setFeedbackMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataCache, setDataCache] = useState({});

  const API_BASE_URL = "http://localhost:3000/api";

  // Helper to always get fresh token in headers
  const getAuthConfig = () => ({
  headers: { 
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  }
});

  const sanitizeInput = (value) => {
    if (typeof value !== "string") return value;
    return value.replace(/[<>]/g, "");
  };

  // Fetch data when tab or token changes
 useEffect(() => {
    if (!token || !user) return;

    const needsData = ["submissions", "grades", "feedback"].includes(tab);
    if (!needsData) {
      setIsLoading(false);
      return;
    }

    // Check cache first (30-second freshness)
    if (dataCache[tab] && Date.now() - dataCache[tab].timestamp < 30_000) {
      const { submissions, students, courses } = dataCache[tab];
      setSubmissions(submissions);
      setStudents(students);
      setCourses(courses);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const config = { ...getAuthConfig(), signal: controller.signal };

    setIsLoading(true);
    setError(null);

    Promise.all([
      axios.get(`${API_BASE_URL}/lecturer/submissions`, config),
      axios.get(`${API_BASE_URL}/lecturer/students`, config),
      axios.get(`${API_BASE_URL}/lecturer/courses`, config),
    ])
      .then(([subRes, stuRes, courseRes]) => {
        if (!controller.signal.aborted) {
          const data = {
            submissions: subRes.data,
            students: stuRes.data,
            courses: courseRes.data,
          };
          setSubmissions(subRes.data);
          setStudents(stuRes.data);
          setCourses(courseRes.data);

          // Cache it!
          setDataCache(prev => ({
            ...prev,
            [tab]: { ...data, timestamp: Date.now() }
          }));
        }
      })
      .catch((err) => {
        if (!axios.isCancel(err)) {
          console.error("Fetch error:", err.response?.data || err.message);
          setError("Failed to load data.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [tab, token, user]);

  const handleMaterialSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sanitizedForm = {
        title: sanitizeInput(materialForm.title),
        courseId: materialForm.courseId,
        fileUrl: sanitizeInput(materialForm.fileUrl),
      };
      await axios.post(`${API_BASE_URL}/lecturer/materials`, sanitizedForm, getAuthConfig());
      alert("Material uploaded!");
      setMaterialForm({ title: "", courseId: "", fileUrl: "" });
    } catch (error) {
      console.error("Error uploading material:", error);
      setError("Failed to upload material. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignmentSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sanitizedForm = {
        title: sanitizeInput(assignmentForm.title),
        courseId: assignmentForm.courseId,
        deadline: assignmentForm.deadline,
        description: sanitizeInput(assignmentForm.description),
      };
      await axios.post(`${API_BASE_URL}/lecturer/assignments`, sanitizedForm, getAuthConfig());
      alert("Assignment uploaded!");
      setAssignmentForm({ title: "", courseId: "", deadline: "", description: "" });
    } catch (error) {
      console.error("Error uploading assignment:", error);
      setError("Failed to upload assignment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sanitizedForm = {
        studentId: gradeForm.studentId,
        courseId: gradeForm.courseId,
        score: parseFloat(gradeForm.score),
        grade: sanitizeInput(gradeForm.grade),
      };
      await axios.post(`${API_BASE_URL}/lecturer/grade`, sanitizedForm, getAuthConfig());
      alert("Grade submitted!");
      setGradeForm({ studentId: "", courseId: "", score: "", grade: "" });
    } catch (error) {
      console.error("Error submitting grade:", error);
      setError("Failed to submit grade. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sanitizedForm = {
        studentId: feedbackForm.studentId,
        assignmentId: sanitizeInput(feedbackForm.assignmentId),
        content: sanitizeInput(feedbackForm.content),
      };
      await axios.post(`${API_BASE_URL}/lecturer/feedback`, sanitizedForm, getAuthConfig());
      alert("Feedback submitted!");
      setFeedbackForm({ studentId: "", assignmentId: "", content: "" });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const gradeSubmission = async (submissionId, grade, feedback) => {
    try {
      setIsLoading(true);
      setError(null);
      await axios.post(
        `${API_BASE_URL}/lecturer/submissions/grade`,
        {
          submissionId,
          grade: sanitizeInput(grade),
          feedback: sanitizeInput(feedback),
        },
        getAuthConfig()
      );
      alert("Graded!");
      const res = await axios.get(`${API_BASE_URL}/lecturer/submissions`, getAuthConfig());
      setSubmissions(res.data);
    } catch (error) {
      console.error("Error grading submission:", error);
      setError("Failed to submit grade. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name || "Lecturer"}</h1>
        <button
          onClick={async () => { await logout(); window.location.href = "/"; }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTab("materials")} className={`px-4 py-2 rounded font-medium transition-colors ${tab === "materials" ? "bg-blue-600 text-white" : "bg-blue-500 text-white hover:bg-blue-600"}`}>Upload Materials</button>
        <button onClick={() => setTab("assignments")} className={`px-4 py-2 rounded font-medium transition-colors ${tab === "assignments" ? "bg-blue-600 text-white" : "bg-blue-500 text-white hover:bg-blue-600"}`}>Upload Homework</button>
        <button onClick={() => setTab("grades")} className={`px-4 py-2 rounded font-medium transition-colors ${tab === "grades" ? "bg-blue-600 text-white" : "bg-blue-500 text-white hover:bg-blue-600"}`}>Submit Grades</button>
        <button onClick={() => setTab("submissions")} className={`px-4 py-2 rounded font-medium transition-colors ${tab === "submissions" ? "bg-blue-600 text-white" : "bg-blue-500 text-white hover:bg-blue-600"}`}>Grade Submissions</button>
        <button onClick={() => setTab("feedback")} className={`px-4 py-2 rounded font-medium transition-colors ${tab === "feedback" ? "bg-blue-600 text-white" : "bg-blue-500 text-white hover:bg-blue-600"}`}>Assignment Feedback</button>
      </div>

      {error && <div className="mt-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded">{error}</div>}
      {isLoading && <p className="text-gray-600">Loading...</p>}

      {/* === Upload Materials === */}
      {tab === "materials" && !isLoading && (
        <div className="mt-4 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Upload Materials</h2>
          <div className="space-y-2">
            <input placeholder="Title" className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={materialForm.title || ""} onChange={(e) => setMaterialForm({ ...materialForm, title: sanitizeInput(e.target.value) })} />
            <select className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={materialForm.courseId || ""} onChange={(e) => setMaterialForm({ ...materialForm, courseId: e.target.value })}>
              <option value="">Select Course</option>
              {courses.map((c) => (<option key={c.id} value={c.id}>{c.code} - {c.title}</option>))}
            </select>
            <input placeholder="File URL (e.g., Google Drive, PDF)" className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={materialForm.fileUrl || ""} onChange={(e) => setMaterialForm({ ...materialForm, fileUrl: sanitizeInput(e.target.value) })} />
            <button onClick={handleMaterialSubmit} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300" disabled={isLoading}>Submit</button>
          </div>
        </div>
      )}

      {/* === Upload Homework === */}
      {tab === "assignments" && !isLoading && (
        <div className="mt-4 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Upload Homework</h2>
          <div className="space-y-2">
            <input placeholder="Title" className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={assignmentForm.title || ""} onChange={(e) => setAssignmentForm({ ...assignmentForm, title: sanitizeInput(e.target.value) })} />
            <select className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={assignmentForm.courseId || ""} onChange={(e) => setAssignmentForm({ ...assignmentForm, courseId: e.target.value })}>
              <option value="">Select Course</option>
              {courses.map((c) => (<option key={c.id} value={c.id}>{c.code} - {c.title}</option>))}
            </select>
            <input placeholder="Deadline (yyyy-mm-dd)" type="date" className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={assignmentForm.deadline || ""} onChange={(e) => setAssignmentForm({ ...assignmentForm, deadline: e.target.value })} />
            <textarea placeholder="Description" className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={assignmentForm.description || ""} onChange={(e) => setAssignmentForm({ ...assignmentForm, description: sanitizeInput(e.target.value) })} />
            <button onClick={handleAssignmentSubmit} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300" disabled={isLoading}>Submit</button>
          </div>
        </div>
      )}

      {/* === Submit Grades === */}
      {tab === "grades" && !isLoading && (
        <div className="mt-4 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Submit Grades</h2>
          <div className="space-y-2">
            <select className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={gradeForm.studentId || ""} onChange={(e) => setGradeForm({ ...gradeForm, studentId: e.target.value })}>
              <option value="">Select Student</option>
              {students.map((s) => (<option key={s.id} value={s.id}>{s.name} ({s.email})</option>))}
            </select>
            <select className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={gradeForm.courseId || ""} onChange={(e) => setGradeForm({ ...gradeForm, courseId: e.target.value })}>
              <option value="">Select Course</option>
              {courses.map((c) => (<option key={c.id} value={c.id}>{c.code} - {c.title}</option>))}
            </select>
            <input placeholder="Score (e.g., 85)" type="number" className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={gradeForm.score || ""} onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })} />
            <select className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={gradeForm.grade || ""} onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}>
              <option value="">Select Grade</option>
              <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="F">F</option>
            </select>
            <button onClick={handleGradeSubmit} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300" disabled={isLoading}>Submit Grade</button>
          </div>
        </div>
      )}

      {/* === Grade Submissions === */}
      {tab === "submissions" && !isLoading && (
        <div className="mt-4 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Student Submissions</h2>
          {submissions.length === 0 ? (
            <p className="text-gray-600">No submissions yet.</p>
          ) : (
            submissions.map((s) => (
              <div key={s.id} className="border p-4 mb-4 rounded">
                <p><strong>Student:</strong> {s.student?.name || 'Unknown'}</p>
                <p><strong>Course:</strong> {s.assignment?.course?.code || 'Unknown'}</p>
                <p><strong>Assignment:</strong> {s.assignment?.title || 'Unknown'}</p>
                <p><strong>Submitted File:</strong> <a href={s.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a></p>
                <input placeholder="Grade (A-F)" className="mt-2 p-2 border w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={gradeMap[s.id] || ""} onChange={(e) => setGradeMap({ ...gradeMap, [s.id]: sanitizeInput(e.target.value) })} />
                <textarea placeholder="Feedback" className="mt-2 p-2 border w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={feedbackMap[s.id] || ""} onChange={(e) => setFeedbackMap({ ...feedbackMap, [s.id]: sanitizeInput(e.target.value) })} />
                <button className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:bg-gray-300" onClick={() => gradeSubmission(s.id, gradeMap[s.id], feedbackMap[s.id])} disabled={isLoading || !gradeMap[s.id]}>
                  Submit Grade
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* === Assignment Feedback === */}
      {tab === "feedback" && !isLoading && (
        <div className="mt-4 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Assignment Feedback</h2>
          <div className="space-y-2">
            <select className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={feedbackForm.studentId || ""} onChange={(e) => setFeedbackForm({ ...feedbackForm, studentId: e.target.value })}>
              <option value="">Select Student</option>
              {students.map((s) => (<option key={s.id} value={s.id}>{s.name} ({s.email})</option>))}
            </select>
            <input placeholder="Assignment ID (e.g., ASSIGN123)" className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={feedbackForm.assignmentId || ""} onChange={(e) => setFeedbackForm({ ...feedbackForm, assignmentId: sanitizeInput(e.target.value) })} />
            <textarea placeholder="Feedback Content" className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={feedbackForm.content || ""} onChange={(e) => setFeedbackForm({ ...feedbackForm, content: sanitizeInput(e.target.value) })} />
            <button onClick={handleFeedbackSubmit} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300" disabled={isLoading}>Submit Feedback</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LecturerDashboard;