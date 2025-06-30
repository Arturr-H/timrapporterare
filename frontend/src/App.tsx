import React, { useState, useEffect } from "react";
import { AlertCircle, Calendar, GitBranch } from "lucide-react";
import axios from "axios";
import { Repository, PullRequest, AsanaTask, PRCommitsData } from "./Types";
import TokenModal from "./components/TokenModal";
import AddRepoModal from "./components/AddRepoModal";
import AsanaSidebar from "./components/AsanaSidebar";
import RepositorySelector from "./components/RepositorySelector";
import PRCommitsView from "./components/PRCommitsView";
import PullRequestsList from "./components/PullRequestsList";
import TimeReportNotes from "./components/RichTextEditor";
import { DragAndDroppableItem, DropArea, useContextMenu, DragThumbnail } from "./components/DragAndDrop";
import SettingsModal from "./components/SettingsModal";
import DateFilter from "./components/DateFilter";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8086";

const TimeReportApp = () => {
    // State management
    const [selectedRepo, setSelectedRepo] = useState<string>("");
    const [repos, setRepos] = useState<Repository[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
    const [selectedPRs, setSelectedPRs] = useState<Set<number>>(new Set());
    const [prCommits, setPrCommits] = useState<Record<number, PRCommitsData>>({});
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

    // Fetch PRs when repo is selected
    useEffect(() => {
        if (selectedRepo) {
            fetchPullRequests();
        }
    }, [selectedRepo]);

    const fetchRepos = async () => {
        try {
            setError("");
            const response = await axios.get(`${API_URL}/api/saved-repos`, {
                headers: {
                    "Authorization": `Bearer ${githubToken}`
                }
            });
            setRepos(response.data);
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

    const fetchPullRequests = async () => {
        setLoading(true);
        try {
            const [owner, repo] = selectedRepo.split("/");
            const response = await axios.get(`${API_URL}/api/repos/${owner}/${repo}/pulls`, {
                headers: {
                    "Authorization": `Bearer ${githubToken}`
                }
            });
            setPullRequests(response.data);
            setSelectedPRs(new Set());
            setPrCommits({});
            setCurrentPRIndex(0);
            setDateFilters([]); // Reset date filters when changing repo
        } catch (err) {
            setError("Kunde inte hämta pull requests.");
            console.error("Error fetching PRs:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCommitsForPR = async (pr: PullRequest) => {
        setLoadingCommits(prev => ({ ...prev, [pr.number]: true }));
        try {
            const [owner, repo] = selectedRepo.split("/");
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
                [pr.number]: response.data
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
            setPrCommits(prev => {
                const updated = { ...prev };
                delete updated[pr.number];
                return updated;
            });

            // Remove selected commits for this PR
            for (const commit of prCommits[pr.number]?.commits || []) {
                setSelectedCommits(prev => prev.filter(sha => sha !== commit.sha));
            }

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
            if (selectedRepo === fullName) {
                setSelectedRepo("");
                setPullRequests([]);
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
            selectedPRNumbers.forEach((prNumber: number | undefined) => {
                if (prNumber && prCommits[prNumber]) {
                    prDataMap[prNumber] = {
                        ...prCommits[prNumber],
                        // Lägg till Asana tasks för denna PR
                        asana_tasks: assignedTasks[prNumber] || []
                    };
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

    const sortedRepos = [...repos].sort((a, b) => {
        const aFav = favorites.includes(String(a.id));
        const bFav = favorites.includes(String(b.id));
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return a.name.localeCompare(b.name);
    });

    const selectedPRNumbers = Array.from(selectedPRs).map(id =>
        pullRequests.find(pr => pr.id === id)?.number
    ).filter(Boolean) as number[];

    const currentPRNumber = selectedPRNumbers[currentPRIndex];
    const currentCommitData = prCommits[currentPRNumber];

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
            <div className="h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 flex overflow-hidden">

                <AsanaSidebar
                    loadingAsana={loadingAsana}
                    asanaTasks={asanaTasks}
                    copyToClipboard={copyToClipboard}
                    onOpenSettings={() => setSettingsModalOpen(true)}
                />

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

                    <div className="flex-1 overflow-y-auto px-8 py-8 bg-white dark:bg-black">
                        <div className="max-w-5xl mx-auto">
                            <div className="mb-12 flex items-center justify-between">
                                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                                    Timrapport{selectedRepo ? ":" : ""} <span className="text-brand-600 dark:text-brand-400">{selectedRepo}</span>
                                </h2>

                                <div className="inline-flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-brand-500" />
                                    <h1 className="text-xl text-gray-700 dark:text-gray-300">{currentDate}</h1>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    <p className="text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            <RepositorySelector
                                selectedRepo={selectedRepo}
                                repos={sortedRepos}
                                favorites={favorites}
                                onSelectRepo={setSelectedRepo}
                                onToggleFavorite={toggleFavorite}
                                onRemoveRepo={removeRepo}
                                onAddRepo={() => setAddRepoModalOpen(true)}
                                onOpenTokenModal={() => setTokenModalOpen(true)}
                            />

                            {selectedRepo && (
                                <>
                                    <div className="mb-4">
                                        <DateFilter
                                            selectedFilters={dateFilters}
                                            onFilterChange={setDateFilters}
                                        />
                                    </div>
                                    <PullRequestsList
                                        loading={loading}
                                        pullRequests={prsToShow}
                                        selectedPRs={selectedPRs}
                                        loadingCommits={loadingCommits}
                                        prSearchQuery={prSearchQuery}
                                        setPrSearchQuery={setPrSearchQuery}
                                        assignedTasks={assignedTasks}
                                        allPRsCount={pullRequests.length}
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
                                    />
                                </>
                            )}

                            {selectedPRNumbers.length > 0 && currentCommitData && (
                                <PRCommitsView
                                    currentPRIndex={currentPRIndex}
                                    selectedPRNumbers={selectedPRNumbers}
                                    currentCommitData={currentCommitData}
                                    onPrev={() => setCurrentPRIndex(Math.max(0, currentPRIndex - 1))}
                                    onNext={() => setCurrentPRIndex(Math.min(selectedPRNumbers.length - 1, currentPRIndex + 1))}
                                    onCopyLink={() => copyToClipboard(currentCommitData.pull_url)}
                                    selectedCommits={selectedCommits}
                                    onCommitSelectionChange={handleCommitSelectionChange}
                                    setSelectedCommits={setSelectedCommits}
                                />
                            )}

                            {((currentCommitData && currentCommitData.commits.length > 0)
                                || (localStorage.getItem("timeReportNotes") !== undefined && localStorage.getItem("timeReportNotes") !== "")) && (
                                    <>
                                        {/* Existing PR list */}
                                        <div className="mt-8">
                                            <TimeReportNotes
                                                generateSuggestion={handleGenerateSuggestion}
                                            />
                                        </div>
                                    </>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TimeReportApp;
