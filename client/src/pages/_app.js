import '../styles/globals.css';
import Head from 'next/head';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export default function App({ Component, pageProps }) {
  const { token, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

  return (
    <>
      <Head>
        <title>CollegeGPT | RAG-Based College Information Assistant</title>
        <meta name="description" content="CollegeGPT - Official AI-Powered Academic Information Assistant with pgvector Grounded RAG." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#080c14" />
        <link rel="icon" href="/collegegpt-icon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
