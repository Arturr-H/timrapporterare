import React, { useState, useEffect } from "react";
import { AlertCircle, Calendar, CheckSquare, GitBranch } from "lucide-react";
import axios from "axios";
import { Repository, PullRequest, AsanaTask, PRCommitsData } from "./Types";
import TokenModal from "./components/TokenModal";
import AddRepoModal from "./components/AddRepoModal";
import RepoManagementModal from "./components/RepoManagementModal";
import AsanaSidebar from "./components/AsanaSidebar";
import RepositorySelector from "./components/RepositorySelector";
import PRCommitsView from "./components/PRCommitsView";
import PullRequestsList from "./components/PullRequestsList";
import TimeReportNotes from "./components/RichTextEditor";
import { DragAndDroppableItem, DropArea, useContextMenu, DragThumbnail } from "./components/DragAndDrop";
import SettingsModal from "./components/SettingsModal";
import DateFilter from "./components/DateFilter";
import KeyboardSearch from "./handlers/KeyboardSearch";
import PRListWithGitVisualization from "./components/PRListWithGitVisualization";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8086";

const TimeReportApp = () => {
    // State management
    const [selectedRepos, setSelectedRepos] = useState<number[]>([]);
    const [repoManagementModalOpen, setRepoManagementModalOpen] = useState<boolean>(false);
    const [usernameFilter, setUsernameFilter] = useState(() => {
        return localStorage.getItem('repo_username_filter') || '';
    });
    const [repos, setRepos] = useState<Repository[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
    const [selectedPRs, setSelectedPRs] = useState<Set<number>>(new Set());
    const [prCommits, setPrCommits] = useState<Record<string, PRCommitsData>>({});
    const [currentPRIndex, setCurrentPRIndex] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingCommits, setLoadingCommits] = useState<Record<number, boolean>>({});
    const [githubToken, setGithubToken] = useState<string>("");
    const [asanaToken, setAsanaToken] = useState<string>("");
    const [tokenModalOpen, setTokenModalOpen] = useState<boolean>(true);
    const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
    const [addRepoModalOpen, setAddRepoModalOpen] = useState<boolean>(false);
    const [repoUrl, setRepoUrl] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [asanaTasks, setAsanaTasks] = useState<AsanaTask[]>([]);
    const [loadingAsana, setLoadingAsana] = useState<boolean>(false);
    const [selectedCommits, setSelectedCommits] = useState<string[]>([]);
    const [prSearchQuery, setPrSearchQuery] = useState<string>("");
    const [dateFilters, setDateFilters] = useState<string[]>([]);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'repos' | 'asana'>('repos');
    const [isMobile, setIsMobile] = useState(false);

    // Each PR can have multiple assigned tasks from asana
    const [assignedTasks, setAssignedTasks] = useState<{ [key: number]: (AsanaTask)[] }>({});

    const currentDate = new Date().toLocaleDateString("sv-SE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    // Initialize theme
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
        setTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }, []);

    // Handle theme change
    const handleThemeChange = (newTheme: 'dark' | 'light') => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    // Initialize tokens from localStorage
    useEffect(() => {
        const savedGithubToken = localStorage.getItem("github_token");
        const savedAsanaToken = localStorage.getItem("asana_token");
        if (savedGithubToken && savedAsanaToken) {
            setGithubToken(savedGithubToken);
            setAsanaToken(savedAsanaToken);
            setTokenModalOpen(false);
        }
    }, []);

    // Fetch data when tokens are set
    useEffect(() => {
        if (githubToken) {
            fetchRepos();
            fetchFavorites();
        }
        if (asanaToken) {
            fetchAsanaTasks();
        }
    }, [githubToken, asanaToken]);

    // Select all repos by default when repos are first loaded
    useEffect(() => {
        if (repos.length > 0 && selectedRepos.length === 0) {
            const allRepoIds = repos.map(repo => repo.id);
            setSelectedRepos(allRepoIds);
        }
    }, [repos, selectedRepos.length]);

    // Fetch PRs when repos are selected
    useEffect(() => {
        if (selectedRepos.length > 0) {
            fetchAllPullRequests();
        } else {
            setPullRequests([]);
            setSelectedPRs(new Set());
            setPrCommits({});
        }
    }, [selectedRepos]);

    // Refetch PRs when username filter changes
    useEffect(() => {
        if (selectedRepos.length > 0) {
            fetchAllPullRequests();
        }
    }, [usernameFilter]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const fetchRepos = async () => {
        try {
            setError("");
            const response = await axios.get(`${API_URL}/api/saved-repos`, {
                headers: {
                    "Authorization": `Bearer ${githubToken}`
                }
            });
            setRepos(response.data);
            
            // Auto-select all repos if none are currently selected
            if (selectedRepos.length === 0 && response.data.length > 0) {
                const allRepoIds = response.data.map((repo: any) => repo.id);
                setSelectedRepos(allRepoIds);
            }
        } catch (err) {
            console.error("Error fetching repos:", err);
        }
    };

    const fetchFavorites = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/favorites`);
            setFavorites(response.data.favorites.map((f: any) => String(f)));
        } catch (err) {
            console.error("Error fetching favorites:", err);
        }
    };

    const fetchAllPullRequests = async () => {
        setLoading(true);
        try {
            const allPRs: (PullRequest & { repo_name: string, repo_id: number })[] = [];
            
            // Fetch PRs from all selected repos in parallel
            const prPromises = selectedRepos.map(async (repoId) => {
                const repo = repos.find(r => r.id === repoId);
                if (!repo) return [];
                
                const [owner, repoName] = repo.full_name.split("/");
                try {
                    const response = await axios.get(`${API_URL}/api/repos/${owner}/${repoName}/pulls`, {
                        headers: {
                            "Authorization": `Bearer ${githubToken}`
                        }
                    });
                    return response.data.map((pr: PullRequest) => ({
                        ...pr,
                        repo_name: repo.full_name,
                        repo_id: repo.id
                    }));
                } catch (err) {
                    console.error(`Error fetching PRs for ${repo.full_name}:`, err);
                    return [];
                }
            });
            
            const results = await Promise.all(prPromises);
            results.forEach(repoPRs => allPRs.push(...repoPRs));
            
            // Sort by creation date (newest first)
            allPRs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            
            // Apply username filter if set
            const filteredPRs = usernameFilter.trim()
                ? allPRs.filter(pr => pr.user.login.toLowerCase().includes(usernameFilter.toLowerCase()))
                : allPRs;
            
            setPullRequests(filteredPRs as any);
            setSelectedPRs(new Set());
            setPrCommits({});
            setCurrentPRIndex(0);
            setDateFilters([]);
        } catch (err) {
            setError("Kunde inte hämta pull requests.");
            console.error("Error fetching PRs:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCommitsForPR = async (pr: PullRequest & { repo_name?: string }) => {
        const prKey = `${pr.repo_name || 'unknown'}-${pr.number}`;
        setLoadingCommits(prev => ({ ...prev, [pr.number]: true }));
        try {
            const repoFullName = pr.repo_name || selectedRepos.length === 1 ? repos.find(r => selectedRepos.includes(r.id))?.full_name : null;
            if (!repoFullName) {
                console.error("Could not determine repo for PR", pr.number);
                return;
            }
            
            const [owner, repo] = repoFullName.split("/");
            const response = await axios.get(
                `${API_URL}/api/repos/${owner}/${repo}/pulls/${pr.number}/commits`,
                {
                    headers: {
                        "Authorization": `Bearer ${githubToken}`
                    }
                }
            );

            setPrCommits(prev => ({
                ...prev,
                [prKey]: response.data
            }));

            const commitShas = response.data.commits.map((commit: any) => commit.sha);
            setSelectedCommits(prev => {
                const newSelected = new Set(prev);
                commitShas.forEach((sha: string) => newSelected.add(sha));
                return Array.from(newSelected);
            });

        } catch (err) {
            console.error("Error fetching commits:", err);
        } finally {
            setLoadingCommits(prev => ({ ...prev, [pr.number]: false }));
        }
    };

    const fetchAsanaTasks = async () => {
        setLoadingAsana(true);
        try {
            const response = await axios.get(`${API_URL}/api/asana/tasks`, {
                headers: {
                    "asana-token": asanaToken
                }
            });
            setAsanaTasks(response.data.data || []);
        } catch (err) {
            console.error("Error fetching Asana tasks:", err);
        } finally {
            setLoadingAsana(false);
        }
    };

    const handlePRSelection = async (pr: PullRequest) => {
        const newSelected = new Set(selectedPRs);

        if (newSelected.has(pr.id)) {
            newSelected.delete(pr.id);
            setSelectedPRs(newSelected);

            // Remove selected commits for this PR
            const prKey = `${pr.repo_name || 'unknown'}-${pr.number}`;
            for (const commit of prCommits[prKey]?.commits || []) {
                setSelectedCommits(prev => prev.filter(sha => sha !== commit.sha));
            }

            setPrCommits(prev => {
                const updated = { ...prev };
                delete updated[prKey];
                return updated;
            });

            // Remove assigned tasks for this PR
            setAssignedTasks(prev => {
                const updated = { ...prev };
                delete updated[pr.number];
                return updated;
            });
        } else {
            newSelected.add(pr.id);
            setSelectedPRs(newSelected);
            await fetchCommitsForPR(pr);
        }
    };

    const addRepo = async () => {
        try {
            await axios.post(`${API_URL}/api/saved-repos`, { url: repoUrl });
            setRepoUrl("");
            setAddRepoModalOpen(false);
            fetchRepos();
        } catch (err) {
            setError("Kunde inte lägga till repository. Kontrollera URL:en.");
        }
    };

    const removeRepo = async (fullName: string) => {
        try {
            const [owner, repo] = fullName.split("/");
            await axios.delete(`${API_URL}/api/saved-repos/${owner}/${repo}`);
            fetchRepos();
            // Remove from selected repos if it was selected
            const removedRepo = repos.find(r => r.full_name === fullName);
            if (removedRepo && selectedRepos.includes(removedRepo.id)) {
                setSelectedRepos(prev => prev.filter(id => id !== removedRepo.id));
            }
        } catch (err) {
            console.error("Error removing repo:", err);
        }
    };

    const handleCommitSelectionChange = (commitSha: string, isSelected: boolean) => {
        setSelectedCommits(prev => {
            if (isSelected) {
                return [...prev, commitSha];
            } else {
                return prev.filter(sha => sha !== commitSha);
            }
        });
    };

    const toggleFavorite = async (repoId: number) => {
        const stringId = String(repoId);
        const action = favorites.includes(stringId) ? "remove" : "add";

        if (action === "add") {
            setFavorites([...favorites, stringId]);
        } else {
            setFavorites(favorites.filter(f => f !== stringId));
        }

        try {
            const response = await axios.post(`${API_URL}/api/favorites`, {
                repo_id: stringId,
                action: action
            });
            setFavorites(response.data.favorites.map(((f: any) => String(f))));
        } catch (err) {
            if (action === "add") {
                setFavorites(favorites.filter(f => f !== stringId));
            } else {
                setFavorites([...favorites, stringId]);
            }
            console.error("Error updating favorites:", err);
        }
    };

    const saveTokens = () => {
        if (githubToken && asanaToken) {
            localStorage.setItem("github_token", githubToken);
            localStorage.setItem("asana_token", asanaToken);
            setTokenModalOpen(false);
        }
    };

    const handleGenerateSuggestion = async (): Promise<any> => {
        try {
            // Förbered PR data med endast valda PRs
            const selectedPRNumbers = Array.from(selectedPRs).map(id =>
                pullRequests.find(pr => pr.id === id)?.number
            ).filter(Boolean);

            // Skapa en map av PR data med Asana tasks
            const prDataMap: Record<number, any> = {};
            selectedPRs_withRepo.forEach((pr) => {
                if (pr) {
                    const prKey = `${pr.repo_name || 'unknown'}-${pr.number}`;
                    if (prCommits[prKey]) {
                        prDataMap[pr.number] = {
                            ...prCommits[prKey],
                            // Lägg till Asana tasks för denna PR
                            asana_tasks: assignedTasks[pr.number] || []
                        };
                    }
                }
            });

            // Kontrollera att vi har commits valda
            if (selectedCommits.length === 0) {
                console.error('Inga commits valda');
                throw new Error('Inga commits valda');
            }

            console.log('Genererar timrapport med:', {
                commits: selectedCommits,
                prs: Object.keys(prDataMap),
                tasks: Object.entries(prDataMap).reduce((acc: Record<string, number>, [pr, data]) => {
                    acc[pr] = data.asana_tasks.length;
                    return acc;
                }, {})
            });

            // Return the data for streaming endpoint
            return {
                commits: selectedCommits,
                pr_data: prDataMap
            };

        } catch (error: any) {
            console.error('Fel vid generering av timrapport:', error);
            throw error;
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };


    const selectedPRs_withRepo = Array.from(selectedPRs).map(id =>
        pullRequests.find(pr => pr.id === id)
    ).filter(Boolean) as PullRequest[];

    const currentPR = selectedPRs_withRepo[currentPRIndex];
    const currentPRKey = currentPR ? `${currentPR.repo_name || 'unknown'}-${currentPR.number}` : null;
    const currentCommitData = currentPRKey ? prCommits[currentPRKey] : null;

    const { ContextMenuPortal } = useContextMenu();

    // Filter PRs based on search and date filters
    let prsToShow = pullRequests;
    
    // Apply search filter
    if (prSearchQuery) {
        prsToShow = prsToShow.filter(pr => 
            pr.title.toLowerCase().includes(prSearchQuery.toLowerCase())
        );
    }
    
    // Apply date filters
    if (dateFilters.length > 0) {
        prsToShow = prsToShow.filter(pr => {
            const prDate = new Date(pr.created_at).toISOString().split('T')[0];
            return dateFilters.includes(prDate);
        });
    }

    return (
        <>
            <ContextMenuPortal />
            <DragThumbnail />
            <KeyboardSearch />

            <div className="h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 flex flex-col md:flex-row overflow-hidden">

                {/* Desktop sidebar */}
                {!isMobile && (
                    <AsanaSidebar
                        loadingAsana={loadingAsana}
                        asanaTasks={asanaTasks}
                        copyToClipboard={copyToClipboard}
                        onOpenSettings={() => setSettingsModalOpen(true)}
                        collapsed={sidebarCollapsed}
                        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    />
                )}

                {/* Mobile tabs */}
                {isMobile && (
                    <div className="flex border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <button
                            onClick={() => setActiveTab('repos')}
                            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                                activeTab === 'repos'
                                    ? 'border-b-2 border-brand-500 text-brand-600 dark:text-brand-400'
                                    : 'text-gray-500 dark:text-zinc-400'
                            }`}
                        >
                            <GitBranch className="w-4 h-4 inline mr-2" />
                            Repositories
                        </button>
                        <button
                            onClick={() => setActiveTab('asana')}
                            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                                activeTab === 'asana'
                                    ? 'border-b-2 border-brand-500 text-brand-600 dark:text-brand-400'
                                    : 'text-gray-500 dark:text-zinc-400'
                            }`}
                        >
                            <CheckSquare className="w-4 h-4 inline mr-2" />
                            Asana Tasks
                        </button>
                    </div>
                )}

                {/* Main content area */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <TokenModal
                        isOpen={tokenModalOpen}
                        githubToken={githubToken}
                        asanaToken={asanaToken}
                        onGithubTokenChange={setGithubToken}
                        onAsanaTokenChange={setAsanaToken}
                        onSave={saveTokens}
                        onClose={() => setTokenModalOpen(false)}
                    />

                    <SettingsModal
                        isOpen={settingsModalOpen}
                        onClose={() => setSettingsModalOpen(false)}
                        githubToken={githubToken}
                        asanaToken={asanaToken}
                        onGithubTokenChange={setGithubToken}
                        onAsanaTokenChange={setAsanaToken}
                        onSaveTokens={saveTokens}
                        theme={theme}
                        onThemeChange={handleThemeChange}
                    />

                    <AddRepoModal
                        isOpen={addRepoModalOpen}
                        repoUrl={repoUrl}
                        onRepoUrlChange={setRepoUrl}
                        onAdd={addRepo}
                        onClose={() => {
                            setAddRepoModalOpen(false);
                            setRepoUrl("");
                        }}
                    />

                    <RepoManagementModal
                        isOpen={repoManagementModalOpen}
                        onClose={() => setRepoManagementModalOpen(false)}
                        availableRepos={repos}
                        selectedRepoIds={selectedRepos}
                        favorites={favorites}
                        onToggleRepoSelection={(repoId) => {
                            setSelectedRepos(prev => 
                                prev.includes(repoId) 
                                    ? prev.filter(id => id !== repoId)
                                    : [...prev, repoId]
                            );
                        }}
                        onToggleFavorite={toggleFavorite}
                        onRemoveRepo={removeRepo}
                        onAddRepo={() => setAddRepoModalOpen(true)}
                        onUsernameFilterChange={(filter) => {
                            setUsernameFilter(filter);
                            localStorage.setItem('repo_username_filter', filter);
                        }}
                    />

                    {/* Repository content - visa på desktop eller när repos-tab är aktiv på mobil */}
                    {(!isMobile || activeTab === 'repos') && (
                        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-8 bg-white dark:bg-black">
                            <div className="max-w-5xl mx-auto">
                                <div className="mb-6 md:mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white">
                                        Timrapport{selectedRepos.length > 0 ? `:` : ""} 
                                        {selectedRepos.length > 0 && (
                                            <span className="text-brand-600 dark:text-brand-400 text-lg md:text-2xl">
                                                {selectedRepos.length} repo{selectedRepos.length !== 1 ? 's' : ''} selected
                                            </span>
                                        )}
                                    </h2>

                                    <div className="inline-flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-brand-500" />
                                        <h1 className="text-lg md:text-xl text-gray-700 dark:text-gray-300">{currentDate}</h1>
                                    </div>
                                </div>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                        <p className="text-red-600 dark:text-red-400">{error}</p>
                                    </div>
                                )}

                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Repository Selection
                                        </h3>
                                        <button
                                            onClick={() => setRepoManagementModalOpen(true)}
                                            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <GitBranch className="w-4 h-4" />
                                            Manage Repos
                                        </button>
                                    </div>
                                    {selectedRepos.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg">
                                            <GitBranch className="w-12 h-12 text-gray-400 dark:text-zinc-500 mx-auto mb-4" />
                                            <p className="text-gray-500 dark:text-zinc-400 mb-4">No repositories selected</p>
                                            <button
                                                onClick={() => setRepoManagementModalOpen(true)}
                                                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
                                            >
                                                Select Repositories
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
                                            <div className="text-sm text-gray-600 dark:text-zinc-400 mb-3">
                                                Selected repositories ({selectedRepos.length}):
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedRepos.map(repoId => {
                                                    const repo = repos.find(r => r.id === repoId);
                                                    return repo ? (
                                                        <div key={repo.id} className="flex items-center gap-2 px-3 py-2 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg">
                                                            <GitBranch className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                                                            <span className="text-sm text-brand-700 dark:text-brand-300">{repo.name}</span>
                                                        </div>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {selectedRepos.length > 0 && (
                                    <>
                                        <div className="mb-4">
                                            <DateFilter
                                                selectedFilters={dateFilters}
                                                onFilterChange={setDateFilters}
                                            />
                                        </div>
                                        {/* ERSÄTT PullRequestsList MED DETTA: */}
                                        <PRListWithGitVisualization
                                            loading={loading}
                                            pullRequests={prsToShow}
                                            selectedPRs={selectedPRs}
                                            assignedTasks={assignedTasks}
                                            loadingCommits={loadingCommits}
                                            allPRsCount={pullRequests.length}
                                            prSearchQuery={prSearchQuery}
                                            selectedRepos={selectedRepos.map(id => repos.find(r => r.id === id)?.full_name || '').filter(Boolean)}
                                            githubToken={githubToken}
                                            onPRSelect={handlePRSelection}
                                            onCopyLink={(url: any) => copyToClipboard(url)}
                                            setAssignedTasks={setAssignedTasks}
                                            removeAssignedTask={(prNumber: number, taskId: string) => {
                                                setAssignedTasks(prev => {
                                                    const updated = { ...prev };
                                                    updated[prNumber] = updated[prNumber].filter(task => task.gid !== taskId);
                                                    return updated;
                                                });
                                            }}
                                            setPrSearchQuery={setPrSearchQuery}
                                        />
                                    </>
                                )}

                                {selectedPRs_withRepo.length > 0 && currentCommitData && (
                                    <PRCommitsView
                                        currentPRIndex={currentPRIndex}
                                        selectedPRNumbers={selectedPRs_withRepo.map(pr => pr.number)}
                                        currentCommitData={currentCommitData}
                                        onPrev={() => setCurrentPRIndex(Math.max(0, currentPRIndex - 1))}
                                        onNext={() => setCurrentPRIndex(Math.min(selectedPRs_withRepo.length - 1, currentPRIndex + 1))}
                                        onCopyLink={() => copyToClipboard(currentCommitData.pull_url)}
                                        selectedCommits={selectedCommits}
                                        onCommitSelectionChange={handleCommitSelectionChange}
                                        setSelectedCommits={setSelectedCommits}
                                    />
                                )}

                                {((currentCommitData && currentCommitData.commits.length > 0)
                                    || (localStorage.getItem("timeReportNotes") !== undefined && localStorage.getItem("timeReportNotes") !== "")) && (
                                        <>
                                            <div className="mt-8">
                                                <TimeReportNotes
                                                    generateSuggestion={handleGenerateSuggestion}
                                                />
                                            </div>
                                        </>
                                    )}
                            </div>
                        </div>
                    )}
                    
                    {/* Asana content - visa endast på mobil när asana-tab är aktiv */}
                    {isMobile && activeTab === 'asana' && (
                        <div className="flex-1 overflow-hidden">
                            <AsanaSidebar
                                loadingAsana={loadingAsana}
                                asanaTasks={asanaTasks}
                                copyToClipboard={copyToClipboard}
                                onOpenSettings={() => setSettingsModalOpen(true)}
                                collapsed={sidebarCollapsed}
                                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default TimeReportApp;
