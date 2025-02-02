// Credits.jsx
import React from 'react';

const Credits = () => {
  return (
    <div className="text-center text-sm text-gray-500 mt-8">
      <p>
        Built with ❤️ by <span className="font-semibold">Ronel Vega</span>
      </p>
      <p>
        Powered by <a href="https://reactjs.org/" className="text-blue-500 hover:underline">React</a>,{' '}
        <a href="https://ui.shadcn.com/" className="text-blue-500 hover:underline">shadcn/ui</a>, and{' '}
        <a href="https://tailwindcss.com/" className="text-blue-500 hover:underline">Tailwind CSS</a>.
      </p>
    </div>
  );
};

export default Credits;