import React from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🌾 FarmSync</h1>
        <p>TBS Supply Chain Monitoring</p>
        
        <div className="role-buttons">
          <button 
            className="role-button btn-mill"
            onClick={() => navigate('/mill1')}
          >
            🏭 Login as Mill 1
          </button>
          
          <button 
            className="role-button btn-mill"
            onClick={() => navigate('/mill2')}
            style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}
          >
            🏭 Login as Mill 2
          </button>
          
          <button 
            className="role-button btn-estate"
            onClick={() => navigate('/estate')}
          >
            🌴 Login as Estate
          </button>
          
          <button 
            className="role-button btn-admin"
            onClick={() => navigate('/admin')}
          >
            👨‍💼 Login as Admin
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
