// src/pages/ProblemDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../services/api';

const ProblemDetailPage = () => {
  const { problemId } = useParams();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('#include <iostream>\n\nint main() {\n    // Your code here\n    return 0;\n}');
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isGrading, setIsGrading] = useState(false);

  useEffect(() => {
    api.getProblemDetails(problemId).then(res => setProblem(res.data));
  }, [problemId]);

  const pollForResult = (submissionId) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.getSubmissionResult(submissionId);
        if (res.data.status !== 'Pending' && res.data.status !== 'Grading') {
          clearInterval(interval);
          setSubmissionResult(res.data);
          setIsGrading(false);
        } else {
            setSubmissionResult(res.data); // Update status while grading
        }
      } catch (error) {
        console.error("Polling error:", error);
        clearInterval(interval);
        setIsGrading(false);
      }
    }, 2000); // Poll every 2 seconds
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGrading(true);
    setSubmissionResult(null);
    try {
      const res = await api.submitCode({
        problem_id: parseInt(problemId),
        source_code: code
      });
      setSubmissionResult(res.data);
      pollForResult(res.data.submission_id);
    } catch (error) {
      console.error("Submission failed:", error);
      setIsGrading(false);
    }
  };

  if (!problem) return <div>Loading problem...</div>;

  return (
    <div>
      <h2>{problem.title}</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{problem.description}</p>
      <hr />
      <form onSubmit={handleSubmit}>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows="20"
          style={{ width: '100%', fontFamily: 'monospace' }}
        />
        <button type="submit" disabled={isGrading}>
          {isGrading ? 'Grading...' : 'Submit Code'}
        </button>
      </form>
      {submissionResult && (
        <div className="result-box">
          <h3>Submission Result</h3>
          <p><strong>Overall Status: {submissionResult.status}</strong></p>
          {submissionResult.results?.map(res => (
             <div key={res.test_case_id}>
                Test Case #{res.test_case_id}: <span className={`status-${res.status.toLowerCase()}`}>{res.status}</span>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProblemDetailPage;