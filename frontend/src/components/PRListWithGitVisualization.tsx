import React, { useRef } from 'react';
import { PullRequest, AsanaTask } from '../Types';
import PullRequestsList from './PullRequestsList';

interface PRListWithGitVisualizationProps {
    loading: boolean;
    pullRequests: PullRequest[];
    selectedPRs: Set<number>;
    assignedTasks: { [key: number]: AsanaTask[]; }
    loadingCommits: Record<number, boolean>;
    allPRsCount: number;
    prSearchQuery: string;
    selectedRepos: string[];
    githubToken: string;
    onPRSelect: (pr: PullRequest) => void;
    onCopyLink: (url: string) => void;
    setAssignedTasks?: (tasks: { [key: number]: AsanaTask[]; }) => void;
    removeAssignedTask?: (prNumber: number, taskId: string) => void;
    setPrSearchQuery: (query: string) => void;
}

const PRListWithGitVisualization: React.FC<PRListWithGitVisualizationProps> = ({
    loading,
    pullRequests,
    selectedPRs,
    assignedTasks,
    loadingCommits,
    allPRsCount,
    prSearchQuery,
    selectedRepos,
    githubToken,
    onPRSelect,
    onCopyLink,
    setAssignedTasks,
    removeAssignedTask,
    setPrSearchQuery,
}) => {
    const prListRef = useRef<HTMLDivElement>(null);

    return (
        <div className="flex gap-4 mb-8" style={{ height: '600px' }}> {/* Fixed height container */}
            {/* PR List - Full width for multi-repo view */}
            <div className="flex-1 h-full overflow-hidden" ref={prListRef}>
                <PullRequestsList
                    loading={loading}
                    pullRequests={pullRequests.map(pr => ({
                        ...pr,
                        // Add data attribute for scrolling
                        __dataAttributes: { 'data-pr-number': pr.number }
                    }))}
                    selectedPRs={selectedPRs}
                    loadingCommits={loadingCommits}
                    prSearchQuery={prSearchQuery}
                    setPrSearchQuery={setPrSearchQuery}
                    assignedTasks={assignedTasks}
                    allPRsCount={allPRsCount}
                    onPRSelect={onPRSelect}
                    onCopyLink={onCopyLink}
                    setAssignedTasks={setAssignedTasks}
                    removeAssignedTask={removeAssignedTask}
                />
            </div>

            {/* Git Visualization - Only show for single repo */}
            {selectedRepos.length === 1 && (
                <div className="w-80 h-full hidden lg:block">
                    {/* <GitBranchVisualization
                        commits={commits}
                        pullRequests={pullRequests}
                        defaultBranch={defaultBranch}
                        loading={loadingGit}
                        onHoverPR={handlePRHover}
                        highlightedPR={highlightedPR}
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                    /> */}
                </div>
            )}
        </div>
    );
};

export default PRListWithGitVisualization;
