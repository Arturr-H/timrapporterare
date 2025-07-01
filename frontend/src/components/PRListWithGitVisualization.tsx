import React, { useState, useEffect, useRef } from 'react';
import { GitCommit, PullRequest, AsanaTask } from '../Types';
import PullRequestsList from './PullRequestsList';
import GitBranchVisualization from './GitBranchVisualization';
import axios from 'axios';

interface PRListWithGitVisualizationProps {
    loading: boolean;
    pullRequests: PullRequest[];
    selectedPRs: Set<number>;
    assignedTasks: { [key: number]: AsanaTask[]; }
    loadingCommits: Record<number, boolean>;
    allPRsCount: number;
    prSearchQuery: string;
    selectedRepo: string;
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
    selectedRepo,
    githubToken,
    onPRSelect,
    onCopyLink,
    setAssignedTasks,
    removeAssignedTask,
    setPrSearchQuery,
}) => {
    const [commits, setCommits] = useState<GitCommit[]>([]);
    const [defaultBranch, setDefaultBranch] = useState<string>('main');
    const [loadingGit, setLoadingGit] = useState(false);
    const [highlightedPR, setHighlightedPR] = useState<number | null>(null);
    const prListRef = useRef<HTMLDivElement>(null);
    
    // Date range state (default to this week)
    const getDefaultDateRange = () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        return { start, end };
    };
    
    const [dateRange, setDateRange] = useState(getDefaultDateRange());

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8086";

    useEffect(() => {
        if (selectedRepo) {
            fetchGitData();
        }
    }, [selectedRepo, dateRange]); // Add dateRange as dependency

    const fetchGitData = async () => {
        setLoadingGit(true);
        try {
            const [owner, repo] = selectedRepo.split("/");
            
            // Fetch default branch
            const branchResponse = await axios.get(
                `${API_URL}/api/repos/${owner}/${repo}/default-branch`,
                {
                    headers: { "Authorization": `Bearer ${githubToken}` }
                }
            );
            setDefaultBranch(branchResponse.data.default_branch);

            // Fetch commits
            const commitsResponse = await axios.get(
                `${API_URL}/api/repos/${owner}/${repo}/commits`,
                {
                    headers: { "Authorization": `Bearer ${githubToken}` },
                    params: { 
                        since: dateRange.start.toISOString(),
                        until: dateRange.end.toISOString()
                    }
                }
            );
            setCommits(commitsResponse.data);
        } catch (err) {
            console.error("Error fetching git data:", err);
        } finally {
            setLoadingGit(false);
        }
    };

    const handlePRHover = (prNumber: number | null) => {
        setHighlightedPR(prNumber);
        
        // Scroll PR into view
        if (prNumber && prListRef.current) {
            const prElement = prListRef.current.querySelector(`[data-pr-number="${prNumber}"]`);
            if (prElement) {
                prElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    return (
        <div className="flex gap-4 mb-8" style={{ height: '600px' }}> {/* Fixed height container */}
            {/* PR List - 2/3 width */}
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
                    highlightedPR={highlightedPR}
                />
            </div>

            {/* Git Visualization - 1/3 width */}
            <div className="w-80 h-full hidden lg:block">
                <GitBranchVisualization
                    commits={commits}
                    pullRequests={pullRequests}
                    defaultBranch={defaultBranch}
                    loading={loadingGit}
                    onHoverPR={handlePRHover}
                    highlightedPR={highlightedPR}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                />
            </div>
        </div>
    );
};

export default PRListWithGitVisualization;
