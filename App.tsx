import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SummaryDisplay } from './components/SummaryDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { LeaningFocusSelector } from './components/LeaningFocusSelector';
import { FocusSummaryDisplay } from './components/FocusSummaryDisplay';
import { KeywordSearch } from './components/KeywordSearch';
import { generateNewsSummary, generateLeaningFocusSummary, verifyGeminiConnection } from './services/geminiService';
import type { SummaryData } from './types';
import { TOPICS } from './constants';
import { CoverageChart } from './components/CoverageChart';
import { TimelineDiagram } from './components/TimelineDiagram';

type Leaning = 'Left-Leaning' | 'Center' | 'Right-Leaning';

/**
 * A helper function to create user-friendly error messages.
 * @param err The error caught.
 * @returns A string with a user-friendly message.
 */
const getErrorMessage = (err: unknown): string => {
    const defaultMessage = 'An unexpected error occurred. Please try again later.';
    if (!(err instanceof Error)) {
      return defaultMessage;
    }

    const message = err.message.toLowerCase();

    // Check for specific configuration or connection errors first
    if (message.includes('api_key') || message.includes('403') || message.includes('permission denied')) {
      return 'Configuration Error: The application cannot connect to the AI service. Please ensure the API_KEY is correctly configured, valid, and has the necessary permissions.';
    }
    if (message.includes('429') || message.includes('quota')) {
        return 'API Limit Reached: The service is experiencing high demand or quota limits have been met. Please try again later.';
    }
    // Check for content-related blocks
    if (message.includes('safety')) {
        return 'Content Blocked: The request was blocked due to safety settings. Please try a different topic.';
    }
    
    return err.message || defaultMessage;
};


const App: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [summaries, setSummaries] = useState<SummaryData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // For main summaries, after API check
  const [error, setError] = useState<string | null>(null);

  const [selectedFocus, setSelectedFocus] = useState<Leaning | null>(null);
  const [focusSummary, setFocusSummary] = useState<string | null>(null);
  const [isFocusLoading, setIsFocusLoading] = useState<boolean>(false);
  const [focusError, setFocusError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // 1. Effect for API connection check
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        await verifyGeminiConnection();
        setApiStatus('ok');
      } catch (err) {
        setError(getErrorMessage(err));
        setApiStatus('error');
      }
    };

    checkApiConnection();
  }, []);

  // 2. Effect for fetching data once API is confirmed OK
  useEffect(() => {
    if (apiStatus !== 'ok') return;

    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      
      const fetchSummaries = async () => {
        try {
            const summaryPromises = TOPICS.map(topic => generateNewsSummary(topic));
            const results = await Promise.allSettled(summaryPromises);

            const successfulSummaries = results
              .filter((result): result is PromiseFulfilledResult<SummaryData> => result.status === 'fulfilled')
              .map(result => result.value);
            
            const failedCount = results.length - successfulSummaries.length;
            if (failedCount > 0) {
                console.error(`${failedCount} summary/summaries failed to load.`);
                results.forEach((result, index) => {
                  if (result.status === 'rejected') {
                    console.error(`Error for topic "${TOPICS[index]}":`, result.reason);
                  }
                });
            }

            if (successfulSummaries.length === 0 && failedCount > 0) {
                const firstError = results.find(r => r.status === 'rejected') as PromiseRejectedResult;
                throw firstError.reason instanceof Error ? firstError.reason : new Error('Failed to load any news summaries.');
            }
            setSummaries(successfulSummaries);
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        }
      };

      await fetchSummaries();
      setIsLoading(false);
    };

    fetchAllData();
  }, [apiStatus]);

  const handleFocusSelect = async (leaning: Leaning) => {
    if (selectedFocus === leaning) {
      handleCloseFocus();
      return;
    }
    setSelectedFocus(leaning);
    setIsFocusLoading(true);
    setFocusSummary(null);
    setFocusError(null);

    try {
      const summary = await generateLeaningFocusSummary(leaning);
      setFocusSummary(summary);
    } catch (err) {
      setFocusError(getErrorMessage(err));
    } finally {
      setIsFocusLoading(false);
    }
  };

  const handleCloseFocus = () => {
    setSelectedFocus(null);
    setFocusSummary(null);
    setFocusError(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner statusMessage="Generating latest news summaries..." />;
    }
    if (error) {
      return <ErrorMessage message={error} />;
    }
    if (summaries.length === 0) {
      return (
        <div className="text-center p-8 bg-black/20 backdrop-blur-xl rounded-lg max-w-3xl mx-auto border border-white/10">
            <h2 className="text-2xl font-bold text-ukraine-yellow mb-4">No Summaries Available</h2>
            <p className="text-gray-300">
                Could not fetch any news summaries at this time. This may be due to a service issue or lack of recent news. Please try again later.
            </p>
        </div>
      );
    }
    return (
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {summaries.map(summaryData => (
          <SummaryDisplay key={summaryData.topic} data={summaryData} searchTerm={searchTerm} />
        ))}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen font-sans p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-5xl">
        <Header />

        {apiStatus === 'checking' && <LoadingSpinner statusMessage="Verifying AI Service Connection..." />}

        {apiStatus === 'error' && <ErrorMessage message={error || 'An unknown connection error occurred.'} />}

        {apiStatus === 'ok' && (
          <>
            <main>
              <div className="mb-6">
                <LeaningFocusSelector
                  onSelect={handleFocusSelect}
                  selectedFocus={selectedFocus}
                  isLoading={isFocusLoading}
                />
              </div>

              <div className="my-6 min-h-[1rem]">
                {focusError && <ErrorMessage message={focusError} />}
                {focusSummary && selectedFocus && !isFocusLoading && (
                  <FocusSummaryDisplay
                    leaning={selectedFocus}
                    summary={focusSummary}
                    onClose={handleCloseFocus}
                  />
                )}
              </div>
              
              {!isLoading && !error && summaries.length > 0 && (
                 <div className="mb-8">
                  <KeywordSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                </div>
              )}

              {renderContent()}
            </main>
          </>
        )}
      </div>
    </div>
  );
};

export default App;