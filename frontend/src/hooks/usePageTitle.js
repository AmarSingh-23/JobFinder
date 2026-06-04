import { useEffect } from 'react';

const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | Job Finder` : 'Job Finder';
    return () => {
      document.title = 'Job Finder';
    };
  }, [title]);
};

export default usePageTitle;
