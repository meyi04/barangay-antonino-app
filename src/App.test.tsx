import React from 'react';
import { render } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';

test('renders without crashing', () => {
  const { baseElement } = render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  expect(baseElement).toBeDefined();
});
