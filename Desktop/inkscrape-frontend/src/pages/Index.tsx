import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This page just redirects to the landing page
const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
};

export default Index;
