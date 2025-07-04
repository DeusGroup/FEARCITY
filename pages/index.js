// Next.js index page that redirects to static HTML
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Redirect to static index.html
    window.location.href = '/index.html';
  }, []);

  return (
    <div>
      <h1>Redirecting to Fear City Cycles...</h1>
      <p>If you are not automatically redirected, <a href="/index.html">click here</a>.</p>
    </div>
  );
}