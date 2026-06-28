import { useState } from 'react';
import API from '../services/api';

function AIMockInterview() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState({}); // { [questionId]: answerText }
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');

  const handleStartInterview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/ai/mock-interview');
      if (Array.isArray(res.data)) {
        setQuestions(res.data);
        setStarted(true);
        setCurrentIndex(0);
        setAnswers({});
        setCurrentAnswer('');
        setCompleted(false);
      } else {
        throw new Error('Received invalid data format from server. Questions must be an array.');
      }
    } catch (err) {
      console.error('Error fetching mock interview questions', err);
      setError(err.message || 'Failed to generate interview questions. Make sure you have configured your profile target job and uploaded a resume.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!currentAnswer.trim()) return;

    const currentQuestion = questions[currentIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: currentAnswer
    }));

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      // Load previous answer if they are backing/updating, else empty
      setCurrentAnswer(answers[questions[currentIndex + 1]?.id] || '');
    } else {
      setCompleted(true);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      // Save current answer before going back
      const currentQuestion = questions[currentIndex];
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: currentAnswer
      }));
      
      setCurrentIndex(prev => prev - 1);
      setCurrentAnswer(answers[questions[currentIndex - 1].id] || '');
    }
  };

  const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="container py-4 text-start animate-fade-in d-flex justify-content-center">
      <div className="w-100" style={{ maxWidth: '800px' }}>
        
        {/* ==================== 1. LANDING/START VIEW ==================== */}
        {!started && (
          <div className="glass-card glow-effect text-center p-5">
            <span className="badge rounded-pill mb-3 px-3 py-2" 
                  style={{ background: 'rgba(154, 85, 241, 0.15)', color: 'var(--primary)', border: '1px solid var(--border-glow)' }}>
              🎯 Interactive AI Mock Interview
            </span>
            <h2 className="display-6 fw-bold mb-3">Prepare with SkillSathi AI</h2>
            <p className="text-secondary mx-auto mb-4" style={{ maxWidth: '600px', fontSize: '1.05rem' }}>
              Practice technical and behavioral interview questions generated dynamically from your profile target job title and your uploaded resume details.
            </p>

            {error && (
              <div className="alert alert-danger border-0 text-white py-2 px-3 mb-4 mx-auto" 
                   style={{ background: 'rgba(239, 68, 68, 0.2)', borderRadius: '8px', maxWidth: '500px', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <div className="p-4 rounded-3 mb-4 text-start" style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-light)' }}>
              <h4 className="h5 text-white mb-3">📌 Rules of the Mock Interview:</h4>
              <ul className="text-secondary ps-3 mb-0" style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
                <li className="mb-2">You will be asked exactly <strong>5 tailored questions</strong>.</li>
                <li className="mb-2"><strong>3 Technical questions</strong> customized to your technology stack.</li>
                <li className="mb-2"><strong>2 Behavioral questions</strong> to assess collaboration, problem-solving, and culture fit.</li>
                <li>Write clear, detailed responses to simulate a real-world chat interview.</li>
              </ul>
            </div>

            <button 
              onClick={handleStartInterview} 
              className="btn-premium px-5 py-3" 
              style={{ fontSize: '1.1rem' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Generating Interview...
                </>
              ) : (
                'Start AI Mock Interview'
              )}
            </button>
          </div>
        )}

        {/* ==================== 2. ACTIVE INTERVIEW VIEW ==================== */}
        {started && !completed && questions.length > 0 && (
          <div className="glass-card glow-effect p-4 p-md-5">
            
            {/* Progress Bar & Header */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <span className="text-secondary" style={{ fontSize: '0.9rem' }}>Question {currentIndex + 1} of {questions.length}</span>
                <span className="badge ms-2" style={{
                  background: questions[currentIndex].category === 'Technical' ? 'rgba(17, 212, 180, 0.15)' : 'rgba(154, 85, 241, 0.15)',
                  color: questions[currentIndex].category === 'Technical' ? 'var(--secondary)' : 'var(--primary)',
                  border: questions[currentIndex].category === 'Technical' ? '1px solid rgba(17, 212, 180, 0.3)' : '1px solid var(--border-glow)'
                }}>
                  {questions[currentIndex].category}
                </span>
              </div>
              
              <button 
                onClick={() => { if(window.confirm('Abort interview? Progress will be lost.')) setStarted(false); }}
                className="btn btn-sm btn-outline-danger border-0 py-1"
                style={{ fontSize: '0.85rem' }}
              >
                Abort
              </button>
            </div>

            <div className="progress mb-4" style={{ height: '5px', background: 'rgba(255,255,255,0.05)' }}>
              <div className="progress-bar" style={{ width: `${progressPercent}%`, background: 'var(--primary)', transition: '0.3s' }}></div>
            </div>

            {/* Question Display Card */}
            <div className="p-4 rounded-3 mb-4" 
                 style={{ 
                   background: 'rgba(154, 85, 241, 0.02)', 
                   border: '1px solid var(--border-glow)',
                   boxShadow: 'inset 0 0 20px rgba(154, 85, 241, 0.05)'
                 }}>
              <h3 className="h4 text-white mb-0" style={{ lineHeight: '1.5' }}>
                {questions[currentIndex].question}
              </h3>
            </div>

            {/* Input area */}
            <div className="mb-4">
              <label className="glass-label" htmlFor="answerInput">Your Answer</label>
              <textarea
                id="answerInput"
                className="glass-input"
                rows="6"
                placeholder="Type your detailed answer here. Try to explain your technical logic or use the STAR method (Situation, Task, Action, Result) for behavioral questions..."
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Navigation buttons */}
            <div className="d-flex justify-content-between align-items-center">
              <button 
                onClick={handleBack} 
                className="btn-premium-secondary px-4 py-2"
                disabled={currentIndex === 0}
              >
                &larr; Back
              </button>
              
              <button 
                onClick={handleNext} 
                className="btn-premium px-4 py-2"
                disabled={!currentAnswer.trim()}
              >
                {currentIndex === questions.length - 1 ? 'Finish Interview' : 'Next Question &rarr;'}
              </button>
            </div>

          </div>
        )}

        {/* ==================== 3. COMPLETED SUMMARY VIEW ==================== */}
        {started && completed && (
          <div className="glass-card glow-effect p-4 p-md-5 animate-fade-in">
            <div className="text-center mb-4">
              <span style={{ fontSize: '3rem' }}>🏆</span>
              <h2 className="text-gradient-primary fw-bold mt-2" style={{ fontSize: '2.2rem' }}>Interview Completed!</h2>
              <p className="text-secondary">Excellent job. You have successfully answered all AI mock questions.</p>
            </div>

            <div className="d-flex flex-column gap-4 mb-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong className="text-white" style={{ fontSize: '0.95rem' }}>Q{idx + 1}. {q.category} Question</strong>
                    <span className="badge" style={{
                      background: q.category === 'Technical' ? 'rgba(17, 212, 180, 0.1)' : 'rgba(154, 85, 241, 0.1)',
                      color: q.category === 'Technical' ? 'var(--secondary)' : 'var(--primary)'
                    }}>
                      {q.category}
                    </span>
                  </div>
                  <p className="text-white mb-3" style={{ fontSize: '1rem', fontWeight: '500' }}>{q.question}</p>
                  
                  <div className="p-3 rounded-3" style={{ background: 'rgba(0, 0, 0, 0.2)', borderLeft: '3px solid var(--primary)' }}>
                    <span className="text-muted d-block mb-1" style={{ fontSize: '0.75rem' }}>Your Answer:</span>
                    <p className="text-secondary m-0" style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                      {answers[q.id]}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-center gap-3">
              <button onClick={handleStartInterview} className="btn-premium px-4 py-2">
                Restart Mock Interview
              </button>
              <button onClick={() => setStarted(false)} className="btn-premium-secondary px-4 py-2">
                Go Back to Start
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AIMockInterview;
