import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const ClassDetailPage = () => {
  const { classId } = useParams();
  const { user, isTeacher } = useAuth();
  const [problems, setProblems] = useState([]);
  
  // Form states for creating problem
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [testCases, setTestCases] = useState([{ input: '', output: '' }]);

  const fetchProblems = async () => {
    try {
      const res = await api.getProblemsInClass(classId);
      setProblems(res.data);
    } catch (err) {
      console.error("Failed to fetch problems", err);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [classId]);

  // Handlers for dynamic test case form
  const handleTcChange = (index, field, value) => {
    const newTc = [...testCases];
    newTc[index][field] = value;
    setTestCases(newTc);
  };
  const addTc = () => setTestCases([...testCases, { input: '', output: '' }]);
  const removeTc = (index) => setTestCases(testCases.filter((_, i) => i !== index));

  const handleCreateProblem = async (e) => {
    e.preventDefault();
    // Filter out empty test cases
    const validTestCases = testCases.filter(tc => tc.input.trim() !== '' || tc.output.trim() !== '');
    try {
      await api.createProblem(classId, {
        title, description: desc, test_cases: validTestCases
      });
      alert('Problem created successfully!');
      // Reset form
      setTitle(''); setDesc(''); setTestCases([{ input: '', output: '' }]);
      fetchProblems();
    } catch (err) {
      alert('Failed to create problem: ' + (err.response?.data?.msg || err.message));
    }
  };

  return (
    <div>
      <Link to="/">← Back to Dashboard</Link>
      <h1>Class Details</h1>

      {/* --- Danh sách bài tập --- */}
      <h2>Problems</h2>
      {problems.length === 0 ? <p>No problems in this class yet.</p> : (
        <ul>
          {problems.map(p => (
            <li key={p.id}>
              <Link to={`/problem/${p.id}`}>{p.title}</Link>
            </li>
          ))}
        </ul>
      )}

      {/* --- Form tạo bài tập (Chỉ cho Teacher) --- */}
      {isTeacher && (
        <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
          <h3>Create New Problem</h3>
          <form onSubmit={handleCreateProblem}>
            <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
            <textarea placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} rows="3" />
            
            <h4>Test Cases</h4>
            {testCases.map((tc, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                <textarea placeholder="Input" value={tc.input} onChange={e => handleTcChange(index, 'input', e.target.value)} style={{flex: 1}} rows="2"/>
                <textarea placeholder="Output" value={tc.output} onChange={e => handleTcChange(index, 'output', e.target.value)} style={{flex: 1}} rows="2"/>
                {testCases.length > 1 && <button type="button" onClick={() => removeTc(index)} style={{width: 'auto'}}>X</button>}
              </div>
            ))}
            <button type="button" onClick={addTc} style={{background: '#eee', color: '#333', marginBottom: '1rem'}}>+ Add Test Case</button>
            
            <button type="submit">Create Problem</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ClassDetailPage;