import React from 'react';

const OfflinePage = () => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* أيقونة تعبيرية */}
        <div style={styles.iconContainer}>
          <svg style={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15.366V13a2 2 0 012-2h14a2 2 0 012 2v2.366M5 11V7a2 2 0 012-2h10a2 2 0 012 2v4M12 16h.01M5 21h14M3 3l18 18" />
          </svg>
        </div>
        
        <h1 style={styles.title}>لا يوجد اتصال بالإنترنت</h1>
        <p style={styles.subtitle}>
          يبدو أنك غير متصل بالشبكة. يرجى التحقق من اتصالك بالإنترنت وإعادة المحاولة.
        </p>
        
        <button 
          style={styles.button} 
          onClick={() => window.location.reload()}
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f8fafc',
    textAlign: 'center',
    padding: '20px'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
    maxWidth: '400px',
    width: '100%'
  },
  iconContainer: {
    backgroundColor: '#fee2e2',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto 20px auto'
  },
  icon: {
    width: '40px',
    height: '40px',
    color: '#ef4444'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '10px'
  },
  subtitle: {
    color: '#64748b',
    marginBottom: '25px',
    lineHeight: '1.5'
  },
  button: {
    backgroundColor: '#00d4ff',
    color: '#1e293b',
    border: 'none',
    padding: '12px 30px',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s'
  }
};

export default OfflinePage;