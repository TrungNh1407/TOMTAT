import React from 'react';

export const ChatBubbleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72-3.72a1.05 1.05 0 0 0-1.664-1.664l-3.72-3.72a2.33 2.33 0 0 1 2.193-1.98l4.286-.002Zm-11.487.002a2.33 2.33 0 0 0-2.193 1.98l-3.72 3.72a1.05 1.05 0 0 0 1.664 1.664l3.72 3.72a2.33 2.33 0 0 1-1.98 2.193v-4.286c0-.97.616-1.813 1.5-2.097l.002-4.286Z" />
  </svg>
);
