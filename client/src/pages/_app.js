import '../styles/globals.css';
import Head from 'next/head';
import { useEffect } from 'react';
import { getSocket } from '../services/socket';
import { useAuthStore } from '../store/authStore';

export default function App({ Component, pageProps }) {
  const { token, fetchProfile } = useAuthStore();

  useEffect(() => {
    // Initialize socket connection on client mount
    if (typeof window !== 'undefined') {
      getSocket();
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

  return (
    <>
      <Head>
        <title>Agentflow_AI | Agentic AI Operations Automation Platform</title>
        <meta name="description" content="Build, execute, and monitor agentic automation workflows with multi-agent orchestration." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
