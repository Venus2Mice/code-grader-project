import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const DashboardPage = () => {
  const { user, isTeacher, isStudent } = useAuth(); // <-- lấy thêm isTeacher, isStudent
  const [classes, setClasses] = useState([]);
  
  // Form states
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [inviteCodeToJoin, setInviteCodeToJoin] = useState('');
  const [createdInviteCode, setCreatedInviteCode] = useState('');

  const fetchClasses = async () => {
    try {
      const res = await api.getMyClasses();
      setClasses(res.data);
    } catch (err) {
      console.error("Failed to fetch classes", err);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createClass({ name: newClassName, course_code: newClassCode });
      setCreatedInviteCode(res.data.invite_code);
      setNewClassName(''); setNewClassCode('');
      fetchClasses(); // Refresh list
    } catch (err) {
      alert('Failed to create class: ' + (err.response?.data?.msg || err.message));
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    try {
      await api.joinClass(inviteCodeToJoin);
      alert('Successfully joined class!');
      setInviteCodeToJoin('');
      fetchClasses(); // Refresh list
    } catch (err) {
      alert('Failed to join class: ' + (err.response?.data?.msg || err.message));
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* --- Phần dành cho TEACHER --- */}
      {isTeacher && (
        <div style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '2rem' }}>
          <h3>Create New Class</h3>
          <form onSubmit={handleCreateClass}>
            <input placeholder="Class Name" value={newClassName} onChange={e => setNewClassName(e.target.value)} required />
            <input placeholder="Course Code (Optional)" value={newClassCode} onChange={e => setNewClassCode(e.target.value)} />
            <button type="submit">Create Class</button>
          </form>
          {createdInviteCode && (
            <p style={{ background: '#eef', padding: '0.5rem' }}>
              Class created! Invite Code: <strong>{createdInviteCode}</strong> (Share this with your students)
            </p>
          )}
        </div>
      )}

      {/* --- Phần dành cho STUDENT --- */}
      {isStudent && (
        <div style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '2rem' }}>
          <h3>Join a Class</h3>
          <form onSubmit={handleJoinClass}>
            <input placeholder="Enter Invite Code" value={inviteCodeToJoin} onChange={e => setInviteCodeToJoin(e.target.value)} required />
            <button type="submit">Join Class</button>
          </form>
        </div>
      )}

      {/* --- Danh sách lớp học chung --- */}
      <h2>Your Classes</h2>
      {classes.length === 0 ? <p>No classes yet.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {classes.map(c => (
            <li key={c.id} style={{ border: '1px solid #eee', padding: '1rem', marginBottom: '0.5rem' }}>
              <Link to={`/class/${c.id}`} style={{textDecoration: 'none', color: '#333', display: 'block'}}>
                <strong>{c.name}</strong> {c.course_code && `(${c.course_code})`} - Teacher: {c.teacher_name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DashboardPage;