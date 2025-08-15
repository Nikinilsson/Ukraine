import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SummaryDisplay } from './components/SummaryDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { LeaningFocusSelector } from './components/LeaningFocusSelector';
import { FocusSummaryDisplay } from './components/FocusSummaryDisplay';
import { KeywordSearch } from './components/KeywordSearch';
import { CoverageChart } from './components/CoverageChart';
import { TimelineDiagram } from './components/TimelineDiagram';
import { generateNewsSummary, generateLeaningFocusSummary, generateCoverageStats, generateCoverageTimeline } from './services/geminiService';
import type { SummaryData, CoverageStats, TimelineDataPoint } from './types';
import { TOPICS } from './constants';

type Leaning = 'Left-Leaning' | 'Center' | 'Right-Leaning';

const App: React.FC = () => {
  const [summaries, setSummaries] = useState<SummaryData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // For main summaries
  const [error, setError] = useState<string | null>(null);

  const [selectedFocus, setSelectedFocus] = useState<Leaning | null>(null);
  const [focusSummary, setFocusSummary] = useState<string | null>(null);
  const [isFocusLoading, setIsFocusLoading] = useState<boolean>(false);
  const [focusError, setFocusError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // New states for coverage feature
  const [coverageStats, setCoverageStats] = useState<CoverageStats | null>(null);
  const [isCoverageLoading, setIsCoverageLoading] = useState<boolean>(true);
  const [coverageError, setCoverageError] = useState<string | null>(null);
  
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[] | null>(null);
  const [isTimelineLoading, setIsTimelineLoading] = useState<boolean>(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  const [showTimeline, setShowTimeline] = useState<boolean>(false);


  useEffect(() => {
    const fetchAllSummaries = async () => {
      setIsLoading(true);
      setError(null);
      
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
            const errorMessage = firstError.reason instanceof Error ? firstError.reason.message : 'An unknown error occurred';
            throw new Error(errorMessage || 'Failed to load any news summaries.');
        }

        setSummaries(successfulSummaries);

      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred while loading news. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCoverageStats = async () => {
        setIsCoverageLoading(true);
        setCoverageError(null);
        try {
            const stats = await generateCoverageStats();
            setCoverageStats(stats);
        } catch (err) {
            setCoverageError(err instanceof Error ? err.message : 'Could not load coverage stats.');
        } finally {
            setIsCoverageLoading(false);
        }
    };

    fetchAllSummaries();
    fetchCoverageStats();
  }, []);

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
      setFocusError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsFocusLoading(false);
    }
  };

  const handleCloseFocus = () => {
    setSelectedFocus(null);
    setFocusSummary(null);
    setFocusError(null);
  };

  const handleTimelineOpen = async () => {
    setShowTimeline(true);
    if (timelineData) return; // Don't refetch if we have the data

    setIsTimelineLoading(true);
    setTimelineError(null);
    try {
        const data = await generateCoverageTimeline();
        setTimelineData(data);
    } catch(err) {
        setTimelineError(err instanceof Error ? err.message : 'Could not load timeline data.');
    } finally {
        setIsTimelineLoading(false);
    }
  };

  const handleTimelineClose = () => {
    setShowTimeline(false);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
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
    return summaries.map(summaryData => (
      <SummaryDisplay key={summaryData.topic} data={summaryData} searchTerm={searchTerm} />
    ));
  };
  
  return (
    <div className="min-h-screen font-sans p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-5xl">
        <Header />
        <main>
          <div className="space-y-6">
            <LeaningFocusSelector
              onSelect={handleFocusSelect}
              selectedFocus={selectedFocus}
              isLoading={isFocusLoading}
            />

            <CoverageChart
              stats={coverageStats}
              isLoading={isCoverageLoading}
              error={coverageError}
              onClick={handleTimelineOpen}
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

          <div className="space-y-8">
            {renderContent()}
          </div>
        </main>
      </div>
      {showTimeline && (
        <TimelineDiagram 
            data={timelineData || []}
            onClose={handleTimelineClose}
            isLoading={isTimelineLoading}
            error={timelineError}
        />
      )}
    </div>
  );
};

export default App;