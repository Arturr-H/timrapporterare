export interface Repository {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    organization?: string;
}

export interface PullRequest {
    id: number;
    number: number;
    title: string;
    user: {
        login: string;
        avatar_url: string;
        html_url: string;
    };
    html_url: string;
    created_at: string;
    merged_at?: string;
    closed_at?: string;
    state: string;
    draft: boolean;
    
    auto_merge?: {
        merge_method: string;
    };
    
    // Lägg till dessa nya fields:
    merge_commit_sha?: string;
    head?: {
        ref: string;
        sha: string;
    };
    base?: {
        ref: string;
        sha: string;
    };
    
    // Repository information for unified PR list
    repo_name?: string;
    repo_id?: number;
}

export interface Commit {
    sha: string;
    message: string;
    author: string;
    date: string;
    url: string;
}

export interface PRCommitsData {
    pull_title: string;
    repo_name: string;
    pull_url: string;
    commits: Commit[];
}

export interface AsanaTask {
    gid: string;
    name: string;
    due_on?: string;
    permalink_url: string;
    section?: string;
}

export interface GitCommit {
    sha: string;
    message: string;
    author: string;
    date: string;
    parents: string[];
    html_url: string;
}

export interface GitBranch {
    name: string;
    commit: {
        sha: string;
        url: string;
    };
    protected: boolean;
}

export interface BranchPoint {
    id: string;
    x: number;
    y: number;
    commit: GitCommit;
    branchName?: string;
    isPR?: boolean;
    prNumber?: number;
    isMainBranch?: boolean;
}

export interface BranchLine {
    from: BranchPoint;
    to: BranchPoint;
    type: 'straight' | 'merge' | 'branch';
}

export interface TimelineGraph {
    points: BranchPoint[];
    lines: BranchLine[];
    timeLabels: { y: number; text: string }[];
}

